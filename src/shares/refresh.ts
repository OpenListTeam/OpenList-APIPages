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
): Promise<any> {
    try {
        const result_json: Record<string, any> = await Requests(
            c, Params, APIUrl, Method, false, Header, "json")
        const refresh_token = getDynamicValue(result_json, refresh_name, Params.refresh_token)
        const access_token = getDynamicValue(result_json, access_name, "")
        // refresh_name 为 copy/none 时，refresh_token 只是原值回显、恒为真值，
        // 不能作为刷新成功的依据；此时必须以上游是否返回 access_token 判定成败，
        // 并在上游报错或缺 access_token 时透传真实错误（HTTP 500），
        // 避免把刷新失败（如 Google invalid_grant）伪装成 200 成功、
        // 令调用方（OpenList）只能显示误导性的 "empty token" 文案
        if ((refresh_name === "copy" || refresh_name === "none") && !access_token) {
            const upstream_error = result_json.error_description || result_json.error
                || result_json.text || result_json.message
            return c.json({text: upstream_error || "上游未返回access_token"}, 500);
        }
        if (refresh_token)
            return c.json({
                refresh_token: refresh_token,
                access_token: access_token,
            }, 200);
        return c.json({text: result_json[error_name] || result_json.error_description
            || result_json.error || result_json.text || result_json.message}, 500);
    } catch (error) {
        return c.json({text: error}, 500);
    }
}

