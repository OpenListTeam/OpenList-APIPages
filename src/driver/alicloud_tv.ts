import express from 'express';
import * as crypto from 'crypto';
import * as uuid from 'uuid';
import axios from 'axios';
import qrcode from 'qrcode-terminal';
import bodyParser from 'body-parser';
import { Request, Response } from 'express';

const app = express();
app.use(bodyParser.json());

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
        try {
            this.timestamp = '';
            this.uniqueId = uuid.v4().replace(/-/g, '');
            this.wifimac = Math.floor(100000000000 + Math.random() * 900000000000).toString();
            this.model = "SM-S908E";
            this.brand = "samsung";
            this.akv = "2.6.1143";
            this.apv = "1.4.0.2";

            this.headersBase = {
                "User-Agent": "Mozilla/5.0 (Linux; U; Android 15; zh-cn; SM-S908E Build/UKQ1.231108.001) AppleWebKit/533.1 (KHTML, like Gecko) Mobile Safari/533.1",
                "Host": "api.extscreen.com",
                "Content-Type": "application/json;",
            };

            this.initTimestamp();
        } catch (error) {
            console.error("初始化错误:", error);
            process.exit(1);
        }
    }

    private async initTimestamp() {
        try {
            const response = await axios.get("http://api.extscreen.com/timestamp", { timeout: 10000 });
            this.timestamp = response.data.data.timestamp.toString();
        } catch (error) {
            console.error("获取时间戳错误:", error);
            this.timestamp = Date.now().toString();
        }
    }

    private h(charArray: string[], modifier: string): string {
        const uniqueChars = Array.from(new Set(charArray));
        const modifierStr = modifier.toString();
        const numericModifierStr = modifierStr.length > 7 ? modifierStr.substring(7) : '0';
        let numericModifier: number;

        try {
            numericModifier = parseInt(numericModifierStr, 10) || 0;
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

            try {
                transformedString += String.fromCharCode(newCharCode);
            } catch {
                // 跳过无效字符
            }
        }

        return transformedString;
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

    private generateKey(): string {
        const params = this.getParams();
        const sortedKeys = Object.keys(params).sort();
        const concatenatedParams = sortedKeys
            .filter(key => key !== "t")
            .map(key => params[key].toString())
            .join("");

        const keyArray = concatenatedParams.split("");
        const hashedKey = this.h(keyArray, this.timestamp);
        return crypto.createHash('md5').update(hashedKey).digest('hex');
    }

    private generateKeyWithT(t: string): string {
        const params = this.getParams();
        params.t = t;
        const sortedKeys = Object.keys(params).sort();
        const concatenatedParams = sortedKeys
            .filter(key => key !== "t")
            .map(key => params[key].toString())
            .join("");

        const keyArray = concatenatedParams.split("");
        const hashedKey = this.h(keyArray, t);
        return crypto.createHash('md5').update(hashedKey).digest('hex');
    }

    private randomIvStr(length: number = 16): string {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length }, () =>
            chars.charAt(Math.floor(Math.random() * chars.length))
        ).join('');
    }

    private encrypt(plainObj: any): { iv: string, ciphertext: string } {
        const key = this.generateKey();
        const ivStr = this.randomIvStr(16);
        const keyBytes = Buffer.from(key, 'utf-8');
        const ivBytes = Buffer.from(ivStr, 'utf-8');
        const plaintext = Buffer.from(JSON.stringify(plainObj), 'utf-8');

        // PKCS7 填充
        const blockSize = 16;
        const pad = blockSize - (plaintext.length % blockSize);
        const paddedPlaintext = Buffer.concat([
            plaintext,
            Buffer.alloc(pad, pad)
        ]);

        const cipher = crypto.createCipheriv('aes-256-cbc', keyBytes, ivBytes);
        const ciphertext = Buffer.concat([
            cipher.update(paddedPlaintext),
            cipher.final()
        ]);

        return {
            iv: ivStr,
            ciphertext: ciphertext.toString('base64')
        };
    }

    private decrypt(ciphertext: string, iv: string, t?: string): string {
        try {
            const key = t ? this.generateKeyWithT(t) : this.generateKey();
            const keyBytes = Buffer.from(key, 'utf-8');
            const ivBytes = Buffer.from(iv, 'hex');

            const cipher = crypto.createDecipheriv('aes-256-cbc', keyBytes, ivBytes);
            const encryptedBuffer = Buffer.from(ciphertext, 'base64');

            const decrypted = Buffer.concat([
                cipher.update(encryptedBuffer),
                cipher.final()
            ]);

            // PKCS7 去除填充
            const padValue = decrypted[decrypted.length - 1];
            const unpadded = decrypted.slice(0, decrypted.length - padValue);

            return unpadded.toString('utf-8');
        } catch (error) {
            console.error("解密失败:", error);
            throw error;
        }
    }

    private getHeaders(sign: string): Record<string, string> {
        const params = this.getParams();
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

    private computeSign(method: string, apiPath: string): string {
        const apiPathAdjusted = "/api" + apiPath;
        const key = this.generateKey();
        const content = `${method}-${apiPathAdjusted}-${this.timestamp}-${this.uniqueId}-${key}`;
        return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
    }

    public async getToken(refreshToken: string): Promise<string> {
        try {
            const bodyObj = { refresh_token: refreshToken };
            const encrypted = this.encrypt(bodyObj);
            const reqBody = {
                iv: encrypted.iv,
                ciphertext: encrypted.ciphertext
            };

            console.log("[*] (Sign) Request Body:", JSON.stringify(reqBody));

            const sign = this.computeSign("POST", "/v4/token");
            const headers = this.getHeaders(sign);

            const response = await axios.post(
                "https://api.extscreen.com/aliyundrive/v4/token",
                reqBody,
                { headers, timeout: 10000 }
            );

            console.log("[*] (Sign) Response Status:", response.status);
            console.log("[*] (Sign) Response Body:", response.data);

            if (response.data?.code !== 200) {
                throw new Error(JSON.stringify(response.data));
            }

            const tokenData = response.data.data;
            const t = response.data.t || this.timestamp;
            return this.decrypt(tokenData.ciphertext, tokenData.iv, t);
        } catch (error) {
            console.error("获取Token错误:", error);
            throw error;
        }
    }

    public async getRefreshtoken(authToken: string): Promise<string> {
        try {
            const bodyObj = { code: authToken };
            const encrypted = this.encrypt(bodyObj);
            const reqBody = {
                iv: encrypted.iv,
                ciphertext: encrypted.ciphertext
            };

            console.log("[*] (Sign) Request Body:", JSON.stringify(reqBody));

            const sign = this.computeSign("POST", "/v4/token");
            const headers = this.getHeaders(sign);

            console.log("[*] (Sign) Headers:", headers);

            const response = await axios.post(
                "https://api.extscreen.com/aliyundrive/v4/token",
                reqBody,
                { headers, timeout: 10000 }
            );

            console.log("[*] (Sign) Response Status:", response.status);
            console.log("[*] (Sign) Response Body:", response.data);

            if (response.data?.code !== 200) {
                throw new Error(JSON.stringify(response.data));
            }

            const tokenData = response.data.data;
            const t = response.data.t || this.timestamp;
            return this.decrypt(tokenData.ciphertext, tokenData.iv, t);
        } catch (error) {
            console.error("获取RefreshToken错误:", error);
            throw error;
        }
    }

    public async getQrcodeUrl(): Promise<{ qr_link: string, sid: string }> {
        try {
            const bodyObj = {
                scopes: "user:base,file:all:read,file:all:write",
                width: 500,
                height: 500
            };

            const encrypted = this.encrypt(bodyObj);
            const reqBody = {
                iv: encrypted.iv,
                ciphertext: encrypted.ciphertext
            };

            console.log("[*] (Qrcode) Request Body:", JSON.stringify(reqBody));

            const sign = this.computeSign("POST", "/v2/qrcode");
            const headers = this.getHeaders(sign);

            const response = await axios.post(
                "https://api.extscreen.com/aliyundrive/v2/qrcode",
                reqBody,
                { headers, timeout: 10000 }
            );

            console.log("[*] (Qrcode) Response Status:", response.status);
            console.log("[*] (Qrcode) Response Body:", response.data);

            if (response.data?.code !== 200) {
                throw new Error(JSON.stringify(response.data));
            }

            const qrcodeData = response.data.data;
            const t = response.data.t || this.timestamp;
            const decryptedData = this.decrypt(qrcodeData.ciphertext, qrcodeData.iv, t);
            const data = JSON.parse(decryptedData);
            console.log("[*] (Qrcode) Decrypted Data:", data);

            const qrLink = "https://www.aliyundrive.com/o/oauth/authorize?sid=" + data.sid;
            return { qr_link: qrLink, sid: data.sid };
        } catch (error) {
            console.error("获取二维码错误:", error);
            throw error;
        }
    }
}

async function checkQrcodeStatus(sid: string): Promise<{ auth_code: string }> {
    try {
        let status = "NotLoggedIn";
        let authCode: string | null = null;

        while (status !== "LoginSuccess") {
            await new Promise(resolve => setTimeout(resolve, 3000));
            const response = await axios.get(
                `https://openapi.alipan.com/oauth/qrcode/${sid}/status`,
                { timeout: 10000 }
            );

            status = response.data.status;
            if (status === "LoginSuccess") {
                authCode = response.data.authCode;
            }
        }

        return { auth_code: authCode! };
    } catch (error) {
        console.error("检查二维码状态错误:", error);
        throw error;
    }
}

// Express 路由
app.get("/", (req: Request, res: Response) => {
    res.send(`
        <html>
            <body>
                <h1>阿里云盘TV版认证服务</h1>
                <div id="qrcode"></div>
                <script>
                    // 这里可以添加前端逻辑来显示二维码
                </script>
            </body>
        </html>
    `);
});

app.get("/get_qrcode", async (req: Request, res: Response) => {
    try {
        const qrData = await client.getQrcodeUrl();
        res.json(qrData);
    } catch (error) {
        res.status(500).json({ error: "获取二维码失败" });
    }
});

app.get("/check_qrcode/:sid", async (req: Request, res: Response) => {
    try {
        const sid = req.params.sid;
        const status = await checkQrcodeStatus(sid);
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: "检查二维码状态失败" });
    }
});

app.post("/oauth/alipan/authtoken", async (req: Request, res: Response) => {
    try {
        const authCode = req.body.auth_code;
        if (!authCode) {
            return res.status(400).json({ error: "缺少auth_code" });
        }

        const token = await client.getRefreshtoken(authCode);
        console.log("[*] (AliYunPanTV) Token:", token);
        res.status(200).send(token);
    } catch (error) {
        res.status(500).json({ error: "获取Token失败" });
    }
});

app.post('/oauth/alipan/token', async (req: Request, res: Response) => {
    try {
        const refreshToken = req.body.refresh_token;
        if (!refreshToken) {
            return res.status(400).json({ error: "缺少refresh_token" });
        }

        const token = await client.getToken(refreshToken);
        res.status(200).send(token);
    } catch (error) {
        res.status(500).json({ error: "刷新Token失败" });
    }
});



const client = new AliyunPanTvToken();

