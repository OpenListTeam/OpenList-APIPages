import {Context} from "hono";
import * as configs from "../shares/configs";
import {getCookie, setCookie} from "../shares/cookies";
import {pubLogin} from "../shares/oauthv2";
import {pubParse} from "../shares/urlback";
import {pubRenew} from "../shares/refresh";
import {encodeCallbackData} from "../shares/secrets";

const driver_map: string[] = [
    "https://oauth.fnnas.com/api/v1/oauth/getAuthUrl",       // 获取授权页面
    "https://oauth.fnnas.com/api/v1/oauth/exchangeToken",    // 交换访问令牌
    "https://oauth.fnnas.com/api/v1/oauth/refreshToken"      // 刷新访问令牌
];

// 登录申请 ##############################################################################
export async function getLogin(c: Context) {
    const clients: configs.Clients | undefined = configs.getInfo(c);
    if (!clients?.servers && !clients?.drivers) return c.json({text: "参数缺少"}, 500);
    if (!clients?.servers && !clients?.app_uid) return c.json({text: "参数缺少"}, 500);
    // 请求参数 ==========================================================================
    const params_all = {
        authType: 4,
        grantType: "authorization_code",
        redirectUrlToFrontend: 'https://' + c.env.MAIN_URLS + '/quarkyun/callback',
        trimAppId: "com.trim.cloudstorage"
    };
    setCookie(c, clients)
    const result_json = await pubLogin(c,
        JSON.stringify(params_all), driver_map[0], false, "POST", "json",
        {'Content-Type': 'application/json'});
    if (result_json.code !== 0)
        return c.json({text: result_json.msg || "获取授权URL失败"}, 500);
    if (!result_json.data || !result_json.data.authUrlWithNonce) {
        return c.json({text: "授权URL数据缺失"}, 500);
    }
    return c.json({text: result_json.data.authUrlWithNonce}, 200);
}

// 令牌申请 ##############################################################################
export async function urlParse(c: Context) {
    const clients_info: configs.Clients = getCookie(c);
    const logins_nonce = <string>c.req.query('nonce');
    if (!logins_nonce) return c.json({text: "Nonce缺少"}, 500);
    const params_info: Record<string, any> = {
        authType: 4,
        nonce: logins_nonce,
        trimAppId: "com.trim.cloudstorage"
    };
    // let result: Record<string, any> = await pubParse(c, clients_info,
    //     JSON.stringify(params_info), driver_map[1], "POST",
    //     "msg", "data.accessToken", "data.refreshToken",
    //     "both", {'Content-Type': 'application/json'});
    // if (result.raw.data) {
    //     result.json.client_uid = result.raw.data.appId;
    //     result.json.client_key = result.raw.data.signKey;
    // }
    // result.json.driver_txt = clients_info.drivers;
    // result.json.server_use = false;
    // return c.redirect("/#" + encodeCallbackData(result.json));
    return await pubParse(c, clients_info,
        params_info, driver_map[1], "POST",
        "msg", "data.accessToken", "data.refreshToken",
        "", {'Content-Type': 'application/json'});
}

// 刷新令牌 ##############################################################################
export async function apiRenew(c: Context) {
    const refresh_text = <string>c.req.query('refresh_ui');
    const clients_info: configs.Clients | undefined = configs.getInfo(c);
    if (!clients_info) return c.json({text: "传入参数缺少"}, 500);
    if (!refresh_text) return c.json({text: "缺少刷新令牌"}, 500);
    const params_info: Record<string, any> = {
        authType: 4,
        refreshToken: refresh_text,
        trimAppId: "com.trim.cloudstorage"
    };
    return await pubRenew(c, driver_map[2], params_info,
        "POST", "data.tokenInfo.accessToken",
        "data.tokenInfo.refreshToken", "msg",
        "", {'Content-Type': 'application/json'});
}