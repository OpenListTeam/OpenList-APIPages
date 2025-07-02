// import Swal from 'sweetalert2';

// 获取登录秘钥 #######################################################
async function getLogin(refresh = false) {
    let server_use = document.getElementById("server-use-input").checked;
    let secret_key = document.getElementById("secret-key-input").value;
    let client_uid = document.getElementById("client-uid-input").value;
    let client_key = document.getElementById("client-key-input").value;
    let driver_txt = document.getElementById("driver-txt-input").value;
    let refresh_ui = document.getElementById("refresh-token").value;
    let driver_pre = driver_txt.split("_")[0]
    let check_flag = true;
    // 验证秘钥情况 ==================================================
    if (!server_use) {
        if (driver_txt !== "alicloud_cs" && driver_pre !== "baiduyun")
            if (client_uid === "" || client_key === "")
                check_flag = false
        if (driver_pre === "baiduyun")
            if (secret_key === "" || client_key === "")
                check_flag = false
        if (!check_flag) {
            await showErrorMessage("执行操作",
                '请先填写AppID和AppKey')
            return;
        }
    }
    // 阿里云盘扫码v2直接调用专用API，不需要构建传统的requests路径
    if (driver_txt === "alicloud_cs" && !refresh) {
        await startAlicloud2Login();
        return;
    }
    // 刷新秘钥情况 =================================================
    let base_urls = "/requests?client_uid="
    if (refresh) {
        if (!refresh_ui) {
            await showErrorMessage("刷新令牌",
                '请先填写Refresh Token')
            return;
        }
        base_urls = "/renewapi?client_uid="
    }


    if (driver_txt === "alicloud_cs") driver_pre = "alicloud2"
    let post_urls = "/" + driver_pre + base_urls + client_uid
        + "&client_key=" + client_key + "&driver_txt=" + driver_txt
        + "&server_use=" + server_use
    if (refresh) {
        post_urls += "&refresh_ui=" + refresh_ui
    }
    if (driver_pre === "baiduyun") post_urls += "&secret_key=" + secret_key
    try {
        const response = await fetch(post_urls, {
            method: 'GET', headers: {'Content-Type': 'application/json'}
        });
        let response_data = {}
        // 刷新令牌模式 ===============================================
        if (refresh) {
            if (response.status === 200) {
                response_data = await response.json();
                const access_key = document.getElementById("access-token")
                access_key.value = response_data.access_token;
                refresh_ui = document.getElementById("refresh-token")
                refresh_ui.value = response_data.refresh_token;
                await Swal.fire({
                    icon: 'success',
                    title: '刷新令牌成功',
                    showConfirmButton: true,
                    timer: 1000
                });
            } else await showErrorMessage("刷新令牌",
                response.statusText, response.status)
            return;
        }
        // 申请登录模式 ================================================================
        if (response.status === 200) {
            response_data = await response.json();
            if (driver_txt === "baiduyun_go" || driver_txt === "alicloud_go"
                || driver_pre === "onedrive" || driver_pre === "115cloud"
                || driver_pre === "googleui" || driver_pre === "yandexui"
                || driver_pre === "dropboxs" || driver_pre === "quarkyun"
            ) {
                window.location.href = response_data.text;
            }
            // 百度云OOB模式（手动回调） ===============================================
            if (driver_txt === "baiduyun_ob") {
                window.open(response_data.text);
                await Swal.fire({
                    title: '提示',
                    html: '请在新打开的页面获取授权码并粘贴到下方：' +
                        '<input id="authCodeInput" type="text"' +
                        ' style="margin-top: 10px; width: calc(100% - 20px);">',
                    confirmButtonText: 'OK',
                    preConfirm: () => {
                        return document.getElementById('authCodeInput').value;
                    }
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        const authCode = result.value;
                        window.location.href = "/baiduyun/callback" +
                            "?server_oob=true" + "&secret_key=" + secret_key +
                            "&client_key=" + client_key + "&code=" + authCode;
                        await getToken();
                    }
                });
            }
            // 123网盘直接获取 ===========================================================
            if (driver_pre === "123cloud") {
                document.getElementById("access-token").value = response_data.text;
                return;
            }
            // Ali网盘直接获取 ===========================================================
            if (driver_txt === "alicloud_qr" || driver_txt === "alicloud_tv") {
                let sid = response_data.sid;
                await Swal.fire({
                    position: 'top',
                    icon: 'info',
                    title: '扫码登录',
                    html: `<div>请扫码登录，完成后点确定</div>` +
                        `<img src="${response_data.text}" alt="">`,
                    showConfirmButton: true
                });
                post_urls = "/alicloud/callback" +
                    "?client_id=" + client_uid +
                    "&client_secret=" + client_key +
                    "&server_use=" + server_use +
                    "&grant_type=" + "authorization_code" +
                    "&code=" + sid
                let auth_post = await fetch(post_urls, {method: 'GET'});
                let auth_data = await auth_post.json();
                if (auth_post.status === 200) {
                    const callbackData = {
                        access_token: auth_data.access_token,
                        refresh_token: auth_data.refresh_token,
                        client_uid: client_uid,
                        client_key: client_key,
                        driver_txt: driver_txt,
                        server_use: server_use ? "true" : "false",
                    };
                    window.location.href = "/#" + encodeCallbackData(callbackData);
                    location.reload();
                    await getToken();
                } else await showErrorMessage("登录令牌",
                    auth_data.text, response.status);
            }

        } else await showErrorMessage("获取秘钥", response.statusText, response.status);
    } catch (error) {
        await showErrorMessage("获取秘钥", error, 500);
    }
}

function encodeCallbackData(data) {
    return btoa(JSON.stringify(data))
}
