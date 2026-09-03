const PDS_DEFAULT_CLIENT_ID = "lMNVp25Sd1MfqZDQ";
const PDS_DEFAULT_DEVICE_NAME = "OpenList PDS";

let pdsDeviceCode = "";
let pdsPollTimer = null;
let pdsPolling = false;
let pdsPollExpiresAt = 0;
let pdsDrives = [];

function pdsElement(id) {
    return document.getElementById(id);
}

function pdsValue(id) {
    const element = pdsElement(id);
    return element ? element.value.trim() : "";
}

function setPdsValue(id, value) {
    const element = pdsElement(id);
    if (element) element.value = value || "";
}

function pdsMessage(data) {
    if (!data) return "请求失败";
    return data.text || data.message || data.error_description || data.error || data.code || "请求失败";
}

function pdsConfigBase() {
    return {
        domain_id: pdsValue("client-uid-input"),
        client_id: pdsValue("client-key-input") || PDS_DEFAULT_CLIENT_ID,
    };
}

async function pdsPost(path, body) {
    const response = await fetch(path, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    const text = await response.text();
    let data = {};
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = {text};
        }
    }
    return {
        ok: response.ok,
        status: response.status,
        data,
    };
}

function initPDSDefaults() {
    if (!pdsValue("client-key-input")) setPdsValue("client-key-input", PDS_DEFAULT_CLIENT_ID);
    if (!pdsValue("pds-device-name-input")) setPdsValue("pds-device-name-input", PDS_DEFAULT_DEVICE_NAME);
    if (!pdsValue("pds-token-type-input")) setPdsValue("pds-token-type-input", "Bearer");
    if (!pdsValue("pds-root-folder-id-input")) setPdsValue("pds-root-folder-id-input", "root");
    if (!pdsValue("pds-expires-at-input")) setPdsValue("pds-expires-at-input", "0");
}

function setPdsStatus(text) {
    setPdsValue("pds-status-output", text);
}

function stopPdsPolling() {
    if (pdsPollTimer) {
        clearInterval(pdsPollTimer);
        pdsPollTimer = null;
    }
    pdsPolling = false;
}

function fillPdsToken(data) {
    if (data.access_token) setPdsValue("access-token", data.access_token);
    if (data.refresh_token) setPdsValue("refresh-token", data.refresh_token);
    if (data.token_type) setPdsValue("pds-token-type-input", data.token_type);
    setPdsValue("pds-expires-at-input", "0");
}

async function startPdsLogin() {
    initPDSDefaults();
    const domainId = pdsValue("client-uid-input");
    if (!domainId) {
        await showErrorMessage("获取授权链接", "请先填写 PDS Domain ID");
        return;
    }
    stopPdsPolling();
    setPdsStatus("正在获取授权链接...");
    const result = await pdsPost("/pds/device_authorization", {
        ...pdsConfigBase(),
        device_name: pdsValue("pds-device-name-input") || PDS_DEFAULT_DEVICE_NAME,
    });
    if (!result.ok) {
        setPdsStatus("获取授权链接失败");
        await showErrorMessage("获取授权链接", pdsMessage(result.data), result.status);
        return;
    }

    pdsDeviceCode = result.data.device_code || "";
    pdsPollExpiresAt = Date.now() + Number(result.data.expires_in || 0) * 1000;
    const authUrl = result.data.verification_uri_complete ||
        (result.data.verification_uri && result.data.user_code
            ? `${result.data.verification_uri}?user_code=${encodeURIComponent(result.data.user_code)}`
            : result.data.verification_uri);
    setPdsValue("direct-url-input", authUrl || "");
    setPdsValue("pds-user-code-output", result.data.user_code || "");
    const openButton = pdsElement("pds-open-auth-button");
    if (openButton) openButton.disabled = !authUrl;
    setPdsStatus("等待授权确认");

    const intervalSeconds = Math.max(3, Number(result.data.interval || 5));
    pdsPollTimer = setInterval(pollPdsToken, intervalSeconds * 1000);
    await pollPdsToken();
}

async function pollPdsToken() {
    if (!pdsDeviceCode || pdsPolling) return;
    if (pdsPollExpiresAt > 0 && Date.now() > pdsPollExpiresAt) {
        stopPdsPolling();
        setPdsStatus("授权码已过期，请重新获取");
        return;
    }
    pdsPolling = true;
    try {
        const result = await pdsPost("/pds/device_token", {
            ...pdsConfigBase(),
            device_code: pdsDeviceCode,
        });
        if (result.status === 202 || result.data.status === "pending") {
            setPdsStatus("等待授权确认...");
            return;
        }
        if (!result.ok) {
            stopPdsPolling();
            setPdsStatus("授权失败");
            await showErrorMessage("授权", pdsMessage(result.data), result.status);
            return;
        }
        fillPdsToken(result.data);
        stopPdsPolling();
        setPdsStatus("授权成功");
        await Swal.fire({
            icon: "success",
            title: "授权成功",
            showConfirmButton: true,
            timer: 1000,
        });
        await loadPdsDrives();
    } finally {
        pdsPolling = false;
    }
}

function openPdsAuthURL() {
    const url = pdsValue("direct-url-input");
    if (url) window.open(url, "_blank", "noopener,noreferrer");
}

async function refreshPdsToken() {
    initPDSDefaults();
    const refreshToken = pdsValue("refresh-token");
    if (!refreshToken) {
        await showErrorMessage("刷新 Token", "请先填写 Refresh Token");
        return;
    }
    setPdsStatus("正在刷新 Token...");
    const result = await pdsPost("/pds/refresh", {
        ...pdsConfigBase(),
        refresh_token: refreshToken,
    });
    if (!result.ok) {
        setPdsStatus("刷新 Token 失败");
        await showErrorMessage("刷新 Token", pdsMessage(result.data), result.status);
        return;
    }
    fillPdsToken(result.data);
    setPdsStatus("Token 已刷新");
    await Swal.fire({
        icon: "success",
        title: "刷新 Token 成功",
        showConfirmButton: true,
        timer: 1000,
    });
}

function formatPdsSize(value) {
    const size = Number(value || 0);
    if (!size) return "";
    const units = ["B", "KB", "MB", "GB", "TB", "PB"];
    let index = 0;
    let current = size;
    while (current >= 1024 && index < units.length - 1) {
        current /= 1024;
        index += 1;
    }
    return `${current.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function updateSelectedDrive() {
    setPdsValue("pds-drive-id-input", pdsValue("pds-drive-select"));
}

function fillPdsDrives(drives) {
    pdsDrives = Array.isArray(drives) ? drives : [];
    const select = pdsElement("pds-drive-select");
    if (!select) return;
    select.innerHTML = "";
    for (const drive of pdsDrives) {
        const option = document.createElement("option");
        option.value = drive.drive_id || "";
        const ownerType = drive.owner_type ? ` / ${drive.owner_type}` : "";
        const sizeText = drive.total_size ? ` / ${formatPdsSize(drive.used_size)} / ${formatPdsSize(drive.total_size)}` : "";
        option.textContent = `${drive.drive_name || drive.drive_id}${ownerType}${sizeText}`;
        select.appendChild(option);
    }
    updateSelectedDrive();
}

async function loadPdsDrives() {
    initPDSDefaults();
    const accessToken = pdsValue("access-token");
    if (!accessToken) {
        await showErrorMessage("列出 Drive", "请先获取或填写 Access Token");
        return;
    }
    setPdsStatus("正在列出 Drive...");
    const result = await pdsPost("/pds/drives", {
        ...pdsConfigBase(),
        access_token: accessToken,
        token_type: pdsValue("pds-token-type-input") || "Bearer",
    });
    if (!result.ok) {
        setPdsStatus("列出 Drive 失败");
        await showErrorMessage("列出 Drive", pdsMessage(result.data), result.status);
        return;
    }
    fillPdsDrives(result.data.drives);
    setPdsStatus(`已找到 ${pdsDrives.length} 个 Drive`);
    if (pdsDrives.length === 0) {
        await Swal.fire({
            icon: "warning",
            title: "未找到 Drive",
            showConfirmButton: true,
        });
    }
}

function buildPDSConfig() {
    initPDSDefaults();
    const config = {
        root_folder_id: pdsValue("pds-root-folder-id-input") || "root",
        domain_id: pdsValue("client-uid-input"),
        drive_id: pdsValue("pds-drive-id-input"),
        client_id: pdsValue("client-key-input") || PDS_DEFAULT_CLIENT_ID,
        access_token: pdsValue("access-token"),
        refresh_token: pdsValue("refresh-token"),
        token_type: pdsValue("pds-token-type-input") || "Bearer",
        expires_at: 0,
    };
    setPdsValue("pds-config-output", JSON.stringify(config, null, 2));
}

function initPDSPage() {
    const driveSelect = pdsElement("pds-drive-select");
    if (driveSelect) driveSelect.addEventListener("change", updateSelectedDrive);
    if (pdsValue("driver-txt-input") === "pds_go") initPDSDefaults();
}

document.addEventListener("DOMContentLoaded", initPDSPage);
