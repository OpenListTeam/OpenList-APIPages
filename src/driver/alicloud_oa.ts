import {Context} from "hono";
import * as local from "hono/cookie";
import * as configs from "../shares/configs";
import * as refresh from "../shares/refresh";
import {getCookie, setCookie} from "../shares/cookies";
import {pubLogin} from "../shares/oauthv2";
import {encodeCallbackData, Secrets} from "../shares/secrets";

const driver_map = [
    'https://openapi.aliyundrive.com/oauth/authorize', // 客户端扫码和页面登录
    'https://openapi.aliyundrive.com/oauth/access_token', // 客户端Token获取页
    "https://api.extscreen.com/aliyundrive/v2/qrcode", // TV版本专用的扫码接口
]

interface AliAccessTokenReq {
    client_id: string;
    client_secret: string;
    grant_type: string;
    code: string;
    refresh_token: string;
}

interface AliAccessTokenErr {
    code: string;
    message: string;
    error: string;
}

interface AliQrcodeReq {
    client_id: string;
    client_secret: string;
    scopes: string[];
}

// 登录申请 ##############################################################################
export async function alyLogin(c: Context) {
    const clients: configs.Clients | undefined = configs.getInfo(c);
    if (!clients) return c.json({text: "传入参数缺少"}, 500);
    const client_secret = clients.servers ? c.env.alicloud_key : clients.servers
    let request_urls: string = driver_map[0]
    // 通用参数 =========================================================================
    let params_info: Record<string, any> = {
        client_id: clients.servers ? c.env.alicloud_uid : clients.app_uid,

    }
    // QR扫码需要增加的参数 =============================================================
    if (clients.drivers == "alicloud_tv") {
        request_urls = driver_map[2]
        params_info.client_id = undefined
        params_info.params_info = {
            "iv": "iv",
            "ciphertext": "ciphertext"
        }
    } else if (clients.drivers == "alicloud_go") {
        params_info.redirect_uri = 'https://' + c.env.MAIN_URLS + '/alicloud/callback'
        params_info.response_type = 'code'
        params_info.scope = ['user:base', 'file:all:read', 'file:all:write']
    } else {
        request_urls += "/qrcode"
        params_info.scopes = ['user:base', 'file:all:read', 'file:all:write']
        params_info.client_secret = client_secret
    }
    //需要保存数据到浏览器本地 ==========================================================
    setCookie(c, clients)
    // 执行请求 =========================================================================
    if (clients.drivers == "alicloud_go") {
        return await pubLogin(c, params_info, request_urls,
            true, "GET");
    }
    const result = await pubLogin(c, JSON.stringify(params_info), request_urls,
        false, "POST", "json",
        {'Content-Type': 'application/json'});
    console.log(result);
    if (!result.qrCodeUrl) return c.json({"text": result.message}, 500);
    return c.json({"text": result.qrCodeUrl, "sid": result.sid}, 200);
}


// 令牌申请 ##############################################################################
export async function alyToken(c: Context) {
    const clients_info: configs.Clients = getCookie(c);
    let oauth_type: string | undefined = c.req.query('grant_type')
    if (!clients_info.servers) clients_info.servers = c.req.query('server_use') == "true"
    if (!clients_info.drivers) return c.json({text: 'No Cookies',}, 401);
    if (!oauth_type) oauth_type = "authorization_code";
    const req: AliAccessTokenReq = {
        client_id: clients_info.servers ? c.env.alicloud_uid : <string>c.req.query('client_id') || clients_info.app_uid,
        client_secret: clients_info.servers ? c.env.alicloud_key : <string>c.req.query('client_secret') || clients_info.app_key,
        grant_type: <string>oauth_type,
        code: <string>c.req.query('code'),
        refresh_token: <string>c.req.query('refresh_token')
    };
    if (req.grant_type !== 'authorization_code' && req.grant_type !== 'refresh_token')
        return c.json({text: 'Incorrect GrantType'}, 400);
    if (req.grant_type === 'refresh_token' && req.refresh_token.split('.').length !== 3)
        return c.json({text: 'Incorrect refresh_token or missed',}, 400);
    if (req.grant_type === 'authorization_code' && !req.code)
        return c.json({text: 'Code missed'}, 400);
    if (req.grant_type === 'authorization_code' && clients_info.drivers == "alicloud_qr") {
        let code_urls: string = 'https://openapi.aliyundrive.com/oauth/qrcode/' + req.code + '/status'
        let auth_post: Response = await fetch(code_urls, {method: 'GET'});
        let code_data: Record<string, string> = await auth_post.json();
        if (!auth_post.ok || code_data.status !== "LoginSuccess") {
            return c.json({text: 'Login failed:' + code_data.status}, 401);
        }
        req.code = code_data.authCode;
    }
    local.deleteCookie(c, 'driver_txt');
    local.deleteCookie(c, 'server_use');
    try {
        const response = await fetch(driver_map[1], {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req),
        });
        if (!response.ok) {
            const error: AliAccessTokenErr = await response.json();
            return c.json({text: `${error.code}: ${error.message}`,}, 403);
        }
        const data: Record<string, any> = await response.json();
        if (clients_info.drivers == "alicloud_go") {
            const callbackData: Secrets = {
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                client_uid: clients_info.app_uid,
                client_key: clients_info.app_key,
                driver_txt: clients_info.drivers,
                server_use: clients_info.servers,
            }
            return c.redirect("/#" + encodeCallbackData(callbackData));
        } else return c.json(data);
    } catch (error) {
        return c.json({text: error}, 500
        );
    }
}

// 刷新令牌 ##############################################################################
export async function genToken(c: Context) {
    const clients_info: configs.Clients | undefined = configs.getInfo(c);
    const refresh_text: string | undefined = c.req.query('refresh_ui');
    if (!clients_info) return c.json({text: "传入参数缺少"}, 500);
    if (!refresh_text) return c.json({text: "缺少刷新令牌"}, 500);
    // 请求参数 ==========================================================================
    const params: Record<string, any> = {
        client_id: clients_info.servers ? c.env.alicloud_uid : clients_info.app_uid,
        client_secret: clients_info.servers ? c.env.alicloud_key : clients_info.app_key,
        grant_type: 'refresh_token',
        refresh_token: refresh_text
    };
    return await refresh.pubRenew(c, driver_map[1], params, "POST",
        "access_token", "refresh_token", "message");
}

