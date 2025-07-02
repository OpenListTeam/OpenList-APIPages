function addEventListener() {
    // 监听select的变化
    driver_txt_input.addEventListener('change', onChange)
    // 监听切换使用官方参数情况下修改输入内容 ##################################
    server_use_input.addEventListener('change', function () {
        onSelect()
    });
}

function onChange(clean = true) {
    // 更新输入框的值 ======================================================
    server_use_input.checked = false;
    client_key_input.value = "";
    secret_key_input.value = "";
    client_uid_input.value = "";
    onSelect();
}

function onSelect() {
    server_use_input.disabled = false;
    client_key_input.disabled = false;
    secret_key_input.disabled = false;
    client_uid_input.disabled = false;
    client_uid_views.hidden = false;
    secret_key_views.hidden = true;
    const driver_pre = driver_txt_input.value.split("_")[0];
    direct_url_input.value = `${current_host}/${driver_pre}/callback`;

    // 修改一些样式 ========================================================
    const clientIdContainer = client_uid_input.closest('.mb-3');
    const appSecretContainer = client_key_input.closest('.mb-3');
    const serverUseContainer = server_use_input.closest('.mb-3');
    const callbackContainer = direct_url_input.closest('.mb-3');
    // 阿里云盘扫码登录v2不需要客户端ID、应用机密和回调地址 ================
    if (driver_txt_input.value === "alicloud_cs") {
        // 隐藏整个字段容器
        clientIdContainer.style.display = 'none';
        appSecretContainer.style.display = 'none';
        serverUseContainer.style.display = 'none';
        callbackContainer.style.display = 'none';
    } else {
        clientIdContainer.style.display = 'block';
        appSecretContainer.style.display = 'block';
        serverUseContainer.style.display = 'block';
        callbackContainer.style.display = 'block';
    }
    // Onedrive模式需要显示Share Point 相关参数 ===========================
    if (driver_txt_input.value.split("_")[0] === "onedrive") {
        shared_url_views.hidden = false;
        shared_btn_views.classList.add('d-grid');
        shared_btn_views.hidden = false;
        shared_uid_views.hidden = false;
    } else {
        shared_url_views.hidden = true;
        shared_btn_views.hidden = true;
        shared_btn_views.classList.remove('d-grid');
        shared_uid_views.hidden = true;
    }
    // 当驱动使用百度云，切换输入的选项 ===================================
    if (driver_txt_input.value.split("_")[0] === "baiduyun") {
        secret_key_views.hidden = false;
        client_uid_views.hidden = true;
        // OOB模式自动填写参数 --------------------------------------------
        if (driver_txt_input.value === "baiduyun_ob") {
            client_key_input.value = "NqOMXF6XGhGRIGemsQ9nG0Na";
            secret_key_input.value = "SVT6xpMdLcx6v4aCR4wT8BBOTbzFO8LM";
            direct_url_input.value = "oob";
        }
    }
    // if (driver_txt_input.value === "quarkyun_fn") {
    //     server_use_input.checked = true;
    //     server_use_input.disabled = false;
    // }
    // 禁用部分驱动使用官方参数 ===========================================
    if (driver_txt_input.value === "baiduyun_ob" ||
        driver_txt_input.value === "123cloud_go" ||
        driver_txt_input.value === "onedrive_cn" ||
        driver_txt_input.value === "onedrive_us" ||
        driver_txt_input.value === "onedrive_de" ||
        driver_txt_input.value === "alicloud_cs" ||
        driver_txt_input.value === "dropboxs_go"
    ) {
        server_use_input.checked = false;
        server_use_input.disabled = true;
    }
    // 检查是否选中服务器处理 ===============================================
    if (server_use_input.checked) {
        // 禁用输入框并清空内容
        client_uid_input.disabled = true;
        client_uid_input.value = '';
        client_key_input.disabled = true;
        client_key_input.value = '';
        secret_key_input.disabled = true;
        secret_key_input.value = '';
    } else {
        // 启用输入框
        client_uid_input.disabled = false;
        client_key_input.disabled = false;
        secret_key_input.disabled = false;
    }
    // Google弹出隐私政策和使用条款
    if (driver_txt_input.value === "googleui_go") {
        showGoogleConsent();
    }
}
