import {Context} from "hono";
import {Requests} from "../shares/request";

const DEFAULT_CLIENT_ID = "lMNVp25Sd1MfqZDQ";
const DEVICE_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:device_code";

type JsonMap = Record<string, any>;

function isRecord(value: unknown): value is JsonMap {
    return typeof value === "object" && value !== null;
}

async function getJsonBody(c: Context): Promise<JsonMap> {
    try {
        const body = await c.req.json();
        return isRecord(body) ? body : {};
    } catch {
        return {};
    }
}

function getString(body: JsonMap, key: string, fallback = ""): string {
    const value = body[key];
    return typeof value === "string" ? value.trim() : fallback;
}

function normalizeClientID(clientID: string): string {
    return clientID || DEFAULT_CLIENT_ID;
}

function domainIDError(domainID: string): string {
    if (!domainID) return "domain_id 不能为空";
    if (!/^[A-Za-z0-9][A-Za-z0-9-]{0,62}$/.test(domainID))
        return "domain_id 格式不正确";
    return "";
}

function apiEndpoint(domainID: string): string {
    return `https://${domainID}.api.aliyunfile.com`;
}

function authEndpoint(domainID: string): string {
    return `https://${domainID}.auth.aliyunfile.com`;
}

function upstreamMessage(data: JsonMap): string {
    return String(
        data.message ||
        data.error_description ||
        data.error ||
        data.code ||
        data.text ||
        "PDS 请求失败"
    );
}

function isPendingAuthorization(data: JsonMap): boolean {
    const message = upstreamMessage(data).toLowerCase();
    return message.includes("authorizationpending") ||
        message.includes("authorization_pending") ||
        message.includes("authorization is pending") ||
        message.includes("authorization pending");
}

function toForm(params: JsonMap): Record<string, string> {
    return Object.fromEntries(
        Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => [key, String(value)])
    );
}

async function postForm(c: Context, url: string, params: JsonMap): Promise<JsonMap> {
    return await Requests(c, toForm(params), url, "POST", false, {
        "Content-Type": "application/x-www-form-urlencoded",
    });
}

async function postJson(c: Context, domainID: string, path: string, tokenType: string,
                        accessToken: string, params: JsonMap): Promise<JsonMap> {
    return await Requests(c, params as Record<string, string>, `${apiEndpoint(domainID)}${path}`,
        "POST", false, {
            "Authorization": `${tokenType || "Bearer"} ${accessToken}`,
            "Content-Type": "application/json",
        });
}

function pickItems(data: JsonMap): JsonMap[] {
    const items = data.items;
    if (!Array.isArray(items)) return [];
    return items.filter(isRecord);
}

function appendDrive(map: Map<string, JsonMap>, drive: JsonMap, ownerType = "") {
    const driveID = getString(drive, "drive_id");
    if (!driveID || map.has(driveID)) return;
    map.set(driveID, {
        drive_id: driveID,
        drive_name: getString(drive, "drive_name") || getString(drive, "name") || driveID,
        owner_type: getString(drive, "owner_type", ownerType),
        total_size: drive.total_size,
        used_size: drive.used_size,
    });
}

async function listGroupDrives(c: Context, domainID: string, tokenType: string,
                               accessToken: string): Promise<JsonMap> {
    const paths = [
        "/v2/drive/list_my_group_drives",
        "/v2/drive/list_my_group_drive",
        "/v2/drive/list_all_my_group_drives",
        "/v2/group/list_my_group_drives",
    ];
    for (const path of paths) {
        const data = await postJson(c, domainID, path, tokenType, accessToken, {
            limit: 100,
            marker: "",
        });
        if (Array.isArray(data.items) || isRecord(data.root_group_drive)) return data;
    }
    return {};
}

export async function page(c: Context) {
    return c.redirect("/");
}

export async function deviceAuthorization(c: Context) {
    const body = await getJsonBody(c);
    const domainID = getString(body, "domain_id");
    const clientID = normalizeClientID(getString(body, "client_id"));
    const deviceName = getString(body, "device_name", "OpenList PDS");
    const error = domainIDError(domainID);
    if (error) return c.json({text: error}, 400);

    const result = await postForm(c, `${apiEndpoint(domainID)}/v2/oauth/device_authorization`, {
        client_id: clientID,
        device_name: deviceName,
        device_info: deviceName,
        login_type: "default",
    });
    if (!result.device_code) return c.json({text: upstreamMessage(result), raw: result}, 500);
    return c.json({
        ...result,
        client_id: clientID,
    }, 200);
}

export async function deviceToken(c: Context) {
    const body = await getJsonBody(c);
    const domainID = getString(body, "domain_id");
    const clientID = normalizeClientID(getString(body, "client_id"));
    const deviceCode = getString(body, "device_code");
    const error = domainIDError(domainID);
    if (error) return c.json({text: error}, 400);
    if (!deviceCode) return c.json({text: "device_code 不能为空"}, 400);

    const result = await postForm(c, `${apiEndpoint(domainID)}/v2/oauth/token`, {
        grant_type: DEVICE_GRANT_TYPE,
        device_code: deviceCode,
        client_id: clientID,
    });
    if (result.access_token) {
        const expiresIn = Number(result.expires_in || 0);
        return c.json({
            ...result,
            expires_at: expiresIn > 0 ? Math.floor(Date.now() / 1000) + expiresIn : 0,
        }, 200);
    }
    if (isPendingAuthorization(result))
        return c.json({status: "pending", text: "等待授权确认", raw: result}, 202);
    return c.json({text: upstreamMessage(result), raw: result}, 500);
}

export async function refreshToken(c: Context) {
    const body = await getJsonBody(c);
    const domainID = getString(body, "domain_id");
    const clientID = normalizeClientID(getString(body, "client_id"));
    const refreshToken = getString(body, "refresh_token");
    const error = domainIDError(domainID);
    if (error) return c.json({text: error}, 400);
    if (!refreshToken) return c.json({text: "refresh_token 不能为空"}, 400);

    const result = await postForm(c, `${authEndpoint(domainID)}/v2/oauth/token`, {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientID,
    });
    if (!result.access_token) return c.json({text: upstreamMessage(result), raw: result}, 500);
    const expiresIn = Number(result.expires_in || 0);
    return c.json({
        ...result,
        refresh_token: result.refresh_token || refreshToken,
        expires_at: expiresIn > 0 ? Math.floor(Date.now() / 1000) + expiresIn : 0,
    }, 200);
}

export async function drives(c: Context) {
    const body = await getJsonBody(c);
    const domainID = getString(body, "domain_id");
    const accessToken = getString(body, "access_token");
    const tokenType = getString(body, "token_type", "Bearer");
    const error = domainIDError(domainID);
    if (error) return c.json({text: error}, 400);
    if (!accessToken) return c.json({text: "access_token 不能为空"}, 400);

    const domain = await postJson(c, domainID, "/v2/domain/get", tokenType, accessToken, {
        fields: "*",
    });
    if (domain.code || domain.error || domain.message)
        return c.json({text: upstreamMessage(domain), raw: domain}, 500);

    const mine = await postJson(c, domainID, "/v2/drive/list_my_drives", tokenType, accessToken, {
        limit: 100,
        marker: "",
    });
    if (!Array.isArray(mine.items))
        return c.json({text: upstreamMessage(mine), raw: mine}, 500);

    const group = await listGroupDrives(c, domainID, tokenType, accessToken);
    const driveMap = new Map<string, JsonMap>();
    for (const item of pickItems(mine)) appendDrive(driveMap, item, "user");
    if (isRecord(group.root_group_drive)) appendDrive(driveMap, group.root_group_drive, "group");
    for (const item of pickItems(group)) appendDrive(driveMap, item, "group");

    return c.json({
        domain,
        drives: Array.from(driveMap.values()),
        my_drives: mine,
        group_drives: group,
    }, 200);
}
