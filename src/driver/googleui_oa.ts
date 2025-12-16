import * as local from "hono/cookie";
import {Context} from "hono";
import {showErr} from "../shares/message";
import * as configs from "../shares/configs";
import * as refresh from "../shares/refresh";
import {encodeCallbackData, Secrets} from "../shares/secrets";

const driver_map: string[] = [
    "https://accounts.google.com/o/oauth2/v2/auth",
    "https://oauth2.googleapis.com/token"
]

// 登录申请 ##############################################################################
export async function oneLogin(c: Context) {
    const client_uid: string = <string>c.req.query('client_uid');
    const client_key: string = <string>c.req.query('client_key');
    const driver_txt: string = <string>c.req.query('driver_txt');
    const server_use: string = <string>c.req.query('server_use');
    if (server_use == "false" && (!driver_txt || !client_uid || !client_key))
        return c.json({text: "参数缺少"}, 500);
    const random_key = getRandomString(32);
    // 请求参数 ==========================================================================
    const params_all: Record<string, any> = {
        'client_id': server_use == "true" ? c.env.googleui_uid : client_uid,
        'redirect_uri': 'https://' + c.env.MAIN_URLS + '/googleui/callback',
        'scope': "https://www.googleapis.com/auth/drive",
        'response_type': 'code',
        'state': random_key,
        'access_type': 'offline',
        'prompt': 'consent'
    };
    if (server_use == "false") {
        local.setCookie(c, 'client_uid', client_uid);
        local.setCookie(c, 'client_key', client_key);
    }
    local.setCookie(c, 'driver_txt', driver_txt);
    local.setCookie(c, 'random_key', random_key);
    local.setCookie(c, 'server_use', server_use);
    const urlWithParams = new URL(driver_map[0]);
    Object.keys(params_all).forEach(key => {
        urlWithParams.searchParams.append(key, params_all[key]);
    });
    // 执行请求 ===========================================================================
    try {
        return c.json({text: urlWithParams}, 200);
    } catch (error) {
        return c.json({text: error}, 500);
    }
}

// 令牌申请 ##############################################################################
export async function oneToken(c: Context) {
    let login_data, client_uid, client_key, random_key, server_use;
    let driver_txt, params_all, random_uid, server_url: string = driver_map[1];
    try { // 请求参数 ====================================================================
        if (c.env.PROXY_API.length > 3 && c.env.PROXY_API !== "null"
            && c.env.PROXY_API !== "none" && c.env.PROXY_API !== "false")
            server_url = "https://" + c.env.PROXY_API + "/token";
        login_data = <string>c.req.query('code');
        random_uid = <string>c.req.query('state');
        server_use = local.getCookie(c, 'server_use')
        driver_txt = <string>local.getCookie(c, 'driver_txt')
        random_key = <string>local.getCookie(c, 'random_key')
        client_uid = client_key = ""
        if (server_use == "false") {
            client_uid = <string>local.getCookie(c, 'client_uid')
            client_key = <string>local.getCookie(c, 'client_key')
            if (!client_uid || !client_key || random_uid !== random_key || !client_uid || !client_key)
                return c.redirect(showErr("Cookie无效", "", ""));
        }
        driver_txt = local.getCookie(c, 'driver_txt')

        params_all = {
            'client_id': server_use == "true" ? c.env.googleui_uid : client_uid,
            'client_secret': server_use == "true" ? c.env.googleui_key : client_key,
            'code': login_data,
            'grant_type': 'authorization_code',
            'redirect_uri': 'https://' + c.env.MAIN_URLS + '/googleui/callback',
        };
    } catch (error) {
        return c.redirect(showErr(<string>error, "", ""));
    }

    // 避免key泄漏
    if (server_use == "true") {
        client_uid = "";
        client_key = "";
    }

    // 执行请求 ===========================================================================
    try {
        const paramsString = new URLSearchParams(params_all).toString();
        let try_time: number = 5;
        let response: Response | null = null;
        while (try_time > 0) {
            try {
                response = await fetch(server_url, {
                    method: 'POST', body: paramsString,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded',},
                });
                break;
            } catch (error) {
                try_time -= 1;
            }
        }
        if (!try_time || !response) return c.redirect(
            showErr("多次尝试获取Token失败"));
        if (server_use == "false") {
            local.deleteCookie(c, 'client_uid');
            local.deleteCookie(c, 'client_key');
        }
        local.deleteCookie(c, 'random_key');
        local.deleteCookie(c, 'driver_txt');
        local.deleteCookie(c, 'server_use');
        let json: Record<string, any> = await response.json();
        if (json.token_type == "Bearer") {
            const callbackData: Secrets = {
                access_token: json.access_token,
                refresh_token: json.refresh_token,
                client_uid: client_uid,
                client_key: client_key,
                driver_txt: driver_txt,
                server_use: server_use,
            };
            return c.redirect("/#" + encodeCallbackData(callbackData));
        }
        return c.redirect(showErr(json.message, client_uid, client_key));
    } catch (error) {
        return c.redirect(showErr(<string>error, client_uid, client_key));
    }
}


function getRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 刷新令牌 ##############################################################################
export async function genToken(c: Context) {
    const clients_info: configs.Clients | undefined = configs.getInfo(c);
    const refresh_text: string | undefined = c.req.query('refresh_ui');
    let server_url: string = driver_map[1];
    if (c.env.PROXY_API.length > 3 && c.env.PROXY_API !== "null"
        && c.env.PROXY_API !== "none" && c.env.PROXY_API !== "false")
        server_url = "https://" + c.env.PROXY_API + "/token";
    if (!clients_info) return c.json({text: "传入参数缺少"}, 500);
    if (!refresh_text) return c.json({text: "缺少刷新令牌"}, 500);
    // 请求参数 ==========================================================================
    const params: Record<string, any> = {
        client_id: clients_info.servers ? c.env.googleui_uid : clients_info.app_uid,
        client_secret: clients_info.servers ? c.env.googleui_key : clients_info.app_key,
        grant_type: 'refresh_token',
        refresh_token: refresh_text
    };
    return await refresh.pubRenew(c, server_url, params, "POST", "access_token", "copy", "none");
}