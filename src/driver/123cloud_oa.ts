import * as local from "hono/cookie";
import {Context} from "hono";
import {setCookie} from "../shares/cookies";
import {pubLogin} from "../shares/oauthv2";
import * as configs from "../shares/configs";


const driver_map: string[] = [
    "https://open-api.123pan.com/api/v1/access_token",
    "https://open-api.123pan.com/api/v1/access_token"
]

// 登录申请 ##############################################################################
export async function oneLogin(c: Context) {
    const clients_info: configs.Clients | undefined = configs.getInfo(c);
    if (!clients_info) return c.json({text: "传入参数缺少"}, 500);
    const params_info: Record<string, any> = {
        clientId: clients_info.app_uid,
        clientSecret: clients_info.app_key,
    };
    if (!clients_info.servers)
        setCookie(c, clients_info)
    const result =  await pubLogin(c, params_info, driver_map[0],
        false, "POST", "json", {
            'Platform': "open_platform",
            'Content-Type': 'application/x-www-form-urlencoded'
        });
    if (!result.data || !result.data.accessToken) return c.json({text: "无法获取AccessToken"}, 500);
    return c.json({text: result.data.accessToken}, 200);
}

// 令牌申请 ##############################################################################
export async function oneToken(c: Context) {
    return await oneLogin(c);
}

// 刷新令牌 ##############################################################################
export async function genToken(c: Context) {
    return c.json({text: "此网盘不支持"}, 500);
}
