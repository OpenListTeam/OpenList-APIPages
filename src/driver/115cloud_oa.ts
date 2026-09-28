import * as local from "hono/cookie";
import {Context} from "hono";
import {showErr} from "../shares/message";
import * as configs from "../shares/configs";
import * as refresh from "../shares/refresh";
import {encodeCallbackData, Secrets} from "../shares/secrets";


const driver_map: string[] = [
    "https://passportapi.115.com/open/authorize",
    "https://passportapi.115.com/open/authCodeToToken",
    "https://passportapi.115.com/open/refreshToken"
]

// 登录申请 ##############################################################################
export async function oneLogin(c: Context) {
    const client_uid: string = <string>c.req.query('client_uid');
    const client_key: string = <string>c.req.query('client_key');
    const driver_txt: string = <string>c.req.query('driver_txt');
    const server_use: string = <string>c.req.query('server_use');
    if (server_use == "false" && (!driver_txt || !client_uid || !client_key))
        return c.json({text: "参数缺少"}, 500);
    const random_key = getRandomString(64);

    // 请求参数 ==========================================================================
    const params_all: Record<string, any> = {
        client_id: server_use == "true" ? c.env.cloud115_uid : client_uid,
        state: random_key,
        response_type: 'code',
        redirect_uri: 'https://' + configs.getBaseHost(c) + '/115cloud/callback'
    };
    const urlWithParams = new URL(driver_map[0]);
    Object.keys(params_all).forEach(key => {
        urlWithParams.searchParams.append(key, params_all[key]);
    });
    // 执行请求 ===========================================================================
    try {
        const response = await fetch(urlWithParams.href, {method: 'GET',});
        if (server_use == "false") {
            local.setCookie(c, 'client_uid', client_uid);
            local.setCookie(c, 'client_key', client_key);
        }
        local.setCookie(c, 'driver_txt', driver_txt);
        local.setCookie(c, 'random_key', random_key);
        local.setCookie(c, 'server_use', server_use);
        return c.json({text: response.url}, 200);
    } catch (error) {
        return c.json({text: error}, 500);
    }
}

// 令牌申请 ##############################################################################
export async function oneToken(c: Context) {
    let login_data, client_uid, client_key, random_key, client_url;
    let server_use, params_all: Record<string, any>, random_uid, driver_txt;
    try { // 请求参数 ====================================================================
        login_data = c.req.query('code');
        random_uid = c.req.query('state');
        server_use = local.getCookie(c, 'server_use')
        random_key = local.getCookie(c, 'random_key')
        driver_txt = local.getCookie(c, 'driver_txt')
        if (server_use == "false") {
            client_uid = local.getCookie(c, 'client_uid')
            client_key = local.getCookie(c, 'client_key')
            if (!random_uid || !random_key || random_uid !== random_key
                || !driver_txt || !login_data || !client_uid || !client_key)
                return c.redirect(showErr("Cookie无效", "", ""));
        }

        client_url = driver_map[1];
        params_all = {
            client_id: server_use == "true" ? c.env.cloud115_uid : client_uid,
            client_secret: server_use == "true" ? c.env.cloud115_key : client_key,
            redirect_uri: 'https://' + configs.getBaseHost(c) + '/115cloud/callback',
            code: login_data,
            grant_type: 'authorization_code'
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
        const response: Response = await fetch(client_url, {
            method: 'POST', body: paramsString,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        if (server_use == "false") {
            local.deleteCookie(c, 'client_uid');
            local.deleteCookie(c, 'client_key');
        }
        local.deleteCookie(c, 'random_key');
        local.deleteCookie(c, 'driver_txt');
        local.deleteCookie(c, 'server_use');
        let json: Record<string, any> = await response.json();
        if (json.state == 1) {
            const callbackData: Secrets = {
                access_token: json.data.access_token,
                refresh_token: json.data.refresh_token,
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

// 登录申请 ##############################################################################
export async function genToken(c: Context) {
    const refresh_text: string | undefined = c.req.query('refresh_ui');
    if (!refresh_text) return c.json({text: "缺少刷新令牌"}, 500);
    // 请求参数 ==========================================================================
    const params: Record<string, any> = {
        refresh_token: refresh_text
    };
    return await refresh.pubRenew(c, driver_map[2], params, "POST",
        "data.access_token", "data.refresh_token", "error");
}

function getRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}