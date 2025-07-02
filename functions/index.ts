import {app} from '../src'

export function onRequest(context: {
    request: Request;
    params: Record<string, string>;
    env: Record<string, any>;
}): Response | Promise<Response> {
    return app.fetch(context.request, context.env);
}