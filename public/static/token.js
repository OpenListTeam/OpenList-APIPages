async function getToken() {
    if (url_hash) {
        try {
            const json_byte = Uint8Array.from(atob(url_hash), c => c.charCodeAt(0));
            const json_text = new TextDecoder().decode(json_byte);
            const json_data = JSON.parse(json_text);
            const server_use = json_data.server_use;
            const client_uid = json_data.client_uid;
            const secret_key = json_data.secret_key;
            const driver_txt = json_data.driver_txt;
            const client_key = json_data.client_key;
            const access_key = json_data.access_token;
            const refresh_ui = json_data.refresh_token;
            const message_ui = json_data.message_err;
            // 从历史记录清除#号部分，避免隐私信息泄漏
            // 这只会在正常解析JSON后执行，其他的hash不会被清除
            // window.history.replaceState(null, null, window.location.pathname + window.location.search);
            // 在Chrome 136测试发现，通过History API操作，不但不会修改记录反而还会多出一条记录。
            // Chrome浏览器可以使用location.replace修改记录，Firefox浏览器上此方法无效。
            // 参见：https://stackoverflow.com/questions/61711130/removing-sensitive-url-data-from-borwser-history
            window.location.replace('#');

            // 设置数据 ========================================================
            if (driver_txt && driver_txt !== "undefined")
                document.getElementById("driver-txt-input").value = driver_txt;
            if (client_key && client_key !== "undefined")
                document.getElementById("client-key-input").value = client_key;
            if (client_uid && client_uid !== "undefined")
                document.getElementById("client-uid-input").value = client_uid;
            if (secret_key && secret_key !== "undefined")
                document.getElementById("secret-key-input").value = secret_key;
            if (access_key && access_key !== "undefined")
                document.getElementById("access-token").value = access_key;
            if (refresh_ui && refresh_ui !== "undefined")
                document.getElementById("refresh-token").value = refresh_ui;
            if (server_use && server_use === "true")
                document.getElementById("server-use-input").checked = true;
            if (!driver_txt || driver_txt === "")
                document.getElementById("driver-txt-input").value = "onedrive_go";
            if (message_ui) {
                Swal.fire({
                    position: 'top',
                    icon: 'error',
                    title: '授权失败',
                    html: message_ui,
                    showConfirmButton: true,
                });
            }
        } catch (e) {
            console.error(e);
        }
    }
    addEventListener();
    onSelect();
}
