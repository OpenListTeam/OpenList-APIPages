// 阿里云盘TV版扫码登录
class AliTVQRLogin {
    constructor() {
        // 创建QR登录管理器实例
        this.qrManager = new QRLoginManager({
            onSuccess: this.handleLoginSuccess.bind(this),
            maxCheckTime: 30000 // 30秒过期时间
        });
        this.sidValue = null; // 存储二维码的sid
        this.checkAttempts = 0; // 检查尝试次数
        this.maxCheckAttempts = 12; // 最大检查次数（30秒内，每2.5秒检查一次）
    }

    // 启动阿里云盘TV版扫码登录
    async startLogin() {
        try {
            // 显示模态框
            this.qrManager.showModal('阿里云盘TV版扫码登录');

            // 构建请求参数
            const client_uid = document.getElementById("client-uid-input").value;
            const client_key = document.getElementById("client-key-input").value;
            const server_use = document.getElementById("server-use-input").checked;

            // 获取二维码
            const requestUrl = `/alitv/qrcode?client_uid=${encodeURIComponent(client_uid)}&client_key=${encodeURIComponent(client_key)}&server_use=${server_use}`;
            const response = await fetch(requestUrl);
            const result = await response.json();

            if (result.text && result.sid) {
                this.qrManager.sessionId = this.qrManager.generateSessionId();
                this.qrManager.provider = 'alitv';
                this.sidValue = result.sid;
                this.checkAttempts = 0;

                // 显示二维码
                this.qrManager.showQRCode(result.text);
                this.qrManager.setStatus('请使用阿里云盘App扫描二维码登录TV版', 'waiting');

                // 开始检查状态
                this.qrManager.startStatusCheck(this.checkStatus.bind(this));
            } else {
                this.qrManager.setStatus(result.text || '生成二维码失败', 'error');
                document.getElementById(this.qrManager.refreshBtnId).style.display = 'inline-block';
            }
        } catch (error) {
            console.error('获取TV版二维码失败:', error);
            this.qrManager.setStatus('网络错误，请重试', 'error');
            document.getElementById(this.qrManager.refreshBtnId).style.display = 'inline-block';
        }
    }

    // 检查登录状态
    async checkStatus(elapsed) {
        if (!this.sidValue) return;

        // 检查尝试次数是否达到上限
        if (this.checkAttempts >= this.maxCheckAttempts) {
            this.qrManager.setStatus('二维码已过期，请点击刷新重新生成', 'error');
            this.qrManager.stopStatusCheck();
            document.getElementById(this.qrManager.refreshBtnId).style.display = 'inline-block';
            return;
        }

        this.checkAttempts++;

        try {
            const waitTime = Math.floor(elapsed / 1000);
            this.qrManager.setStatus(`等待扫描... (${waitTime}s) 请使用阿里云盘App扫码登录TV版`, 'waiting');

            // 构建请求参数
            const client_uid = document.getElementById("client-uid-input").value;
            const client_key = document.getElementById("client-key-input").value;
            const server_use = document.getElementById("server-use-input").checked;

            // 检查二维码状态
            const requestUrl = `/alitv/check?sid=${encodeURIComponent(this.sidValue)}&client_uid=${encodeURIComponent(client_uid)}&client_key=${encodeURIComponent(client_key)}&server_use=${server_use}`;
            const response = await fetch(requestUrl);

            // 如果状态码是202，表示还在等待扫码
            if (response.status === 202) {
                return; // 继续等待
            }

            // 如果状态码是200，尝试解析结果
            if (response.ok) {
                const result = await response.json();

                if (result.auth_code) {
                    // 获取到了授权码，表示登录成功
                    this.qrManager.setStatus('登录成功！正在获取Token...', 'success');
                    this.qrManager.stopStatusCheck();

                    // 获取token
                    await this.getToken(result.auth_code);
                }
            }
        } catch (error) {
            // 错误处理，但轮询期间的一些网络错误可能是正常的，不需要中断轮询
            console.error('检查TV版登录状态失败:', error);
            // 不显示错误，继续轮询
        }
    }

    // 获取Token
    async getToken(authCode) {
        try {
            // 构建请求参数
            const client_uid = document.getElementById("client-uid-input").value;
            const client_key = document.getElementById("client-key-input").value;
            const server_use = document.getElementById("server-use-input").checked;

            const requestUrl = `/alitv/token?auth_code=${encodeURIComponent(authCode)}&client_uid=${encodeURIComponent(client_uid)}&client_key=${encodeURIComponent(client_key)}&server_use=${server_use}`;
            const response = await fetch(requestUrl);

            if (response.ok) {
                const tokenData = await response.json();

                // 关闭模态框
                this.qrManager.closeModal();

                // 显示成功消息
                await Swal.fire({
                    position: 'top',
                    icon: 'success',
                    title: '登录成功',
                    text: '已成功获取阿里云盘TV版Token',
                    showConfirmButton: true
                });

                // 填充token字段
                if (tokenData.access_token) {
                    document.getElementById("access-token").value = tokenData.access_token;
                }
                if (tokenData.refresh_token) {
                    document.getElementById("refresh-token").value = tokenData.refresh_token;
                }

                // 执行成功回调
                this.qrManager.onSuccess(tokenData);
            } else {
                this.qrManager.setStatus('获取Token失败: ' + (await response.text()), 'error');
                document.getElementById(this.qrManager.refreshBtnId).style.display = 'inline-block';
            }
        } catch (error) {
            console.error('获取TV版Token失败:', error);
            this.qrManager.setStatus('获取Token失败，请重试', 'error');
            document.getElementById(this.qrManager.refreshBtnId).style.display = 'inline-block';
        }
    }

    // 刷新二维码
    async refreshQRCode() {
        document.getElementById(this.qrManager.refreshBtnId).style.display = 'none';
        this.sidValue = null;
        this.checkAttempts = 0;
        await this.startLogin();
    }

    // 登录成功处理函数
    handleLoginSuccess(result) {
        console.log('阿里云盘TV版登录成功');
    }
}

// 创建全局实例
window.alitvQRLogin = new AliTVQRLogin();

// 开始TV版登录
function startAliTVLogin() {
    window.alitvQRLogin.startLogin();
}