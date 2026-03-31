import type { Context } from "hono";

type _QRCodeResponse = {
    state: number;
    code: number;
    message: string;
    data: {
        uid: string;
        time: number;
        sign: string;
        qrcode: string;
        bind_code: number;
    };
};

export type QRCodeResponse = _QRCodeResponse["data"] & {
    _: string;
};

type StatusResponse = {
    state: number;
    code: number;
    message: string;
    data: {
        msg: string;
        status: number;
        version: string;
    };
};

export async function getQRCode(c: Context) {
    const resp = await fetch(`https://qrcodeapi.115.com/api/1.0/web/1.0/token`);
    const data: _QRCodeResponse = await resp.json();
    return c.json({
        ...data.data,
        _: (new Date().getTime() / 1000).toString(),
    });
}

export async function getTokenStatus(c: Context) {
    const requestBody: QRCodeResponse = await c.req.json();
    const url = new URL("https://qrcodeapi.115.com/get/status/");
    url.search = new URLSearchParams({
        uid: requestBody.uid,
        time: String(requestBody.time),
        sign: requestBody.sign,
        _: requestBody._,
    }).toString();
    const resp = await fetch(url.toString());
    const status: StatusResponse = await resp.json();
    return c.text(status.data.status.toString());
    /**
     * Status:
     * - 0: Waiting
     * - 1: Scanned
     * - 2: Signed in
     * - -1: Expired
     * - -2: Cancelled
     * 
     * Reference: https://gist.github.com/ChenyangGao/d26a592a0aeb13465511c885d5c7ad61
     */
}
