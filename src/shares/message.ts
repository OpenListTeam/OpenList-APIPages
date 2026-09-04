import {encodeCallbackData, Secrets} from "./secrets";

export function showErr(error?: string, client_uid?: string, client_key?: string) {
    const message_err = "授权失败，请检查:" + "\n" +
        "1、应用ID和应用机密是否正确" + "\n" +
        "2、登录账号是否具有应用权限" + "\n" +
        "3、回调地址是否包括上面地址" + "\n" +
        "错误信息: " + error;
    const callbackData: Secrets = {
        message_err: message_err,
        client_uid: client_uid,
        client_key: client_key,
    };
    return "/#" + encodeCallbackData(callbackData);
}

// 网络/代理层错误（例如 Cloudflare 522 连接超时），与授权配置无关，单独提示避免误导
export function showNetErr(error?: string, client_uid?: string, client_key?: string) {
    const message_err = "获取令牌时网络请求失败（服务器到 Google 的连接或代理异常）:" + "\n" +
        "1、若配置了 PROXY_API，请检查代理服务是否正常" + "\n" +
        "2、检查服务器所在区域到 Google 的网络连通性" + "\n" +
        "3、可稍后重试" + "\n" +
        "错误信息: " + error;
    const callbackData: Secrets = {
        message_err: message_err,
        client_uid: client_uid,
        client_key: client_key,
    };
    return "/#" + encodeCallbackData(callbackData);
}