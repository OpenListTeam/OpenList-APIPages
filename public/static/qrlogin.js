// 通用扫码登录模块
class QRLoginManager {
    constructor(options = {}) {
        this.modalId = options.modalId || 'qr-modal';
        this.codeContainerId = options.codeContainerId || 'qr-code-container';
        this.codeDisplayId = options.codeDisplayId || 'qr-code-display';
        this.statusId = options.statusId || 'qr-status';
        this.refreshBtnId = options.refreshBtnId || 'refresh-qr-btn';
        this.closeModal = options.closeModal ? options.closeModal : this.defaultCloseModal.bind(this);
        this.checkInterval = null;
        this.sessionId = null;
        this.startTime = null;
        this.provider = null; // 提供商名称，如 'alicloud', 'alitv' 等
        this.onSuccess = options.onSuccess || function() {};
        this.maxCheckTime = options.maxCheckTime || 180000; // 默认3分钟
        this.checkFrequency = options.checkFrequency || 2500; // 默认2.5秒检查一次
    }

    // 显示二维码模态框
    showModal(title = '扫码登录') {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            // 设置标题
            const titleElement = modal.querySelector('h4');
            if (titleElement) {
                titleElement.textContent = title;
            }
            modal.style.display = 'block';
            this.setStatus('正在生成二维码...', 'waiting');
        }
    }

    // 默认关闭模态框方法
    defaultCloseModal() {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.style.display = 'none';
        }
        this.stopStatusCheck();
        this.resetUI();
    }

    // 重置UI状态
    resetUI() {
        document.getElementById(this.codeContainerId).style.display = 'none';
        document.getElementById(this.statusId).style.display = 'none';
        document.getElementById(this.refreshBtnId).style.display = 'none';
    }

    // 显示二维码
    showQRCode(qrUrl, size = 200) {
        try {
            const codeDisplayElement = document.getElementById(this.codeDisplayId);
            codeDisplayElement.innerHTML = ''; // 清除之前的内容
            // 创建canvas元素
            const canvas = document.createElement('canvas');
            codeDisplayElement.appendChild(canvas);
            // 使用新创建的canvas元素
            QRCode.toCanvas(canvas, qrUrl, {
                width: size,
                margin: 1,
            }, function(error) {
                if (error) console.error('QR码生成错误:', error);
            });

            document.getElementById(this.codeContainerId).style.display = 'block';
        } catch (error) {
            console.error('生成QR码失败:', error);
        }
    }

    // 设置状态
    setStatus(message, type) {
        const statusEl = document.getElementById(this.statusId);
        statusEl.textContent = message;
        statusEl.className = `qr-status ${type}`;
        statusEl.style.display = 'block';
    }

    // 开始状态检查
    startStatusCheck(checkFunction) {
        this.stopStatusCheck();
        this.startTime = Date.now();
        this.checkInterval = setInterval(() => {
            // 检查是否超过最大时间
            const elapsed = Date.now() - this.startTime;
            if (elapsed > this.maxCheckTime) {
                this.setStatus('二维码已过期，请点击刷新重新生成', 'error');
                document.getElementById(this.refreshBtnId).style.display = 'inline-block';
                this.stopStatusCheck();
                return;
            }

            // 执行传入的检查函数
            if (typeof checkFunction === 'function') {
                checkFunction(elapsed);
            }
        }, this.checkFrequency);
    }

    // 停止状态检查
    stopStatusCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    // 生成随机会话ID
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
    }

    // 获取客户端指纹
    getClientFingerprint() {
        if (window.clientFingerprint) return window.clientFingerprint;

        // 简单指纹生成
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
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

        window.clientFingerprint = Math.abs(hash).toString(36);
        return window.clientFingerprint;
    }

    // 发送带有客户端指纹的请求
    async fetchWithFingerprint(url, options = {}) {
        const fingerprint = this.getClientFingerprint();
        const headers = {
            'X-Client-Fingerprint': fingerprint,
            ...options.headers
        };

        return fetch(url, {
            ...options,
            headers
        });
    }
}

// 显示错误消息的辅助函数
async function showErrorMessage(title, message, code = "") {
    let errorMsg = message;
    if (code) errorMsg += ` (错误码: ${code})`;

    await Swal.fire({
        icon: 'error',
        title: title + '失败',
        text: errorMsg,
        showConfirmButton: true
    });
}

// 导出模块
window.QRLoginManager = QRLoginManager;
window.showErrorMessage = showErrorMessage;