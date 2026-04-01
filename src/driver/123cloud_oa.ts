import * as local from "hono/cookie";
import {Context} from "hono";
import {setCookie} from "../shares/cookies";
import {pubLogin} from "../shares/oauthv2";
import * as configs from "../shares/configs";
import {pubParse} from "../shares/urlback";
import {encodeCallbackData} from "../shares/secrets";


const driver_map: string[] = [
    "https://open-api.123pan.com/api/v1/access_token",
    "https://open-api.123pan.com/api/v1/oauth2/access_token",
    "https://www.123pan.com/auth"
]

// 登录申请 ##############################################################################
export async function oneLogin(c: Context) {
    const clients_info: configs.Clients | undefined = configs.getInfo(c);
    if (!clients_info) return c.json({text: "传入参数缺少"}, 500);

    const params_info: Record<string, any> = {
        clientId: clients_info.servers ? c.env.cloud123_uid : clients_info.app_uid,
        clientSecret: clients_info.servers ? c.env.cloud123_key : clients_info.app_key,
    };
    if (!clients_info.servers)
        setCookie(c, clients_info)
    else{
        let redict_url:string = `${driver_map[2]}?client_id=${c.env.cloud123_uid}`+
                                `&redirect_uri=${encodeURIComponent(c.env.cloud123_url)}`+
            `&scope=user:base,file:all:read,file:all:write&state=OpenList`
        return c.json({text: redict_url}, 200);
    }
    const result =  await pubLogin(c, JSON.stringify(params_info), driver_map[0],
        false, "POST", "json", {
            'Platform': "open_platform",
            'Content-Type': 'application/json'
        });
    console.log(params_info,result);
    if (!result.data || !result.data.accessToken) return c.json({text: "无法获取AccessToken"}, 500);
    return c.json({text: result.data.accessToken}, 200);
}

// 令牌申请 ##############################################################################
export async function oneToken(c: Context) {
    const callback_code: string | undefined = c.req.query('code');
    const refresh_text: string | undefined = c.req.query('refresh_ui');
    if (!callback_code && !refresh_text) return c.json({text: "无法获取登录信息"}, 500);
    let params: Record<string, any>  = {
        code: callback_code || undefined,
        client_id: c.env.cloud123_uid,
        client_secret: c.env.cloud123_key,
        grant_type: refresh_text==undefined? "authorization_code": "refresh_token",
        redirect_uri: c.env.cloud123_url,
        refresh_token:  refresh_text || undefined
    }
    console.log(params);
    const query_str = new URLSearchParams(
        Object.fromEntries(Object.entries(params)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]))
    ).toString();
    const result =  await pubLogin(
        c, "", `${driver_map[1]}?${query_str}`,
        false, "POST", "json");
    console.log(result);
    if (!result || !result.access_token)
        return c.json({text: "无法获取AccessToken"}, 500);
    return c.redirect("/#" + encodeCallbackData({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        driver_txt: "123cloud_oa",
        server_use: true
    }));
}

// 刷新令牌 ##############################################################################
export async function genToken(c: Context) {
    return c.json({text: "此网盘不支持"}, 500);
}
