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
                               strict: boolean = false,
): Promise<any> {
    try {
        const result_json: Record<string, any> = await Requests(
            c, Params, APIUrl, Method, false, Header, "json")
        const refresh_token = getDynamicValue(result_json, refresh_name, Params.refresh_token)
        const access_token = getDynamicValue(result_json, access_name, "")
        // strict 模式：上游返回错误或缺少 access_token 时，透传真实错误（HTTP 500），
        // 避免因 refresh_name="copy" 回显恒真而把刷新失败伪装成 200 成功
        if (strict) {
            const upstream_error = result_json.error_description || result_json.error
                || result_json.text || result_json.message
            if (!access_token || upstream_error) {
                return c.json({text: upstream_error || "上游未返回access_token"}, 500);
            }
        }
        if (refresh_token)
            return c.json({
                refresh_token: refresh_token,
                access_token: access_token,
            }, 200);
        return c.json({text: result_json[error_name]}, 500);
    } catch (error) {
        return c.json({text: error}, 500);
    }
}

