/**
 * @typedef {import('../../src/driver/115cloud_qr.ts').QRCodeResponse} QRCodeResponse
 */

async function start115CloudQRLogin() {
    try {
        // 显示模态框
        document.getElementById('qr-modal').style.display = 'block';
        setQRStatus('正在生成二维码...', 'waiting');

        // 生成二维码 - 向后端发送请求
        const response = await fetch(`/115cloud_qr/get_qr`);
        if (response.ok) {
            /** @type {QRCodeResponse} */
            const result = await response.json();
            showQRCode(result.qrcode);

            setQRStatus('请使用115 App扫描二维码', 'waiting');

            checkQRStatus = () => check115CloudQRStatus(result);

            // qr115CheckInterval = setInterval(() => check115CloudQRStatus(result), 2000);
        } else {
            setQRStatus(response.statusText || '生成二维码失败', 'error');
            document.getElementById('refresh-qr-btn').style.display = 'inline-block';
        }
    } catch (error) {
        setQRStatus('网络错误，请重试', 'error');
        document.getElementById('refresh-qr-btn').style.display = 'inline-block';
        console.error('生成二维码失败:', error);
    }
}

/**
 * @param {QRCodeResponse} body 
 */
async function check115CloudQRStatus(body) {
    try {
        const response = await fetch('/115cloud_qr/check_status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        });
        /** @type {HTMLButtonElement} */
        const refreshBtn = document.getElementById('refresh-qr-btn');
        if (response.ok) {
            const status = await response.text();
            switch (status) {
                case '0':
                    setQRStatus('等待扫描二维码', 'waiting');
                    break;
                case '1':
                    setQRStatus('二维码已扫描，请在手机上确认登录', 'waiting');
                    break;
                case '2':
                    setQRStatus('登录成功', 'success');
                    // clearInterval(qr115CheckInterval);
                    document.getElementById("access-token").value = body.uid;
                    closeQRModal();
                    break;
                case '-1':
                    setQRStatus('二维码已过期，请刷新重试', 'error');
                    refreshBtn.style.display = 'inline-block';
                    break;
                case '-2':
                    setQRStatus('登录已取消，请重试', 'error');
                    refreshBtn.style.display = 'inline-block';
                    break;
                default:
                    setQRStatus(`未知状态: ${status}`, 'info');
            }
        } else {
            setQRStatus('检查登录状态失败', 'error');
        }
    } catch (error) {
        setQRStatus('网络错误，请重试', 'error');
        console.error('检查登录状态失败:', error);
    }
}