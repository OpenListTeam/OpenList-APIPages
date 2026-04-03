// 登录申请 ##############################################################################
import {Context} from "hono";
import {Requests} from "./request";
import {encodeCallbackData, Secrets} from "./secrets"
import {getDynamicValue} from './findvar'
import * as configs from "./configs";

export interface Results {
    access_token: string,
    refresh_token: string,
    message_err: string,
}

export async function pubParse(c: Context,
                               Client: configs.Clients,
                               Params: Record<string, any>,
                               APIUrl: string = "/api/login",
                               Method: string = "GET",
                               error_name: string = "error_description",
                               access_name: string = "access_token",
                               refresh_name: string = "refresh_token",
                               Finder: string = "",
                               Header: Record<string, string> | undefined = undefined,
): Promise<any> {
    // 请求参数 ==========================================================================
    const result_json: Record<string, any> = await Requests(
        c, Params, APIUrl, Method, false, Header)
    let result_data: Secrets = {
        access_token: "",
        message_err: "",
        refresh_token: "",
        client_uid: Client.app_uid,
        client_key: Client.app_key,
        secret_key: Client.secrets,
        driver_txt: Client.drivers,
        server_use: Client.servers ? "true" : "false",
    };
    if (Finder === "json") return result_json;
    if (Finder === "raw") return result_json;
    const err_msg = getDynamicValue(result_json, error_name)
    const acc_msg = getDynamicValue(result_json, access_name)
    const new_msg = getDynamicValue(result_json, refresh_name)
    if (err_msg) result_data.message_err = err_msg
    if (acc_msg || new_msg) {
        result_data.access_token = acc_msg ? acc_msg : ""
        result_data.refresh_token = new_msg ? new_msg : ""
    }
    if (Finder === "full") return result_data; // 回传响应数据
    if (Finder === "both") return {
        json: result_data,
        raw: result_json,
    }; // 回传完整数据
    return c.redirect("/#" + encodeCallbackData(result_data));
}


