#!/usr/local/bin/python3
# pylint: disable=C0114
# pylint: disable=C0116
# pylint: disable=C0103

import time
import os
import logging
import json
import uuid
import hashlib
import base64
import random
import argparse
import sys
import string

import requests
import qrcode
from flask import Flask, jsonify, render_template, request,Response
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad


logging.basicConfig(level=logging.INFO)
app = Flask(__name__)


class AliyunPanTvToken:
    """
    阿里云盘 TV Token 解密刷新模块
    """

    def __init__(self):
        try:
            self.timestamp = str(requests.get("http://api.extscreen.com/timestamp", timeout=10).json()["data"]["timestamp"])
            self.unique_id = uuid.uuid4().hex
            self.wifimac = str(random.randint(10**11, 10**12 - 1))
            self.model = "SM-S908E"
            self.brand = "samsung"
            self.akv = "2.6.1143"
            self.apv = "1.4.0.2"
            self.headers_base = {
                "User-Agent": "Mozilla/5.0 (Linux; U; Android 15; zh-cn; SM-S908E Build/UKQ1.231108.001) AppleWebKit/533.1 (KHTML, like Gecko) Mobile Safari/533.1",
                "Host": "api.extscreen.com",
                "Content-Type": "application/json;",
            }
        except Exception as e:  # pylint: disable=W0718
            logging.error("错误：%s", e)
            sys.exit(1)

    def h(self, char_array, modifier):
        unique_chars = list(dict.fromkeys(char_array))
        modifier_str = str(modifier)
        numeric_modifier_str = modifier_str[7:] if len(modifier_str) > 7 else '0'
        try:
            numeric_modifier = int(numeric_modifier_str)
        except Exception:
            numeric_modifier = 0
        mod_val = numeric_modifier % 127
        transformed_string = ""
        for c in unique_chars:
            char_code = ord(c)
            new_char_code = abs(char_code - mod_val - 1)
            if new_char_code < 33:
                new_char_code += 33
            try:
                transformed_string += chr(new_char_code)
            except Exception:
                pass
        return transformed_string

    def get_params(self):
        params = {
            "akv": self.akv,
            "apv": self.apv,
            "b": self.brand,
            "d": self.unique_id,
            "m": self.model,
            "mac": "",
            "n": self.model,
            "t": self.timestamp,
            "wifiMac": self.wifimac,
        }
        return params

    def generate_key(self):
        params = self.get_params()
        sorted_keys = sorted(params.keys())
        concatenated_params = "".join([str(params[key]) for key in sorted_keys if key != "t"])
        key_array = list(concatenated_params)
        hashed_key = self.h(key_array, self.timestamp)
        return hashlib.md5(hashed_key.encode("utf-8")).hexdigest()
    
    def random_iv_str(self, length=16):
        # 生成 16 位字符串 iv, [a-z0-9]
        chars = string.ascii_lowercase + string.digits
        return ''.join(random.choices(chars, k=length))

    def encrypt(self, plain_obj):
        key = self.generate_key()
        iv_str = self.random_iv_str(16)
        key_bytes = key.encode("utf-8")
        iv_bytes = iv_str.encode("utf-8")
        plaintext = json.dumps(plain_obj, separators=(',', ':')).encode("utf-8")
        # PKCS7 padding, block_size=16
        cipher = AES.new(key_bytes, AES.MODE_CBC, iv=iv_bytes)
        ciphertext = cipher.encrypt(pad(plaintext, AES.block_size))
        return {
            "iv": iv_str,
            "ciphertext": base64.b64encode(ciphertext).decode("utf-8"),
        }

    def decrypt(self, ciphertext, iv, t=None):
        try:
            # t: 服务器响应时用的时间戳（响应体data外的t字段），如果无则用self.timestamp
            key = self.generate_key() if t is None else self.generate_key_with_t(t)
            # 响应iv为hex
            key_bytes = key.encode("utf-8")
            iv_bytes = bytes.fromhex(iv)
            cipher = AES.new(key_bytes, AES.MODE_CBC, iv=iv_bytes)
            decrypted = unpad(cipher.decrypt(base64.b64decode(ciphertext)), AES.block_size)
            return decrypted.decode("utf-8")
        except Exception as error:
            logging.error("Decryption failed %s", error)
            raise error

    def generate_key_with_t(self, t):
        params = self.get_params()
        params["t"] = t
        sorted_keys = sorted(params.keys())
        concatenated_params = "".join([str(params[key]) for key in sorted_keys if key != "t"])
        key_array = list(concatenated_params)
        hashed_key = self.h(key_array, t)
        return hashlib.md5(hashed_key.encode("utf-8")).hexdigest()

    def get_headers(self, sign):
        params = self.get_params()
        return {
            **self.headers_base,
            "akv": self.akv,
            "apv": self.apv,
            "b": self.brand,
            "d": self.unique_id,
            "m": self.model,
            "n": self.model,
            "t": self.timestamp,
            "wifiMac": self.wifimac,
            "sign": sign,
        }
    def compute_sign(self, method, api_path):
        #  https://api.extscreen.com/aliyundrive/v4/token

        # 请求中的iv为字符串，
        # 响应中的iv为hex

        # 请求中的 sign 计算逻辑：
        # sha256(HTTP方法 - API路径 - 时间戳(t) - 设备ID(d) - 派生的MD5密钥)
        # HTTP方法 - API路径 - 时间戳(t) - 设备ID(d) - 派生的AES密钥

        # 注意API路径，例如/aliyundrive/v4/token 的路径为 /v4/token
        api_path = "/api"+ api_path
        key = self.generate_key()
        content = f"{method}-{api_path}-{self.timestamp}-{self.unique_id}-{key}"
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

    def get_token(self, refresh_token):
        try:
            # 构造加密请求体
            body_obj = {
                "refresh_token": refresh_token
            }
            encrypted = self.encrypt(body_obj)
            req_body = {
                "iv": encrypted["iv"],
                "ciphertext": encrypted["ciphertext"]
            }
            
            print(f"[*] (Sign) Request Body: {json.dumps(req_body)}")
            
            sign = self.compute_sign("POST", "/v4/token")
            headers = self.get_headers(sign)
            resp = requests.post(
                "https://api.extscreen.com/aliyundrive/v4/token",
                data=json.dumps(req_body),
                headers=headers,
                timeout=10
            )
            
            print(f"[*] (Sign) Response Status: {resp.status_code}")
            print(f"[*] (Sign) Response Body: {resp.text}")
            
            resp.raise_for_status()
            j = resp.json()
            if j.get("code") != 200:
                raise Exception(j)
            token_data = j["data"]
            t = j.get("t", self.timestamp)
            return self.decrypt(token_data["ciphertext"], token_data["iv"], t)
        except Exception as e:  # pylint: disable=W0718
            logging.error("错误：%s", e)
            sys.exit(1)

    def get_refreshtoken(self, auth_token):
        # 构造加密请求体
        body_obj = {
            "code": auth_token
        }
        encrypted = self.encrypt(body_obj)
        req_body = {
            "iv": encrypted["iv"],
            "ciphertext": encrypted["ciphertext"]
        }
        
        print(f"[*] (Sign) Request Body: {json.dumps(req_body)}")
        
        sign = self.compute_sign("POST", "/v4/token")
        headers = self.get_headers(sign)
        
        print(f"[*] (Sign) Headers: {headers}")
        
        resp = requests.post(
            "https://api.extscreen.com/aliyundrive/v4/token",
            data=json.dumps(req_body),
            headers=headers,
            timeout=10
        )
        
        print(f"[*] (Sign) Response Status: {resp.status_code}")
        print(f"[*] (Sign) Response Body: {resp.text}")
        
        resp.raise_for_status()
        j = resp.json()
        if j.get("code") != 200:
            raise Exception(j)
        token_data = j["data"]
        t = j.get("t", self.timestamp)
        return self.decrypt(token_data["ciphertext"], token_data["iv"], t)

    def get_qrcode_url(self):
        try:
            # 构造加密请求体
            body_obj = {
                "scopes": ",".join(["user:base", "file:all:read", "file:all:write"]),
                "width": 500,
                "height": 500,
            }
            encrypted = self.encrypt(body_obj)
            req_body = {
                "iv": encrypted["iv"],
                "ciphertext": encrypted["ciphertext"]
            }
            
            print(f"[*] (Qrcode) Request Body: {json.dumps(req_body)}")
            
            sign = self.compute_sign("POST", "/v2/qrcode")
            headers = self.get_headers(sign)
            
            resp = requests.post(
                "https://api.extscreen.com/aliyundrive/v2/qrcode",
                data=json.dumps(req_body),
                headers=headers,
                timeout=10,
            )
            
            print(f"[*] (Qrcode) Response Status: {resp.status_code}")
            print(f"[*] (qrcode) Response Body: {resp.text}")
            
            resp.raise_for_status()
            j = resp.json()
            if j.get("code") != 200:
                raise Exception(j)
            qrcode_data = j["data"]
            t = j.get("t", self.timestamp)
            decrypted_data = self.decrypt(qrcode_data["ciphertext"], qrcode_data["iv"], t)
            data = json.loads(decrypted_data)
            print(f"[*] (Qrcode) Decrypted Data: {data}")
            
            qr_link = "https://www.aliyundrive.com/o/oauth/authorize?sid=" + data["sid"]
            return {"qr_link": qr_link, "sid": data["sid"]}
        except Exception as e:  # pylint: disable=W0718
            logging.error("错误：%s", e)
            sys.exit(1)


def check_qrcode_status(sid):
    try:
        status = "NotLoggedIn"
        _auth_code = None
        while status != "LoginSuccess":
            time.sleep(3)
            result = requests.get(f"https://openapi.alipan.com/oauth/qrcode/{sid}/status", timeout=10).json()
            status = result["status"]
            if status == "LoginSuccess":
                _auth_code = result["authCode"]
        return {"auth_code": _auth_code}
    except Exception as e:  # pylint: disable=W0718
        logging.error("错误：%s", e)
        sys.exit(1)



@app.route("/")
def main_page():
    return render_template("qrcode.html")


@app.route("/get_qrcode", methods=["GET"])
def get_qrcode():
    return jsonify(CLIENT.get_qrcode_url())


@app.route("/check_qrcode/<sid>", methods=["GET"])
def check_qrcode(sid):
    return jsonify(check_qrcode_status(sid))


@app.route("/oauth/alipan/authtoken", methods=["POST"])
def get_tokens():
    _auth_code = request.json.get("auth_code")
    token = CLIENT.get_refreshtoken(_auth_code)
    print(f"[*] (AliYunPanTV) Token: {token}")
    return Response(token, status=200, mimetype='application/json')

@app.route('/oauth/alipan/token', methods=['POST'])
def oauth_token_v4():
    data = request.get_json()
    refresh_token = data.get('refresh_token', None)
    if not refresh_token:
        return Response(json.dumps({"error": "No refresh_token provided"}), status=400, mimetype='application/json')
    try:
        token = CLIENT.get_token(refresh_token)
    except Exception as e:
        return Response(json.dumps({"error": str(e)}), status=500, mimetype='application/json')
    return Response(token, status=200, mimetype='application/json')

@app.route("/shutdown_server", methods=["GET"])
def shutdown():
    os._exit(0)


CLIENT = AliyunPanTvToken()
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AliyunPan TV Token")
    parser.add_argument("--qrcode_mode", type=str, required=True, help="扫码模式")
    args = parser.parse_args()
    if args.qrcode_mode == "web":
        app.run(host="0.0.0.0", port=34256)
    elif args.qrcode_mode == "shell":
        date = CLIENT.get_qrcode_url()
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=5, border=4)
        qr.add_data(date["qr_link"])
        qr.make(fit=True)
        logging.info("请打开阿里云盘扫描此二维码！")
        qr.print_ascii(invert=True, tty=sys.stdout.isatty())
        auth_code = check_qrcode_status(date["sid"])["auth_code"]
        CLIENT.get_refreshtoken(auth_code)
    else:
        logging.error("未知的扫码模式")
        os._exit(1)
