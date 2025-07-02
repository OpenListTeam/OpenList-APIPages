import {Context, Hono} from 'hono'
import * as oneui from './driver/onedrive_oa';
import * as aliui from './driver/alicloud_oa';
import * as aliqr from './driver/alicloud_cs';
import * as ui115 from './driver/115cloud_oa';
import * as ui123 from './driver/123cloud_oa';
import * as baidu from './driver/baiduyun_oa';
import * as goapi from './driver/googleui_oa';
import * as yanui from './driver/yandexui_oa';
import * as drops from './driver/dropboxs_oa';
import * as quark from './driver/quarkpan_oa';

export type Bindings = {
    MAIN_URLS: string, baiduyun_ext: string,
    onedrive_uid: string, onedrive_key: string,
    alicloud_uid: string, alicloud_key: string,
    baiduyun_uid: string, baiduyun_key: string,
    cloud115_uid: string, cloud115_key: string,
    googleui_uid: string, googleui_key: string,
    yandexui_uid: string, yandexui_key: string,
    dropboxs_uid: string, dropboxs_key: string,
}

export const app = new Hono<{ Bindings: Bindings }>()

// 登录申请 ##############################################################################
app.get('/dropboxs/requests', async (c) => {
    return drops.getLogin(c);
})

// 令牌申请 ##############################################################################
app.get('/dropboxs/callback', async (c) => {
    return drops.urlParse(c);
})

// 令牌刷新 ##############################################################################
app.get('/dropboxs/renewapi', async (c: Context) => {
    return drops.apiRenew(c);
});

// 登录申请 ##############################################################################
app.get('/onedrive/requests', async (c) => {
    return oneui.oneLogin(c);
})

// 令牌申请 ##############################################################################
app.get('/onedrive/callback', async (c) => {
    return oneui.oneToken(c);
})

// 令牌刷新 ##############################################################################
app.get('/onedrive/renewapi', async (c: Context) => {
    return oneui.genToken(c);
});

// 登录申请 ##############################################################################
app.get('/alicloud/requests', async (c: Context) => {
    return aliui.alyLogin(c);
});

// 令牌申请 ##############################################################################
app.get('/alicloud/callback', async (c: Context) => {
    return aliui.alyToken(c);
});

// 令牌刷新 ##############################################################################
app.get('/alicloud/renewapi', async (c: Context) => {
    return aliui.genToken(c);
});

// 阿里云盘扫码2 - 生成二维码 ##############################################################################
app.get('/alicloud2/generate_qr', async (c: Context) => {
    return aliqr.generateQR(c);
});

// 阿里云盘扫码2 - 检查登录状态 ##############################################################################
app.get('/alicloud2/check_login', async (c: Context) => {
    return aliqr.checkLogin(c);
});

// 令牌刷新 ##############################################################################
app.get('/alicloud2/renewapi', async (c: Context) => {
    return aliqr.genToken(c);
});

// 阿里云盘扫码2 - 获取用户信息 ##############################################################################
app.get('/alicloud2/get_user_info', async (c: Context) => {
    return aliqr.getUserInfo(c);
});

// 阿里云盘扫码2 - 退出登录 ##############################################################################
app.get('/alicloud2/logout', async (c: Context) => {
    return aliqr.logout(c);
});

// 登录申请 ##############################################################################
app.get('/baiduyun/requests', async (c: Context) => {
    return baidu.oneLogin(c);
});

// 令牌申请 ##############################################################################
app.get('/baiduyun/callback', async (c: Context) => {
    return baidu.oneToken(c);
});

// 令牌刷新 ##############################################################################
app.get('/baiduyun/renewapi', async (c: Context) => {
    return baidu.genToken(c);
});

// 登录申请 ##############################################################################
app.get('/115cloud/requests', async (c: Context) => {
    return ui115.oneLogin(c);
});

// 令牌申请 ##############################################################################
app.get('/115cloud/callback', async (c: Context) => {
    return ui115.oneToken(c);
});

// 令牌刷新 ##############################################################################
app.get('/115cloud/renewapi', async (c: Context) => {
    return ui115.genToken(c);
});

// 登录申请 ##############################################################################
app.get('/123cloud/requests', async (c: Context) => {
    return ui123.oneLogin(c);
});

// 令牌申请 ##############################################################################
app.get('/123cloud/callback', async (c: Context) => {
    return ui123.oneToken(c);
});

// 令牌刷新 ##############################################################################
app.get('/123cloud/renewapi', async (c: Context) => {
    return ui123.genToken(c);
});

// 登录申请 ##############################################################################
app.get('/googleui/requests', async (c: Context) => {
    return goapi.oneLogin(c);
});

// 令牌申请 ##############################################################################
app.get('/googleui/callback', async (c: Context) => {
    return goapi.oneToken(c);
});

// 令牌刷新 ##############################################################################
app.get('/googleui/renewapi', async (c: Context) => {
    return goapi.genToken(c);
});

// 登录申请 ##############################################################################
app.get('/yandexui/requests', async (c: Context) => {
    return yanui.yandexLogin(c)
});

// 令牌申请 ##############################################################################
app.get('/yandexui/callback', async (c: Context) => {
    return yanui.yandexCallBack(c)
});

// 令牌刷新 ##############################################################################
app.get('/yandexui/renewapi', async (c: Context) => {
    return yanui.genToken(c);
});

// 登录申请 ##############################################################################
app.get('/quarkyun/requests', async (c) => {
    return await quark.getLogin(c);
});

// 令牌申请 ##############################################################################
app.get('/quarkyun/callback', async (c) => {
    return await quark.urlParse(c);
});

// 令牌刷新 ##############################################################################
app.get('/quarkyun/renewapi', async (c) => {
    return await quark.apiRenew(c);
});


export default app
