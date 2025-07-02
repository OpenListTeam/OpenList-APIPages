const showGoogleConsent = () => {
    // 显示 Google 隐私政策和使用条款弹窗
    const modal = document.getElementById('google-consent-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}
const acceptGoogleConsent = closeGoogleConsentModal = () => {
    // 关闭 Google 隐私政策和使用条款弹窗
    const modal = document.getElementById('google-consent-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function showErrorMessage(actText = "", errText = "", errCode = 0) {
    console.log(errText, errCode);
    if (errCode === 429)
        await Swal.fire({
            position: 'top',
            icon: 'error',
            title: actText + '失败',
            text: '操作过于频繁，请稍后再试',
            showConfirmButton: true,
        });
    else await Swal.fire({
        position: 'top',
        icon: 'error',
        title: actText + '失败',
        text: errText,
        showConfirmButton: true,
    });
}