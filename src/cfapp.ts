import * as index from './index'

type Env = index.Bindings & {
  ASSETS: Fetcher
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // 先由 Hono 处理 API 路由
    const res = await index.app.fetch(request, env, ctx)
    // API 未匹配（404）时，回退到 Cloudflare Static Assets 返回静态资源
    if (res.status === 404) {
      return env.ASSETS.fetch(request)
    }
    return res
  },
}
