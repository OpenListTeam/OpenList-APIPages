import {Context} from "hono";
import {pubLogin} from "../shares/oauthv2"
import * as configs from "../shares/configs";
import {getCookie, setCookie} from "../shares/cookies";
import {pubParse} from "../shares/urlback";
import {pubRenew} from "../shares/refresh";

const driver_map: string[] = [
    "https://www.dropbox.com/oauth2/authorize",
    "https://api.dropboxapi.com/oauth2/token"
]

// 发起登录 ##############################################################################
export async function getLogin(c: Context) {
    const clients_info: configs.Clients | undefined = configs.getInfo(c);
    if (!clients_info) return c.json({text: "传入参数缺少"}, 500);
    const params_info: Record<string, any> = {
        client_id: clients_info.servers ? c.env.dropboxs_uid : clients_info.app_uid,
        response_type: 'code',
        token_access_type: "offline",
        redirect_uri: 'https://' + c.env.MAIN_URLS + '/dropboxs/callback',
    };
    setCookie(c, clients_info)
    return await pubLogin(c, params_info, driver_map[0], true);
}

// 回调函数 ##############################################################################
export async function urlParse(c: Context) {
    const clients_info: configs.Clients = getCookie(c);
    const login_data = <string>c.req.query('code');
    if (!clients_info.app_uid) return c.json({text: "Cookie缺少"}, 500);
    if (!clients_info.app_uid) return c.json({text: "传入参数缺少"}, 500);
    const params_info: Record<string, any> = {
        client_id: clients_info.servers ? c.env.dropboxs_uid : clients_info.app_uid,
        client_secret: clients_info.servers ? c.env.dropboxs_key : clients_info.app_key,
        grant_type: 'authorization_code',
        code: login_data,
        redirect_uri: 'https://' + c.env.MAIN_URLS + '/dropboxs/callback',
    };
    return await pubParse(c, clients_info, params_info, driver_map[1], "POST");
}

// 刷新令牌 ##############################################################################
export async function apiRenew(c: Context) {
    const refresh_text = <string>c.req.query('refresh_ui');
    const clients_info: configs.Clients | undefined = configs.getInfo(c);
    if (!clients_info) return c.json({text: "传入参数缺少"}, 500);
    if (!refresh_text) return c.json({text: "缺少刷新令牌"}, 500);
    const params_info: Record<string, any> = {
        client_id: clients_info.servers ? c.env.dropboxs_uid : clients_info.app_uid,
        client_secret: clients_info.servers ? c.env.dropboxs_key : clients_info.app_key,
        grant_type: 'refresh_token',
        refresh_token: refresh_text,
    };
    return await pubRenew(c, driver_map[1], params_info, "POST", "access_token", "copy");
}