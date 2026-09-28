import * as local from "hono/cookie";
import {Context} from "hono";
import {showErr} from "../shares/message";
import * as refresh from "../shares/refresh"
import * as configs from "../shares/configs"
import {encodeCallbackData, Secrets} from "../shares/secrets";

const driver_map: string[] = [
    "https://openapi.baidu.com/oauth/2.0/authorize",
    "https://openapi.baidu.com/oauth/2.0/token",

]

// 登录申请 ##############################################################################
export async function oneLogin(c: Context) {
    const client_key: string = <string>c.req.query('client_key');
    const secret_key: string = <string>c.req.query('secret_key');
    const driver_txt: string = <string>c.req.query('driver_txt');
    const server_use: string = <string>c.req.query('server_use');
    const redirector: string = 'https://' + configs.getBaseHost(c) + '/baiduyun/callback'
    if (server_use == "false")
        if (!driver_txt || !client_key || !secret_key)
            return c.json({text: "参数缺少"}, 500);
    // 请求参数 ==========================================================================
    const params_all: Record<string, any> = {
        client_id: server_use == "true" ? c.env.baiduyun_key : client_key,
        scope: "basic,netdisk",
        response_type: 'code',
        redirect_uri: driver_txt === "baiduyun_ob" ? "oob" : redirector
    };
    const urlWithParams = new URL(driver_map[0]);
    Object.keys(params_all).forEach(key => {
        urlWithParams.searchParams.append(key, params_all[key]);
    });
    // 执行请求 ===========================================================================
    try {
        const response = await fetch(urlWithParams.href, {
            method: 'GET',
        });
        if (server_use == "false") {
            local.setCookie(c, 'client_key', client_key);
            local.setCookie(c, 'secret_key', secret_key);
        }
        local.setCookie(c, 'driver_txt', driver_txt);
        local.setCookie(c, 'server_use', server_use);
        return c.json({text: response.url}, 200);
    } catch (error) {
        return c.json({text: error}, 500);
    }
}

// 令牌申请 ##############################################################################
export async function oneToken(c: Context) {
    let login_data, client_key, secret_key, client_url, server_oob;
    let driver_txt, server_use, params_all: Record<string, any>;
    const redirector: string = 'https://' + configs.getBaseHost(c) + '/baiduyun/callback'
    try { // 请求参数 ====================================================================
        server_oob = c.req.query('server_oob');
        login_data = c.req.query('code');
        client_key = secret_key = ""
        server_use = local.getCookie(c, 'server_use')
        driver_txt = local.getCookie(c, 'driver_txt')
        if (server_oob && server_oob == "true") {
            client_key = c.req.query('client_key');
            secret_key = c.req.query('secret_key');
            server_use = "false"
        } else if (server_use == "false") {
            client_key = local.getCookie(c, 'client_key')
            secret_key = local.getCookie(c, 'secret_key')
            if (!login_data || !client_key || !secret_key)
                return c.redirect(showErr("Cookie缺少", "", ""));
        }
        client_url = driver_map[1];
        params_all = {
            client_id: server_use == "true" ? c.env.baiduyun_key : client_key,
            client_secret: server_use == "true" ? c.env.baiduyun_ext : secret_key,
            code: login_data, grant_type: 'authorization_code',
            redirect_uri: server_oob && server_oob == "true" ? "oob" : redirector
        };
    } catch (error) {
        return c.redirect(showErr(<string>error, "", ""));
    }

    // 避免key泄漏
    if (server_use == "true") {
        client_key = "";
        secret_key = "";
    }

    // 执行请求 ===========================================================================
    try {
        // const paramsString = new URLSearchParams(params_all).toString();
        const urlWithParams = new URL(client_url);
        Object.keys(params_all).forEach(key => {
            urlWithParams.searchParams.append(key, params_all[key]);
        });
        const response: Response = await fetch(urlWithParams, {method: 'GET'});
        if (server_use == "false") {
            local.deleteCookie(c, 'client_key');
            local.deleteCookie(c, 'secret_key');
        }
        local.deleteCookie(c, 'driver_txt');
        local.deleteCookie(c, 'server_use');
        const json: Record<string, any> = await response.json();
        if (response.ok) {
            const callbackData: Secrets = {
                access_token: json.access_token,
                refresh_token: json.refresh_token,
                client_key: client_key,
                secret_key: secret_key,
                driver_txt: driver_txt,
            };
            return c.redirect("/#" + encodeCallbackData(callbackData));
        }
        return c.redirect(showErr(json.error_description, "", client_key));
    } catch (error) {
        return c.redirect(showErr(<string>error, "", client_key));
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
        client_id: clients_info.servers ? c.env.baiduyun_key : clients_info.app_key,
        client_secret: clients_info.servers ? c.env.baiduyun_ext : clients_info.secrets,
        grant_type: 'refresh_token',
        refresh_token: refresh_text
    };
    return await refresh.pubRenew(c, driver_map[1], params, "GET");
}

