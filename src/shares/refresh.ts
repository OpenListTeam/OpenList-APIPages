// 登录申请 ##############################################################################
import {Context} from "hono";
import {getDynamicValue} from './findvar'
import {Requests} from "./request";

export async function pubRenew(c: Context,
                               APIUrl: string,
                               Params: Record<string, string>,
                               Method: string = "GET",
                               access_name: string = "access_token",
                               refresh_name: string = "refresh_token",
                               error_name: string = "error_description",
                               Finder: string = "json",
                               Header: Record<string, string> | undefined = undefined,
                               expires_name: string | undefined = undefined,
): Promise<any> {
    try {
        const result_json: Record<string, any> = await Requests(
            c, Params, APIUrl, Method, false, Header, "json")
        const refresh_token = getDynamicValue(result_json, refresh_name, Params.refresh_token)
        const access_token = getDynamicValue(result_json, access_name, "")
        const expires_in = expires_name ? getDynamicValue(result_json, expires_name, undefined) : undefined
        if (refresh_token) {
            const result_data: Record<string, any> = {
                refresh_token: refresh_token,
                access_token: access_token,
            }
            if (expires_in !== undefined && expires_in !== null && expires_in !== "")
                result_data.expires_in = expires_in
            return c.json(result_data, 200);
        }
        return c.json({text: result_json[error_name]}, 500);
    } catch (error) {
        return c.json({text: error}, 500);
    }
}

