# Token 授权前端

> **上级索引 / 被引用自**：[项目说明](../README.md#前端react--ant-design)

本目录是 React、TypeScript、Vite 和 Ant Design 实现的 Token 授权界面。

| 文件或目录 | 用途 |
| --- | --- |
| [src/](src/README.md) | 页面、组件、接口调用、主题和多语言源码 |
| `public/` | 字体等直接复制的静态资源，不存放构建结果 |
| `package.json`、`package-lock.json` | 前端命令及锁定的依赖 |
| `index.html`、`vite.config.ts`、`tsconfig.json` | HTML 入口、开发代理、构建与类型检查配置 |
| `verify.mjs`、`verify-final.mjs` | 既有 Puppeteer 手工验证脚本，需要额外的浏览器与依赖 |

在本目录运行：

```sh
npm ci
npm run typecheck
npm run dev
npm run build
```

开发端口为 `5177`，网盘 API 代理到本机 `3000` 端口。构建默认输出到仓库根的 `public/`，不会输出到本目录的 `public/`。部署方式见[项目说明](../README.md#测试与部署)。
