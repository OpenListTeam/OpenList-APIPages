// 显示二维码
function showQRCode(qrUrl) {
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;
    document.getElementById('qr-code-display').innerHTML = `<img src="${qrApiUrl}" alt="二维码" class="qr-code-img">`;
    document.getElementById('qr-code-container').style.display = 'block';
}

// 设置状态
function setQRStatus(message, type) {
    const statusEl = document.getElementById('qr-status');
    statusEl.textContent = message;
    statusEl.className = `qr-status ${type}`;
    statusEl.style.display = 'block';
}

/** @type {() => Promise<void> | null} */
var checkQRStatus = null;

/**
 * @summary 刷新二维码
 */
async function refreshQRCode() {
    document.getElementById('refresh-qr-btn').style.display = 'none';
    // 清理旧会话
    switch (driver_txt) {
        case 'alicloud_cs':
            if (alicloud2SessionId) {
                try {
                    await fetchWithFingerprint(`/alicloud2/logout?session_id=${alicloud2SessionId}`);
                } catch (e) {
                    // console.log('清理旧会话失败:', e);
                }
                alicloud2SessionId = null;
            }
            await startAlicloud2Login();
            break;
        case '115cloud_qr':
            await start115CloudQRLogin();
            break;
    }
}

// 关闭模态框
function closeQRModal() {
    document.getElementById('qr-modal').style.display = 'none';
    switch (driver_txt) {
        case 'alicloud_cs':
            stopAliQRStatusCheck();

            // 清理会话
            if (alicloud2SessionId) {
                fetchWithFingerprint(`/alicloud2/logout?session_id=${alicloud2SessionId}`);
                alicloud2SessionId = null;
            }
            break;
        case '115cloud_qr':
            
            break;
    }

    // 重置界面
    document.getElementById('qr-code-container').style.display = 'none';
    document.getElementById('qr-status').style.display = 'none';
    document.getElementById('refresh-qr-btn').style.display = 'none';
}

