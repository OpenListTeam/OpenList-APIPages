import * as local from "hono/cookie";
import {Context} from "hono";
import {showErr} from "../shares/message";
import * as configs from "../shares/configs";
import * as refresh from "../shares/refresh";
import {encodeCallbackData,Secrets} from "../shares/secrets";

const driver_map: Record<string, string[]> = {
    "onedrive_pr": [
        'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        'https://login.microsoftonline.com/common/oauth2/v2.0/token'
    ],
    "onedrive_go": [
        'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        'https://login.microsoftonline.com/common/oauth2/v2.0/token'
    ],
    "onedrive_cn": [
        'https://login.chinacloudapi.cn/common/oauth2/v2.0/authorize',
        'https://login.chinacloudapi.cn/common/oauth2/token'
    ],
    "onedrive_de": [
        'https://login.microsoftonline.de/common/oauth2/v2.0/authorize',
        'https://graph.microsoft.de/common/oauth2/v2.0/token'
    ],
    "onedrive_us": [
        'https://login.microsoftonline.us/common/oauth2/v2.0/authorize',
        'https://graph.microsoft.us/common/oauth2/v2.0/token'
    ],
}

// 登录申请 ##############################################################################
export async function oneLogin(c: Context) {
    const client_uid: string = <string>c.req.query('client_uid');
    const client_key: string = <string>c.req.query('client_key');
    const driver_txt: string = <string>c.req.query('driver_txt');
    const server_use: string = <string>c.req.query('server_use');
    if (server_use == "false")
        if (!driver_txt || !client_uid || !client_key)
            return c.json({text: "参数缺少"}, 500);
    const scopes_all = 'offline_access Files.ReadWrite.All';
    const client_url: string = driver_map[driver_txt][0];
    const redirector: string = 'https://' + configs.getBaseHost(c) + '/onedrive/callback'
    // 请求参数 ==========================================================================
    const params_all: Record<string, any> = {
        client_id: server_use == "true" ? c.env.onedrive_uid : client_uid,
        scope: scopes_all,
        response_type: 'code',
        redirect_uri: redirector
    };
    const urlWithParams = new URL(client_url);
    Object.keys(params_all).forEach(key => {
        urlWithParams.searchParams.append(key, params_all[key]);
    });
    // 执行请求 ===========================================================================
    try {
        const response = await fetch(urlWithParams.href, {
            method: 'GET',
        });
        if (server_use == "false") {
            local.setCookie(c, 'client_uid', client_uid);
            local.setCookie(c, 'client_key', client_key);
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
    let login_data, client_uid, client_key, driver_txt, client_url, server_use, params_all;
    try { // 请求参数 ====================================================================
        login_data = <string>c.req.query('code');
        server_use = local.getCookie(c, 'server_use')
        driver_txt = <string>local.getCookie(c, 'driver_txt')
        client_uid = client_key = ""
        if (server_use == "false") {
            client_uid = <string>local.getCookie(c, 'client_uid')
            client_key = <string>local.getCookie(c, 'client_key')
        }
        client_url = driver_map[driver_txt][1];
        params_all = {
            client_id: server_use == "true" ? c.env.onedrive_uid : client_uid,
            client_secret: server_use == "true" ? c.env.onedrive_key : client_key,
            redirect_uri: 'https://' + configs.getBaseHost(c) + '/onedrive/callback',
            code: login_data,
            grant_type: 'authorization_code'
        };
    } catch (error) {
        return c.redirect(showErr("参数错误", "", ""));
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
                response = await fetch(client_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: paramsString,
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
        local.deleteCookie(c, 'driver_txt');
        local.deleteCookie(c, 'server_use');
        if (!response.ok)
            return c.redirect(showErr("请求失败", client_uid, client_key));
        const json: Record<string, any> = await response.json();
        if (json.token_type === 'Bearer') {
            const callbackData: Secrets = {
                access_token: json.access_token,
                refresh_token: json.refresh_token,
                client_uid: client_uid,
                client_key: client_key,
                driver_txt: driver_txt,
                server_use: server_use,
            }
            return c.redirect("/#" + encodeCallbackData(callbackData));
        }
    } catch (error) {
        return c.redirect(showErr(<string>error, client_uid, client_key));
    }
}

export async function spSiteID(c: Context) {
    type Req = {
        access_token: string;
        site_url: string;
        zone: string;
    };
    const req: Req = await c.req.json();

    const u = new URL(req.site_url);
    const siteName = u.pathname;

    if (driver_map[req.zone]) {
        const response = await fetch(`${driver_map[req.zone][1]}/v1.0/sites/root:/${siteName}`, {
            headers: {'Authorization': `Bearer ${req.access_token}`}
        });
        if (!response.ok) {
            return c.json({error: 'Failed to fetch site ID'}, 403);
        }
        const data: Record<string, any> = await response.json();
        return c.json(data);
    } else {
        return c.json({error: 'Zone does not exist'}, 400);
    }
}

// 刷新令牌 ##############################################################################
export async function genToken(c: Context) {
    const driver_txt: string = <string>c.req.query('driver_txt');
    const clients_info: configs.Clients | undefined = configs.getInfo(c);
    const refresh_text: string | undefined = c.req.query('refresh_ui');
    if (!clients_info) return c.json({text: "传入参数缺少"}, 500);
    if (!refresh_text) return c.json({text: "缺少刷新令牌"}, 500);
    // 请求参数 ==========================================================================
    const params: Record<string, any> = {
        client_id: clients_info.servers ? c.env.onedrive_uid : clients_info.app_uid,
        client_secret: clients_info.servers ? c.env.onedrive_key : clients_info.app_key,
        redirect_uri: 'https://' + configs.getBaseHost(c) + '/onedrive/callback',
        grant_type: "refresh_token",
        refresh_token: refresh_text
    };
    return await refresh.pubRenew(c, driver_map[driver_txt][1], params, "POST");
}