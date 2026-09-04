import * as index from './index'

// 未匹配到 API 路由时，回退到静态资源（ASSETS 绑定）
index.app.notFound(async (c) => {
    return c.env.ASSETS.fetch(c.req.raw)
})


export default index.app
