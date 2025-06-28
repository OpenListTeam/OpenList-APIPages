import * as index from '../src'

export function onRequest(context: {
    request: Request;
    params: Record<string, string>;
    env: Record<string, any>;
}): Response | Promise<Response> {
    return index.app.fetch(context.request, context.env);
}