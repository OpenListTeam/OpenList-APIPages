// 阿里云盘扫码登录v2
class AlicloudQRLogin {
    constructor() {
        // 创建QR登录管理器实例
        this.qrManager = new QRLoginManager({
            onSuccess: this.handleLoginSuccess.bind(this),
            maxCheckTime: 30000 // 30秒过期时间
        });
    }

    // 启动阿里云盘扫码v2登录
    async startLogin() {
        try {
            // 显示模态框
            this.qrManager.showModal('阿里云盘扫码登录v2');

            // 生成二维码
            const response = await this.qrManager.fetchWithFingerprint('/alicloud2/generate_qr');
            const result = await response.json();

            if (result.success) {
                this.qrManager.sessionId = result.session_id;
                this.qrManager.provider = 'alicloud';
                this.qrManager.showQRCode(result.qr_code_url);
                this.qrManager.setStatus('请使用阿里云盘App扫描二维码', 'waiting');

                // 开始检查状态
                this.qrManager.startStatusCheck(this.checkStatus.bind(this));
            } else {
                this.qrManager.setStatus(result.error || '生成二维码失败', 'error');
                document.getElementById(this.qrManager.refreshBtnId).style.display = 'inline-block';
            }
        } catch (error) {
            console.error('生成二维码失败:', error);
            this.qrManager.setStatus('网络错误，请重试', 'error');
            document.getElementById(this.qrManager.refreshBtnId).style.display = 'inline-block';
        }
    }

    // 检查登录状态
    async checkStatus(elapsed) {
        if (!this.qrManager.sessionId) return;

        try {
            const response = await this.qrManager.fetchWithFingerprint(
                `/alicloud2/check_login?session_id=${this.qrManager.sessionId}`
            );
            const result = await response.json();

            if (result.success) {
                switch (result.status) {
                    case 'WAITING':
                        const waitTime = Math.floor(elapsed / 1000);
                        this.qrManager.setStatus(`等待扫描... (${waitTime}s) 请使用阿里云盘App扫码`, 'waiting');
                        break;
                    case 'SCANED':
                        this.qrManager.setStatus('已扫描，请在手机上确认登录', 'scaned');
                        break;
                    case 'CONFIRMED':
                        this.qrManager.setStatus('登录成功！正在获取用户信息...', 'success');
                        this.qrManager.stopStatusCheck();
                        setTimeout(async () => {
                            await this.getUserInfo();
                        }, 1000);
                        break;
                    case 'EXPIRED':
                        this.qrManager.setStatus('二维码已过期，请点击刷新重新生成', 'error');
                        this.qrManager.stopStatusCheck();
                        document.getElementById(this.qrManager.refreshBtnId).style.display = 'inline-block';
                        break;
                }
            } else {
                if (response.status === 403) {
                    this.qrManager.setStatus('会话验证失败，请重新生成二维码', 'error');
                    this.qrManager.stopStatusCheck();
                    document.getElementById(this.qrManager.refreshBtnId).style.display = 'inline-block';
                } else {
                    this.qrManager.setStatus('检查状态失败: ' + (result.error || '未知错误'), 'error');
                    document.getElementById(this.qrManager.refreshBtnId).style.display = 'inline-block';
                }
            }
        } catch (error) {
            console.error('检查登录状态失败:', error);
            this.qrManager.setStatus('网络连接失败，请检查网络后重试', 'error');
            document.getElementById(this.qrManager.refreshBtnId).style.display = 'inline-block';
        }
    }

    // 获取用户信息
    async getUserInfo() {
        if (!this.qrManager.sessionId) return;

        try {
            const response = await this.qrManager.fetchWithFingerprint(
                `/alicloud2/get_user_info?session_id=${this.qrManager.sessionId}`
            );
            const result = await response.json();

            if (result.success && result.user_info) {
                // 关闭模态框
                this.qrManager.closeModal();

                // 显示成功消息
                await Swal.fire({
                    position: 'top',
                    icon: 'success',
                    title: '登录成功',
                    html: `<div>用户: ${result.user_info.nick_name || result.user_info.user_id}</div>`,
                    showConfirmButton: true
                });

                // 填充token字段
                if (result.access_token) {
                    document.getElementById("access-token").value = result.access_token;
                }
                if (result.refresh_token) {
                    document.getElementById("refresh-token").value = result.refresh_token;
                }

                // 执行成功回调
                this.qrManager.onSuccess(result);

                // 清理会话
                await this.qrManager.fetchWithFingerprint(`/alicloud2/logout?session_id=${this.qrManager.sessionId}`);
                this.qrManager.sessionId = null;
            } else {
                if (response.status === 403) {
                    this.qrManager.setStatus('会话验证失败，请重新登录', 'error');
                } else {
                    this.qrManager.setStatus('获取用户信息失败: ' + (result.error || '未知错误'), 'error');
                }
            }
        } catch (error) {
            this.qrManager.setStatus('获取用户信息失败', 'error');
            console.error('获取用户信息失败:', error);
        }
    }

    // 刷新二维码
    async refreshQRCode() {
        document.getElementById(this.qrManager.refreshBtnId).style.display = 'none';

        // 清理旧会话
        if (this.qrManager.sessionId) {
            try {
                await this.qrManager.fetchWithFingerprint(`/alicloud2/logout?session_id=${this.qrManager.sessionId}`);
            } catch (e) {
                console.error('清理旧会话失败:', e);
            }
            this.qrManager.sessionId = null;
        }

        await this.startLogin();
    }

    // 登录成功处理函数
    handleLoginSuccess(result) {
        console.log('阿里云盘登录成功:', result);
    }
}

// 创建全局实例
window.alicloudQRLogin = new AlicloudQRLogin();

// 开始登录
function startAlicloud2Login() {
    window.alicloudQRLogin.startLogin();
}

// 刷新二维码
function refreshQRCode() {
    window.alicloudQRLogin.refreshQRCode();
}

// 关闭模态框
// 全局关闭模态框函数
function closeQRModal() {
    // 直接操作DOM关闭模态框，而不是调用实例方法
    const modal = document.getElementById('qr-modal');
    if (modal) {
        modal.style.display = 'none';
    }

    // 如果有活跃的检查间隔，清除它
    if (window.alicloudQRLogin && window.alicloudQRLogin.qrManager) {
        window.alicloudQRLogin.qrManager.stopStatusCheck();
        window.alicloudQRLogin.qrManager.resetUI();
    }

    // 同样处理aliTV的情况
    if (window.alitvQRLogin && window.alitvQRLogin.qrManager) {
        window.alitvQRLogin.qrManager.stopStatusCheck();
        window.alitvQRLogin.qrManager.resetUI();
    }
}