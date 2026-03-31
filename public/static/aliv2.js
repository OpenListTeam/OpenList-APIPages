// 生成客户端指纹
function generateClientFingerprint() {
    if (clientFingerprint) return clientFingerprint;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Client fingerprint', 2, 2);

    const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL(),
        navigator.hardwareConcurrency || 'unknown',
        navigator.deviceMemory || 'unknown'
    ].join('|');

    // 生成简单的哈希
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
    }

    clientFingerprint = Math.abs(hash).toString(36);
    // console.log('客户端指纹生成:', clientFingerprint);
    return clientFingerprint;
}

// 发送带有客户端指纹的请求
async function fetchWithFingerprint(url, options = {}) {
    const fingerprint = generateClientFingerprint();
    const headers = {
        'X-Client-Fingerprint': fingerprint,
        ...options.headers
    };

    return fetch(url, {
        ...options,
        headers
    });
}

// 启动阿里云盘扫码v2登录
async function startAlicloud2Login() {
    try {
        // 显示模态框
        document.getElementById('qr-modal').style.display = 'block';
        setQRStatus('正在生成二维码...', 'waiting');

        // 生成二维码 - 使用带指纹的请求
        const response = await fetchWithFingerprint('/alicloud2/generate_qr');
        const result = await response.json();

        if (result.success) {
            alicloud2SessionId = result.session_id;
            alicloud2StartTime = Date.now();
            showQRCode(result.qr_code_url);
            setQRStatus('请使用阿里云盘App扫描二维码', 'waiting');

            // 显示过期时间信息
            if (result.expires_in) {
                const expireMinutes = Math.floor(result.expires_in / 60);
                // console.log(`会话将在 ${expireMinutes} 分钟后过期`);
            }

            checkQRStatus = checkAlicloud2Status;
            startAliQRStatusCheck();
        } else {
            setQRStatus(result.error || '生成二维码失败', 'error');
            document.getElementById('refresh-qr-btn').style.display = 'inline-block';
        }
    } catch (error) {
        setQRStatus('网络错误，请重试', 'error');
        document.getElementById('refresh-qr-btn').style.display = 'inline-block';
        console.error('生成二维码失败:', error);
    }
}

// 开始状态检查
function startAliQRStatusCheck() {
    stopAliQRStatusCheck();
    alicloud2CheckInterval = setInterval(checkAlicloud2Status, 2000);
}

// 停止状态检查
function stopAliQRStatusCheck() {
    if (alicloud2CheckInterval) {
        clearInterval(alicloud2CheckInterval);
        alicloud2CheckInterval = null;
    }
}

// 检查登录状态
async function checkAlicloud2Status() {
    if (!alicloud2SessionId) return;

    // 检查是否超过3分钟（二维码可能过期）
    const elapsed = Date.now() - alicloud2StartTime;
    if (elapsed > 180000) { // 3分钟
        setQRStatus('二维码可能已过期，建议点击刷新重新生成', 'error');
        document.getElementById('refresh-qr-btn').style.display = 'inline-block';
        stopAliQRStatusCheck();
        return;
    }

    try {
        // 使用带指纹的请求
        const response = await fetchWithFingerprint(`/alicloud2/check_login?session_id=${alicloud2SessionId}`);
        const result = await response.json();

        if (result.success) {
            switch (result.status) {
                case 'WAITING':
                    const waitTime = Math.floor(elapsed / 1000);
                    setQRStatus(`等待扫描... (${waitTime}s) 请使用阿里云盘App扫码`, 'waiting');
                    break;
                case 'SCANED':
                    setQRStatus('已扫描，请在手机上确认登录', 'scaned');
                    break;
                case 'CONFIRMED':
                    setQRStatus('登录成功！正在获取用户信息...', 'success');
                    stopAliQRStatusCheck();
                    // 稍等一下确保token已保存
                    setTimeout(async () => {
                        await getAlicloud2UserInfo();
                    }, 1000);
                    break;
                case 'EXPIRED':
                    setQRStatus('二维码已过期，请点击刷新重新生成', 'error');
                    stopAliQRStatusCheck();
                    document.getElementById('refresh-qr-btn').style.display = 'inline-block';
                    break;
            }
        } else {
            // 处理会话验证失败的情况
            if (response.status === 403) {
                setQRStatus('会话验证失败，请重新生成二维码', 'error');
                document.getElementById('refresh-qr-btn').style.display = 'inline-block';
                stopAliQRStatusCheck();
            } else {
                setQRStatus('检查状态失败: ' + (result.error || '未知错误'), 'error');
                document.getElementById('refresh-qr-btn').style.display = 'inline-block';
            }
        }
    } catch (error) {
        console.error('检查登录状态失败:', error);
        setQRStatus('网络连接失败，请检查网络后重试', 'error');
        document.getElementById('refresh-qr-btn').style.display = 'inline-block';
    }
}

// 获取用户信息
async function getAlicloud2UserInfo() {
    if (!alicloud2SessionId) return;

    try {
        // 使用带指纹的请求
        const response = await fetchWithFingerprint(`/alicloud2/get_user_info?session_id=${alicloud2SessionId}`);
        const result = await response.json();

        if (result.success && result.user_info) {
            // 关闭模态框
            closeQRModal();

            // 显示成功消息
            await Swal.fire({
                position: 'top',
                icon: 'success',
                title: '登录成功',
                html: `<div>用户: ${result.user_info.nick_name || result.user_info.user_id}</div>`,
                showConfirmButton: true
            });

            // 填充token字段（使用真实的tokens）
            if (result.access_token) {
                document.getElementById("access-token").value = result.access_token;
            }
            if (result.refresh_token) {
                document.getElementById("refresh-token").value = result.refresh_token;
            }

            // 清理会话
            await fetchWithFingerprint(`/alicloud2/logout?session_id=${alicloud2SessionId}`);
            alicloud2SessionId = null;
        } else {
            // 处理会话验证失败的情况
            if (response.status === 403) {
                setQRStatus('会话验证失败，请重新登录', 'error');
            } else {
                setQRStatus('获取用户信息失败: ' + (result.error || '未知错误'), 'error');
            }
        }
    } catch (error) {
        setQRStatus('获取用户信息失败', 'error');
        console.error('获取用户信息失败:', error);
    }
}

