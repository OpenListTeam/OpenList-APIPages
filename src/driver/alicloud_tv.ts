import {Context} from "hono";
import {pubLogin} from "../shares/oauthv2";
import {Requests} from "../shares/request";

// 定义API响应的接口
interface AliCloudTVApiResponse {
    code?: number;
    data?: Record<string, any>;
    t?: string;
    message?: string;
}

// 定义Token数据接口
interface TokenData {
    ciphertext: string;
    iv: string;
}

// 阿里云盘TV版token获取类
class AliyunPanTvToken {
    private timestamp: string;
    private uniqueId: string;
    private wifimac: string;
    private model: string;
    private brand: string;
    private akv: string;
    private apv: string;
    private headersBase: Record<string, string>;

    constructor() {
        this.timestamp = Date.now().toString(); // 设置默认时间戳
        this.uniqueId = this.generateUUID();
        this.wifimac = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        this.model = "SM-S908E";
        this.brand = "Samsung";
        this.akv = "2.6.1143";
        this.apv = "1.4.0.2";

        this.headersBase = {
            "User-Agent": "Mozilla/5.0 (Linux; U; Android 15; zh-cn; SM-S908E Build/UKQ1.231108.001) AppleWebKit/533.1 (KHTML, like Gecko) Mobile Safari/533.1",
            "Host": "api.extscreen.com",
            "Content-Type": "application/json;",
        };
    }

    private generateUUID(): string {
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    private getHeaders(sign: string): Record<string, string> {
        return {
            ...this.headersBase,
            "akv": this.akv,
            "apv": this.apv,
            "b": this.brand,
            "d": this.uniqueId,
            "m": this.model,
            "n": this.model,
            "t": this.timestamp,
            "wifiMac": this.wifimac,
            "sign": sign,
        };
    }

    private getParams(): Record<string, any> {
        return {
            "akv": this.akv,
            "apv": this.apv,
            "b": this.brand,
            "d": this.uniqueId,
            "m": this.model,
            "mac": "",
            "n": this.model,
            "t": this.timestamp,
            "wifiMac": this.wifimac,
        };
    }

    // refreshTimestamp 刷新时间戳
    private async refreshTimestamp(c: Context): Promise<void> {
        try {
            const response = await pubLogin(
                c,
                "",
                "http://api.extscreen.com/timestamp",
                false,
                "GET",
                "json",
                this.headersBase,
            ) as { data?: { timestamp?: number } };

            if (response?.data?.timestamp) {
                this.timestamp = response.data.timestamp.toString();
            }
        } catch (error) {
            console.error("获取时间戳错误:", error);
            this.timestamp = Date.now().toString(); // 如果获取失败，使用当前时间戳
        }
    }

    // h 根据时间戳和字符数组生成哈希值
    private h(charArray: string[], modifier: string): string {
        const uniqueChars = Array.from(new Set(charArray));
        const modifierStr = String(modifier);
        const numericModifierStr = modifierStr.length > 7 ? modifierStr.substring(7) : '0';
        let numericModifier: number;

        try {
            numericModifier = parseInt(numericModifierStr, 10);
            if (isNaN(numericModifier)) numericModifier = 0;
        } catch {
            numericModifier = 0;
        }

        const modVal = numericModifier % 127;
        let transformedString = "";

        for (const c of uniqueChars) {
            const charCode = c.charCodeAt(0);
            let newCharCode = Math.abs(charCode - modVal - 1);

            if (newCharCode < 33) {
                newCharCode += 33;
            }

            transformedString += String.fromCharCode(newCharCode);
        }

        return transformedString;
    }

    // md5 MD5实现
    private async md5(str: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('MD5', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // sha256 SHA-256实现
    private async sha256(str: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // generateKey 生成 aesKey
    private async generateKey(): Promise<string> {
        const params = this.getParams();
        const sortedKeys = Object.keys(params).sort();
        let concatenatedParams = "";
        for (const key of sortedKeys) {
            if (key !== 't') {
                concatenatedParams += String(params[key]);
            }
        }

        const keyArray = concatenatedParams.split('');
        const hashedKey = this.h(keyArray, this.timestamp);
        return await this.md5(hashedKey);
    }

    // generateKeyWithT 由时间戳参与生成 aesKey
    private async generateKeyWithT(t: string): Promise<string> {
        const params = this.getParams();
        params.t = t;
        const sortedKeys = Object.keys(params).sort();
        let concatenatedParams = "";
        for (const key of sortedKeys) {
            if (key !== 't') {
                concatenatedParams += String(params[key]);
            }
        }

        const keyArray = concatenatedParams.split('');
        const hashedKey = this.h(keyArray, t);
        return await this.md5(hashedKey);
    }

    // randomIvStr 随机IV生成
    private randomIvStr(length: number = 16): string {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // encrypt 加密实现
    private async encrypt(plainObj: any): Promise<{ iv: string, ciphertext: string }> {
        // 生成 aes密钥
        const key = await this.generateKey();
        // 生成随机IV
        const ivStr = this.randomIvStr(16);
        // 待加密数据
        const plaintext = JSON.stringify(plainObj).replace(/\s/g, '');

        const encoder = new TextEncoder();
        const keyBytes = encoder.encode(key);
        const ivBytes = encoder.encode(ivStr);
        const plaintextBytes = encoder.encode(plaintext);

        // AES-CBC加密
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: 'AES-CBC', length: 256 },
            false,
            ['encrypt']
        );

        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: 'AES-CBC', iv: ivBytes },
            cryptoKey,
            plaintextBytes
        );

        // 转换为Base64编码
        const encryptedArray = new Uint8Array(encryptedBuffer);
        let binary = '';
        for (let i = 0; i < encryptedArray.length; i++) {
            binary += String.fromCharCode(encryptedArray[i]);
        }
        const base64Ciphertext = btoa(binary);

        return {
            iv: ivStr,
            ciphertext: base64Ciphertext
        };
    }

    // decrypt 解密实现
    private async decrypt(ciphertext: string, iv: string, t?: string): Promise<string> {
        try {
            // 生成密钥
            const key = t ? await this.generateKeyWithT(t) : await this.generateKey();

            // 解码Base64密文
            const binaryString = atob(ciphertext);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // 解码十六进制IV
            const ivBytes = new Uint8Array(iv.length / 2);
            for (let i = 0; i < iv.length; i += 2) {
                ivBytes[i / 2] = parseInt(iv.substring(i, i + 2), 16);
            }

            // 导入密钥
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(key),
                { name: 'AES-CBC', length: 256 },
                false,
                ['decrypt']
            );

            // 解密
            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: 'AES-CBC', iv: ivBytes },
                cryptoKey,
                bytes
            );

            // 转换为字符串
            return new TextDecoder().decode(decryptedBuffer);
        } catch (error) {
            console.error("解密失败:", error);
            throw error;
        }
    }

    // 请求sign生成
    private async computeSign(method: string, apiPath: string): Promise<string> {
        const apiPathAdjusted = "/api" + apiPath;
        const key = await this.generateKey();
        const content = `${method}-${apiPathAdjusted}-${this.timestamp}-${this.uniqueId}-${key}`;
        return await this.sha256(content);
    }

    // getTokenByCode 合并后的函数，处理刷新Token和通过授权码获取Token
    public async getTokenByCode(c: Context, code: string, isRefreshToken: boolean = false): Promise<string> {
        // 刷新时间戳
        await this.refreshTimestamp(c);

        try {
            // 根据是刷新token还是授权码设置不同的请求体
            const bodyObj = isRefreshToken ? { refresh_token: code } : { code: code };
            const encrypted = await this.encrypt(bodyObj);
            const reqBody = {
                iv: encrypted.iv,
                ciphertext: encrypted.ciphertext
            };
            const sign = await this.computeSign("POST", "/v4/token");
            const headers = this.getHeaders(sign);

            // 使用pubLogin替代直接调用Requests
            const responseData = await pubLogin(
                c,
                JSON.stringify(reqBody),
                "https://api.extscreen.com/aliyundrive/v4/token",
                false,
                "POST",
                "json",
                headers
            ) as AliCloudTVApiResponse;

            if (!responseData || responseData.code !== 200 || !responseData.data) {
                throw new Error(responseData ? JSON.stringify(responseData) : "Invalid response data");
            }

            const tokenData = responseData.data as TokenData;
            const t = responseData.t ? responseData.t.toString() : this.timestamp;

            if (!tokenData.ciphertext || !tokenData.iv) {
                throw new Error("Token data missing required fields");
            }

            return await this.decrypt(tokenData.ciphertext, tokenData.iv, t);
        } catch (error) {
            console.error(`获取${isRefreshToken ? "Token" : "RefreshToken"}错误:`, error);
            throw error;
        }
    }

    // getQrcodeUrl 获取二维码链接
    public async getQrcodeUrl(c: Context): Promise<{ qr_link: string, sid: string }> {
        // 刷新时间戳
        await this.refreshTimestamp(c);

        try {
            const bodyObj = {
                scopes: ["user:base", "file:all:read", "file:all:write"].join(","),
                width: 500,
                height: 500
            };
            const encrypted = await this.encrypt(bodyObj);
            const reqBody = {
                iv: encrypted.iv,
                ciphertext: encrypted.ciphertext
            };

            const sign = await this.computeSign("POST", "/v2/qrcode");
            const headers = this.getHeaders(sign);

            // 使用pubLogin替代直接调用Requests
            const responseData = await pubLogin(
                c,
                JSON.stringify(reqBody),
                "https://api.extscreen.com/aliyundrive/v2/qrcode",
                false,
                "POST",
                "json",
                headers
            ) as AliCloudTVApiResponse;

            if (!responseData || responseData.code !== 200 || !responseData.data) {
                throw new Error(responseData ? JSON.stringify(responseData) : "Invalid response data");
            }

            const qrcodeData = responseData.data as TokenData;
            const t = responseData.t ? responseData.t.toString() : this.timestamp;

            if (!qrcodeData.ciphertext || !qrcodeData.iv) {
                throw new Error("QR code data missing required fields");
            }

            const decryptedData = await this.decrypt(qrcodeData.ciphertext, qrcodeData.iv, t);
            const data = JSON.parse(decryptedData) as { sid?: string };

            if (!data.sid) {
                throw new Error("Missing sid in decrypted data");
            }

            const qrLink = "https://www.aliyundrive.com/o/oauth/authorize?sid=" + data.sid;
            return { qr_link: qrLink, sid: data.sid };
        } catch (error) {
            console.error("获取二维码错误:", error);
            throw error;
        }
    }
}

let clientInstance: AliyunPanTvToken | null = null;

// 获取客户端实例的函数
function getClient(): AliyunPanTvToken {
    if (!clientInstance) {
        clientInstance = new AliyunPanTvToken();
    }
    return clientInstance;
}

// checkQrcodeStatus 检查二维码状态
async function checkQrcodeStatus(c: Context, sid: string): Promise<{ auth_code: string } | null> {
    let headersBase ;
    try {
        headersBase = {
            "User-Agent": "Mozilla/5.0 (Linux; U; Android 15; zh-cn; SM-S908E Build/UKQ1.231108.001) AppleWebKit/533.1 (KHTML, like Gecko) Mobile Safari/533.1",
            "Host": "openapi.alipan.com",
            "Content-Type": "text/plain;charset=UTF-8",
        };
        const response = await Requests(
            c,
            "",
            `https://openapi.alipan.com/oauth/qrcode/${sid}/status`,
            "GET",
            false,
            headersBase,
            "json"
        );

        if (response.text) {
            return null;
        }

        if (response && response.status === "LoginSuccess" && response.authCode) {
            return { auth_code: response.authCode };
        }

        return null;
    } catch (error) {
        console.error("检查二维码状态错误:", error);
        throw error;
    }
}

// getQRCode 获取二维码链接
export async function getQRCode(c: Context) {
    try {
        const client = getClient();
        const qrData = await client.getQrcodeUrl(c);
        return c.json({ text: qrData.qr_link, sid: qrData.sid });
    } catch (error) {
        console.error("获取二维码失败:", error);
        return c.json({ text: "获取二维码失败" }, 500);
    }
}

// checkStatus 检查二维码状态
export async function checkStatus(c: Context) {
    try {
        const sid = c.req.query('sid');
        if (!sid) {
            return c.json({ text: "缺少sid参数" }, 400);
        }

        const status = await checkQrcodeStatus(c, sid);
        if (status) {
            return c.json(status);
        }

        return c.json({ text: "等待扫码" }, 202);
    } catch (error) {
        console.error("检查状态失败:", error);
        return c.json({ text: "检查状态失败" }, 500);
    }
}

// getTokenByAuthCode 使用authCode获取Token
export async function getTokenByAuthCode(c: Context) {
    try {
        const authCode = c.req.query('auth_code');
        if (!authCode) {
            return c.json({ text: "缺少auth_code参数" }, 400);
        }

        const client = getClient();
        const tokenData = await client.getTokenByCode(c, authCode, false);
        return c.json(JSON.parse(tokenData));
    } catch (error) {
        console.error("获取Token失败:", error);
        return c.json({ text: "获取Token失败" }, 500);
    }
}

// refreshToken 刷新Token
export async function refreshToken(c: Context) {
    try {
        const refreshToken = c.req.query('refresh_ui');
        if (!refreshToken) {
            return c.json({ text: "缺少refresh_token参数" }, 400);
        }

        const client = getClient();
        const tokenData = await client.getTokenByCode(c, refreshToken, true);
        return c.json(JSON.parse(tokenData));
    } catch (error) {
        console.error("刷新Token失败:", error);
        return c.json({ text: "刷新Token失败" }, 500);
    }
}