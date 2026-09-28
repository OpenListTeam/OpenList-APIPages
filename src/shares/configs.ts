import {Context} from "hono";

export interface Clients {
    app_uid: string | undefined,
    app_key: string | undefined,
    secrets: string | undefined,
    drivers: string | undefined,
    servers: boolean | undefined,
}

export function getInfo(c: Context): Clients | undefined {
    const client_uid: string | undefined = c.req.query('client_uid');
    const client_key: string | undefined = c.req.query('client_key');
    const secret_key: string | undefined = c.req.query('secret_key');
    const driver_txt: string | undefined = c.req.query('driver_txt');
    const server_use: string | undefined = c.req.query('server_use');
    if (!server_use || server_use === "false")
        if (!driver_txt || !client_key)
            return undefined;
    return {
        app_uid: client_uid === undefined ? "" : client_uid,
        app_key: client_key === undefined ? "" : client_key,
        secrets: secret_key === undefined ? "" : secret_key,
        drivers: driver_txt === undefined ? "" : driver_txt,
        servers: !server_use ? false : server_use == "true"
    };
}
export function getBaseHost(c: Context): string {
    const custom = (c.env?.MAIN_URLS || "").trim();
    if (custom && custom !== "api.example.com") {
        return custom;
    }
    try {
        const u = new URL(c.req.url);
        if (u.host) return u.host;
    } catch {}
    return c.req.header("host") || "api.example.com";
}
