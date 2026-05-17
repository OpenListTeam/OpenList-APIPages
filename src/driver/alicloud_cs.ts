import {Context} from "hono";
import * as local from "hono/cookie";
import * as configs from "../shares/configs";
import * as refresh from "../shares/refresh";

// 阿里云盘扫码登录相关接口定义
interface QRCodeData {
    qrCodeUrl: string;
    ck?: string;
    t?: string;
    resultCode?: number;
    processFinished?: boolean;
}

interface QRStatusResponse {
    success: boolean;
    content: {
        qrCodeStatus: string;
        resultCode: number;
        bizExt?: any;
        data?: any;
    };
}

interface UserInfo {
    user_id: string;
    nick_name: string;
    avatar: string;
    phone: string;
    email: string;
}

interface DriveInfo {
    total_size: number;
    used_size: number;
    album_drive_used_size: number;
    note_drive_used_size: number;
}

// 阿里云盘API响应接口
interface AliCloudApiResponse {
    hasError?: boolean;
    content?: {
        success?: boolean;
        data?: {
            codeContent?: string;
            ck?: string;
            t?: string;
            resultCode?: number;
            processFinished?: boolean;
            qrCodeStatus?: string;
            bizExt?: any;
        };
    };
}

// 阿里云盘扫码登录类
class AlipanQRLogin {
    private session_id: string;
    private csrf_token: string;
    private umid_token: string;
    private qr_code_data: QRCodeData | null = null;
    private access_token: string | null = null;
    private refresh_token: string | null = null;

    constructor() {
        this.session_id = this.generateUUID();
        this.csrf_token = "MuSysYVxW5AMGblcOTSKb3";
        this.umid_token = this.generateUUID().replace(/-/g, '');
    }

    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    private getHeaders(): Record<string, string> {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
            'Referer': 'https://passport.alipan.com/',
            'Origin': 'https://passport.alipan.com'
        };
    }

    // 获取OAuth认证URL
    async getOAuthUrl(): Promise<string | null> {
        try {
            const authUrl = "https://auth.alipan.com/v2/oauth/authorize";
            const params = new URLSearchParams({
                'client_id': '25dzX3vbYqktVxyX',
                'redirect_uri': 'https://www.alipan.com/sign/callback',
                'response_type': 'code',
                'login_type': 'custom',
                'state': '{"origin":"https://www.alipan.com"}'
            });

            const response = await fetch(`${authUrl}?${params}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (response.ok) {
                return response.url;
            }
            return null;
        } catch (error) {
            console.error('获取OAuth URL失败:', error);
            return null;
        }
    }

    // 获取登录页面信息
    async getLoginPage(): Promise<boolean> {
        try {
            const loginUrl = "https://passport.alipan.com/mini_login.htm";
            const params = new URLSearchParams({
                'lang': 'zh_cn',
                'appName': 'aliyun_drive',
                'appEntrance': 'web_default',
                'styleType': 'auto',
                'bizParams': '',
                'notLoadSsoView': 'false',
                'notKeepLogin': 'false',
                'isMobile': 'false',
                'ad__pass__q__rememberLogin': 'true',
                'ad__pass__q__rememberLoginDefaultValue': 'true',
                'ad__pass__q__forgotPassword': 'true',
                'ad__pass__q__licenseMargin': 'true',
                'ad__pass__q__loginType': 'normal',
                'hidePhoneCode': 'true',
                'rnd': Date.now().toString()
            });

            const response = await fetch(`${loginUrl}?${params}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (response.ok) {
                const content = await response.text();
                
                // 尝试提取CSRF token
                const csrfMatch = content.match(/_csrf_token["']?\s*[:=]\s*["']([^"']+)["']/);
                if (csrfMatch) {
                    this.csrf_token = csrfMatch[1];
                }

                // 尝试提取umidToken
                const umidMatch = content.match(/umidToken["']?\s*[:=]\s*["']([^"']+)["']/);
                if (umidMatch) {
                    this.umid_token = umidMatch[1];
                }

                return true;
            }
            return false;
        } catch (error) {
            console.error('获取登录页面失败:', error);
            return false;
        }
    }

    // 生成二维码
    async generateQRCode(): Promise<QRCodeData | null> {
        try {
            const qrUrl = "https://passport.alipan.com/newlogin/qrcode/generate.do";
            const params = new URLSearchParams({
                'appName': 'aliyun_drive',
                'fromSite': '52',
                'appEntrance': 'web_default',
                '_csrf_token': this.csrf_token,
                'umidToken': this.umid_token,
                'hsiz': '115d9f5f2cf2f87850a93a793aaaecb4',
                'bizParams': 'taobaoBizLoginFrom=web_default&renderRefer=https%3A%2F%2Fauth.alipan.com%2F',
                'mainPage': 'false',
                'isMobile': 'false',
                'lang': 'zh_CN',
                'returnUrl': '',
                'umidTag': 'SERVER'
            });

            const headers = {
                ...this.getHeaders(),
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            };

            const response = await fetch(`${qrUrl}?${params}`, {
                method: 'GET',
                headers: headers
            });

            if (response.ok) {
                const result = await response.json() as AliCloudApiResponse;
                
                if (!result.hasError) {
                    const content = result.content || {};
                    if (content.success) {
                        const data = content.data || {};
                        const codeContent = data.codeContent;
                        
                        if (codeContent) {
                            this.qr_code_data = {
                                qrCodeUrl: codeContent,
                                ck: data.ck,
                                t: data.t,
                                resultCode: data.resultCode,
                                processFinished: data.processFinished
                            };
                            return this.qr_code_data;
                        }
                    }
                }
            }
            return null;
        } catch (error) {
            console.error('生成二维码失败:', error);
            return null;
        }
    }

    // 查询二维码状态
    async queryQRStatus(): Promise<QRStatusResponse | null> {
        try {
            if (!this.qr_code_data) {
                return null;
            }

            const queryUrl = "https://passport.alipan.com/newlogin/qrcode/query.do";
            const formData = new URLSearchParams({
                'appName': 'aliyun_drive',
                'fromSite': '52'
            });

            if (this.qr_code_data.ck) {
                formData.append('ck', this.qr_code_data.ck);
            }
            if (this.qr_code_data.t) {
                formData.append('t', this.qr_code_data.t);
            }

            const headers = {
                ...this.getHeaders(),
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest'
            };

            const response = await fetch(queryUrl, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            if (response.ok) {
                const result = await response.json() as AliCloudApiResponse;
                
                if (!result.hasError) {
                    const content = result.content || {};
                    if (content.success) {
                        const data = content.data || {};
                        const apiQrStatus = data.qrCodeStatus || 'NEW';
                        const resultCode = data.resultCode || 0;

                        // 状态映射
                        const statusMapping: Record<string, string> = {
                            'NEW': 'WAITING',
                            'SCANED': 'SCANED',
                            'CONFIRMED': 'CONFIRMED',
                            'EXPIRED': 'EXPIRED'
                        };

                        const qrCodeStatus = statusMapping[apiQrStatus] || 'WAITING';

                        return {
                            success: true,
                            content: {
                                qrCodeStatus: qrCodeStatus,
                                resultCode: resultCode,
                                bizExt: data.bizExt || {},
                                data: data
                            }
                        };
                    }
                }
            }
            return null;
        } catch (error) {
            console.error('查询二维码状态失败:', error);
            return null;
        }
    }

    // 获取访问令牌
    async getAccessToken(bizExt: any): Promise<string | null> {
        try {
            // console.log('getAccessToken - bizExt type:', typeof bizExt);
            // console.log('getAccessToken - bizExt:', bizExt);
            
            // bizExt 是 Base64 编码的字符串，需要先解码
            let decodedBizExt: any;
            if (typeof bizExt === 'string') {
                try {
                    const decodedString = atob(bizExt);
                    decodedBizExt = JSON.parse(decodedString);
                    // console.log('getAccessToken - decoded bizExt:', JSON.stringify(decodedBizExt, null, 2));
                } catch (decodeError) {
                    console.error('解码 bizExt 失败:', decodeError);
                    return null;
                }
            } else {
                decodedBizExt = bizExt;
            }
            
            if (!decodedBizExt || !decodedBizExt.pds_login_result) {
                // console.log('getAccessToken - No pds_login_result found in decoded data');
                return null;
            }

            const loginResult = decodedBizExt.pds_login_result;
            // console.log('getAccessToken - loginResult:', JSON.stringify(loginResult, null, 2));
            this.access_token = loginResult.accessToken;
            this.refresh_token = loginResult.refreshToken;
            // console.log('getAccessToken - access_token set:', this.access_token ? 'success' : 'failed');
            // console.log('getAccessToken - refresh_token set:', this.refresh_token ? 'success' : 'failed');
            return this.access_token;
        } catch (error) {
            console.error('获取访问令牌失败:', error);
            return null;
        }
    }

    // 获取用户信息
    async getUserInfo(): Promise<UserInfo | null> {
        try {
            if (!this.access_token) {
                return null;
            }

            const userUrl = "https://user.aliyundrive.com/v2/user/get";
            const headers = {
                'Authorization': `Bearer ${this.access_token}`,
                'Content-Type': 'application/json'
            };

            const response = await fetch(userUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({})
            });

            if (response.ok) {
                return await response.json() as UserInfo;
            }
            return null;
        } catch (error) {
            console.error('获取用户信息失败:', error);
            return null;
        }
    }

    // 获取网盘信息
    async getDriveInfo(): Promise<DriveInfo | null> {
        try {
            if (!this.access_token) {
                return null;
            }

            const driveUrl = "https://api.aliyundrive.com/adrive/v1/user/driveCapacityDetails";
            const headers = {
                'Authorization': `Bearer ${this.access_token}`,
                'Content-Type': 'application/json'
            };

            const response = await fetch(driveUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({})
            });

            if (response.ok) {
                return await response.json() as DriveInfo;
            }
            return null;
        } catch (error) {
            console.error('获取网盘信息失败:', error);
            return null;
        }
    }

    // 检查是否已登录
    isLoggedIn(): boolean {
        return !!this.access_token;
    }

    // 获取访问令牌（用于返回给前端）
    getToken(): string | null {
        return this.access_token;
    }

    // 获取刷新令牌
    getRefreshToken(): string | null {
        return this.refresh_token;
    }
}

// 会话管理接口
interface SessionData {
    instance: AlipanQRLogin;
    createdAt: number;
    lastAccess: number;
    clientFingerprint?: string;
}

// 全局实例存储 - 改为存储会话数据而不是直接存储实例
const loginSessions = new Map<string, SessionData>();

// 会话过期时间（30分钟）
const SESSION_TIMEOUT = 30 * 60 * 1000;

// 生成安全的会话ID
function generateSecureSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    const randomPart2 = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomPart}-${randomPart2}`;
}

// 清理过期会话
function cleanupExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, sessionData] of loginSessions.entries()) {
        if (now - sessionData.lastAccess > SESSION_TIMEOUT) {
            loginSessions.delete(sessionId);
            // console.log(`清理过期会话: ${sessionId}`);
        }
    }
}

// 注意：不能在全局作用域使用 setInterval，改为在每次请求时检查过期会话

// 获取或创建会话
function getOrCreateSession(sessionId?: string, clientFingerprint?: string): { sessionId: string, sessionData: SessionData } {
    const now = Date.now();
    
    // 如果提供了sessionId，尝试获取现有会话
    if (sessionId && loginSessions.has(sessionId)) {
        const sessionData = loginSessions.get(sessionId)!;
        
        // 检查会话是否过期
        if (now - sessionData.lastAccess > SESSION_TIMEOUT) {
            loginSessions.delete(sessionId);
            // console.log(`会话已过期，删除: ${sessionId}`);
        } else {
            // 更新最后访问时间
            sessionData.lastAccess = now;
            return { sessionId, sessionData };
        }
    }
    
    // 创建新会话
    const newSessionId = generateSecureSessionId();
    const newSessionData: SessionData = {
        instance: new AlipanQRLogin(),
        createdAt: now,
        lastAccess: now,
        clientFingerprint
    };
    
    loginSessions.set(newSessionId, newSessionData);
    // console.log(`创建新会话: ${newSessionId}, 客户端指纹: ${clientFingerprint || 'none'}`);

    return { sessionId: newSessionId, sessionData: newSessionData };
}

// 验证会话所有权（可选的额外安全措施）
function validateSessionOwnership(sessionId: string, clientFingerprint?: string): boolean {
    const sessionData = loginSessions.get(sessionId);
    if (!sessionData) return false;
    
    // 如果设置了客户端指纹，进行验证
    if (sessionData.clientFingerprint && clientFingerprint) {
        return sessionData.clientFingerprint === clientFingerprint;
    }
    
    return true;
}

// 生成二维码接口
export async function generateQR(c: Context) {
    try {
        // 清理过期会话
        cleanupExpiredSessions();
        
        const requestedSessionId = c.req.query('session_id');
        const clientFingerprint = c.req.header('X-Client-Fingerprint') || c.req.header('User-Agent');
        
        // 获取或创建会话
        const { sessionId, sessionData } = getOrCreateSession(requestedSessionId, clientFingerprint);
        const alipan = sessionData.instance;

        // 获取OAuth URL
        const oauthUrl = await alipan.getOAuthUrl();
        if (!oauthUrl) {
            return c.json({error: '获取OAuth URL失败，请检查网络连接'}, 500);
        }

        // 获取登录页面
        const loginPageResult = await alipan.getLoginPage();
        if (!loginPageResult) {
            return c.json({error: '获取登录页面失败，请检查网络连接'}, 500);
        }

        // 生成二维码
        const qrData = await alipan.generateQRCode();
        if (!qrData) {
            return c.json({error: '生成二维码失败，可能是网络问题或API变化，请稍后重试'}, 500);
        }

        // console.log(`会话 ${sessionId} 生成二维码成功`);

        return c.json({
            success: true,
            session_id: sessionId,
            qr_code_url: qrData.qrCodeUrl,
            message: '二维码生成成功，请使用阿里云盘App扫码登录',
            expires_in: SESSION_TIMEOUT / 1000 // 返回过期时间（秒）
        });

    } catch (error) {
        console.error('生成二维码失败:', error);
        return c.json({error: '生成二维码失败'}, 500);
    }
}

// 检查登录状态接口
export async function checkLogin(c: Context) {
    try {
        const sessionId = c.req.query('session_id');
        if (!sessionId) {
            return c.json({error: '缺少session_id参数'}, 400);
        }

        const clientFingerprint = c.req.header('X-Client-Fingerprint') || c.req.header('User-Agent');
        
        // 验证会话所有权
        if (!validateSessionOwnership(sessionId, clientFingerprint)) {
            return c.json({error: '会话验证失败'}, 403);
        }

        const sessionData = loginSessions.get(sessionId);
        if (!sessionData) {
            return c.json({error: '会话不存在或已过期'}, 404);
        }

        // 更新最后访问时间
        sessionData.lastAccess = Date.now();
        
        const alipan = sessionData.instance;

        // 查询二维码状态
        const statusResult = await alipan.queryQRStatus();
        if (!statusResult) {
            return c.json({error: '查询登录状态失败'}, 500);
        }

        const status = statusResult.content.qrCodeStatus;
        
        // 如果登录成功，获取访问令牌
        if (status === 'CONFIRMED') {
            const accessToken = await alipan.getAccessToken(statusResult.content.bizExt);
            // console.log(`会话 ${sessionId} - 登录确认，token获取: ${accessToken ? '成功' : '失败'}`);
            if (accessToken) {
                return c.json({
                    success: true,
                    status: 'CONFIRMED',
                    message: '登录成功',
                    access_token: accessToken
                });
            }
        }

        // 状态消息映射
        const statusMessages: Record<string, string> = {
            'WAITING': '等待扫描',
            'SCANED': '已扫描，等待确认',
            'CONFIRMED': '登录成功',
            'EXPIRED': '二维码已过期'
        };

        return c.json({
            success: true,
            status: status,
            message: statusMessages[status] || '未知状态'
        });

    } catch (error) {
        console.error('检查登录状态失败:', error);
        return c.json({error: '检查登录状态失败'}, 500);
    }
}

// 获取用户信息接口
export async function getUserInfo(c: Context) {
    try {
        const sessionId = c.req.query('session_id');
        if (!sessionId) {
            return c.json({error: '缺少session_id参数'}, 400);
        }

        const clientFingerprint = c.req.header('X-Client-Fingerprint') || c.req.header('User-Agent');
        
        // 验证会话所有权
        if (!validateSessionOwnership(sessionId, clientFingerprint)) {
            return c.json({error: '会话验证失败'}, 403);
        }

        const sessionData = loginSessions.get(sessionId);
        if (!sessionData) {
            return c.json({error: '会话不存在或已过期'}, 404);
        }

        // 更新最后访问时间
        sessionData.lastAccess = Date.now();
        
        const alipan = sessionData.instance;

        // 检查是否已经登录成功
        // console.log(`会话 ${sessionId} - 登录状态: ${alipan.isLoggedIn()}, token: ${alipan.getToken() ? '存在' : '不存在'}`);
        if (!alipan.isLoggedIn()) {
            return c.json({error: '用户尚未登录成功，请先完成扫码登录'}, 400);
        }

        // 获取用户信息
        const userInfo = await alipan.getUserInfo();
        if (!userInfo) {
            return c.json({error: '获取用户信息失败，可能是token已过期'}, 500);
        }

        // 获取网盘信息
        const driveInfo = await alipan.getDriveInfo();

        return c.json({
            success: true,
            user_info: userInfo,
            drive_info: driveInfo,
            access_token: alipan.getToken(),
            refresh_token: alipan.getRefreshToken()
        });

    } catch (error) {
        console.error('获取用户信息失败:', error);
        return c.json({error: '获取用户信息失败'}, 500);
    }
}

// 退出登录接口
export async function logout(c: Context) {
    try {
        const sessionId = c.req.query('session_id');
        if (!sessionId) {
            return c.json({error: '缺少session_id参数'}, 400);
        }

        const clientFingerprint = c.req.header('X-Client-Fingerprint') || c.req.header('User-Agent');
        
        // 验证会话所有权
        if (!validateSessionOwnership(sessionId, clientFingerprint)) {
            return c.json({error: '会话验证失败'}, 403);
        }

        // 删除会话
        const deleted = loginSessions.delete(sessionId);
        // console.log(`会话 ${sessionId} 退出登录: ${deleted ? '成功' : '会话不存在'}`);

        return c.json({
            success: true,
            message: '退出登录成功'
        });

    } catch (error) {
        console.error('退出登录失败:', error);
        return c.json({error: '退出登录失败'}, 500);
    }
}

// 刷新令牌 ##############################################################################
export async function genToken(c: Context) {
    const refresh_text: string | undefined = c.req.query('refresh_ui');
    if (!refresh_text) return c.json({text: "缺少刷新令牌"}, 500);
    // 请求参数 ==========================================================================
    const params: Record<string, any> = {
        grant_type: 'refresh_token',
        refresh_token: refresh_text
    };
    const post_url = "https://openapi.aliyundrive.com/oauth/access_token"
    return await refresh.pubRenew(c, post_url, params, "POST",
        "access_token", "refresh_token", "message");
}