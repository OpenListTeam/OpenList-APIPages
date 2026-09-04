<div align="center">

# OpenList API Token Generator

## 项目说明

用于OpenList获取部分网盘API的接口和页面
用于 OpenList 获取部分网盘 API 的接口和页面

部署地址：[OpenList Token 获取工具 - 全球站点](https://api.oplist.org/)
部署地址：[OpenList Token 获取工具 - 中国大陆](https://api.oplist.org.cn/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![Latest Release](https://img.shields.io/github/v/release/OpenListTeam/OpenList-APIPages?style=flat-square&label=Latest%20Release)](https://github.com/OpenListTeam/OpenList-APIPages/releases)
[![GitHub Stars](https://img.shields.io/github/stars/OpenListTeam/OpenList-APIPages?style=flat-square&label=Stars)](https://github.com/OpenListTeam/OpenList-APIPages/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/OpenListTeam/OpenList-APIPages?style=flat-square&label=Forks)](https://github.com/OpenListTeam/OpenList-APIPages/network/members)
[![Contributors](https://img.shields.io/github/contributors/OpenListTeam/OpenList-APIPages?style=flat-square)](https://github.com/OpenListTeam/OpenList-APIPages/graphs/contributors)
[![Platform](https://img.shields.io/badge/platform-Cloudflare%20%7C%20EdgeOne-orange.svg?style=flat-square)](#一键部署)

**部署地址：**
[![全球站点](https://img.shields.io/badge/全球站点-api.oplist.org-2ea44f?style=for-the-badge)](https://api.oplist.org/)
[![中国大陆](https://img.shields.io/badge/中国大陆-api.oplist.org.cn-1677ff?style=for-the-badge)](https://api.oplist.org.cn/)

</div>

---

## 一键部署
---

#### EdgeOne Functions 国际站
[![使用 EdgeOne Pages 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?project-name=oplist-api&repository-url=https://github.com/OpenListTeam/OpenList-APIPages&build-command=npm%20run%20build-eo&install-command=npm%20install&output-directory=public&root-directory=./&env=MAIN_URLS)
## 项目说明

部署完成后，请登录[EdgeOne Functions后台](https://console.tencentcloud.com/edgeone/pages)，修改环境变量，请参考[变量说明](#变量说明)部分
本项目为 OpenList 提供部分网盘 API 的接口与页面，支持多种主流网盘平台的 OAuth 授权与 Token 获取，可一键部署至 **EdgeOne Functions**、**Cloudflare Workers** 或 **Docker 容器**。

| 部署地址 | 链接 |
| --- | --- |
| 全球站点 | <https://api.oplist.org/> |
| 中国大陆 | <https://api.oplist.org.cn/> |

## 一键部署

点击下方按钮，即可将本项目一键部署到对应平台：

| EdgeOne Functions · 国际站 | EdgeOne Functions · 中国站 | Cloudflare Workers · 全球站 |
| :---: | :---: | :---: |
| [![使用 EdgeOne Pages 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?project-name=oplist-api&repository-url=https://github.com/OpenListTeam/OpenList-APIPages&build-command=npm%20run%20build-eo&install-command=npm%20install&output-directory=public&root-directory=./&env=MAIN_URLS) | [![使用 EdgeOne Pages 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?project-name=oplist-api&repository-url=https://github.com/OpenListTeam/OpenList-APIPages&build-command=npm%20run%20build-eo&install-command=npm%20install&output-directory=public&root-directory=./&env=MAIN_URLS) | [![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/OpenListTeam/OpenList-APIPages) |


部署完成后，请登录对应平台后台修改环境变量（参考下方[变量说明](#变量说明)）：
> - **EdgeOne**：[国际站后台](https://console.tencentcloud.com/edgeone/pages) · [中国站后台](https://console.cloud.tencent.com/edgeone/pages)
> - **Cloudflare**：[Worker 后台](https://dash.cloudflare.com/)

---

### 容器部署
#### 拉取镜像

## 容器部署

### 拉取镜像

```bash
docker pull openlistteam/openlist_api_server
```
or
```

或使用 GitHub 镜像源：

```bash
docker pull ghcr.io/openlistteam/openlist_api_server:latest
```
- 镜像支持多平台架构：`linux/amd64`、`linux/arm64`
#### 启动项目
```

> 镜像支持多平台架构：`linux/amd64`、`linux/arm64`

### 启动项目

```bash
docker run -d --name oplist-api-server \
  -p 3000:3000 \
  -e OPLIST_MAIN_URLS="api.example.com" \
  -e OPLIST_PROXY_API="gts.example.com" \
  -e OPLIST_ONEDRIVE_UID= `#optional` \
  -e OPLIST_ONEDRIVE_KEY= `#optional` \
  -e OPLIST_ALICLOUD_UID= `#optional` \
  -e OPLIST_ALICLOUD_KEY= `#optional` \
  -e OPLIST_BAIDUYUN_UID= `#optional` \
  -e OPLIST_BAIDUYUN_KEY= `#optional` \
  -e OPLIST_BAIDUYUN_EXT= `#optional` \
  -e OPLIST_CLOUD115_UID= `#optional` \
  -e OPLIST_CLOUD115_KEY= `#optional` \
  -e OPLIST_GOOGLEUI_UID= `#optional` \
  -e OPLIST_GOOGLEUI_KEY= `#optional` \
  -e OPLIST_YANDEXUI_UID= `#optional` \
  -e OPLIST_YANDEXUI_KEY= `#optional` \
  -e OPLIST_DROPBOXS_UID= `#optional` \
  -e OPLIST_DROPBOXS_KEY= `#optional` \
  -e OPLIST_QUARKPAN_UID= `#optional` \
  -e OPLIST_QUARKPAN_KEY= `#optional` \
  -e OPLIST_CLOUD123_UID= `#optional` \
  -e OPLIST_CLOUD123_KEY= `#optional` \
  -e OPLIST_CLOUD123_URL= `#optional` \
  openlistteam/openlist_api_server:latest 
  openlistteam/openlist_api_server:latest
```
- 可以替换镜像为ghcr:
  ```
  ghcr.io/openlistteam/openlist_api_server:latest
  ```
- **请务必根据下面的环境变量，修改你使用的环境变量**

> 可替换镜像为 ghcr 源：`ghcr.io/openlistteam/openlist_api_server:latest`

#### 环境变量说明
> [!IMPORTANT]
> **请务必根据下方环境变量说明，修改你实际使用的环境变量。**

| 变量名称       | 必要 | 变量类型 | 变量说明                     |
| -------------- | ---- | -------- |--------------------------|
| `OPLIST_MAIN_URLS`    | 是   | string   | 绑定主域名，示例：api.example.com |
| `OPLIST_PROXY_API`    | 否   | string   | 部署在大陆的节点需要指定代理谷歌  |
| `OPLIST_ONEDRIVE_UID` | 否   | string   | OneDrive 客户端ID           |
| `OPLIST_ONEDRIVE_KEY` | 否   | string   | OneDrive 客户端密钥           |
| `OPLIST_ALICLOUD_UID` | 否   | string   | 阿里云盘开发者AppID             |
| `OPLIST_ALICLOUD_KEY` | 否   | string   | 阿里云盘开发者AppKey            |
| `OPLIST_BAIDUYUN_UID` | 否   | string   | 百度网盘应用UID                |
| `OPLIST_BAIDUYUN_KEY` | 否   | string   | 百度网盘应用密钥AppKey           |
| `OPLIST_BAIDUYUN_EXT` | 否   | string   | 百度网盘应用SecretKey          |
| `OPLIST_CLOUD115_UID` | 否   | string   | 115网盘应用ID                |
| `OPLIST_CLOUD115_KEY` | 否   | string   | 115网盘应用密钥                |
| `OPLIST_GOOGLEUI_UID` | 否   | string   | 谷歌客户端ID                  |
| `OPLIST_GOOGLEUI_KEY` | 否   | string   | 谷歌客户端秘钥              |
| `OPLIST_YANDEXUI_UID` | 否   | string   | Yandex应用ID               |
| `OPLIST_YANDEXUI_KEY` | 否   | string   | Yandex应用密钥               |
| `OPLIST_DROPBOXS_UID` | 否   | string   | Dropboxx应用ID             |
| `OPLIST_DROPBOXS_KEY` | 否   | string   | Dropbox应用密钥              |
| `OPLIST_QUARKPAN_UID` | 否   | string   | 夸克云盘x应用ID                |
| `OPLIST_QUARKPAN_KEY` | 否   | string   | 夸克云盘应用密钥                 |
| `OPLIST_CLOUD123_UID` | 否   | string   | 123云盘客户端ID               |
| `OPLIST_CLOUD123_KEY` | 否   | string   | 123云盘客户端密钥              |
| `OPLIST_CLOUD123_URL` | 否   | string   | 123云盘API地址               |
### 环境变量说明

| 变量名称 | 必要 | 类型 | 说明 |
| --- | :---: | :---: | --- |
| `OPLIST_MAIN_URLS` | 是 | string | 绑定主域名，示例：`api.example.com` |
| `OPLIST_PROXY_API` | 否 | string | 部署在大陆的节点需要指定代理谷歌 |
| `OPLIST_ONEDRIVE_UID` | 否 | string | OneDrive 客户端 ID |
| `OPLIST_ONEDRIVE_KEY` | 否 | string | OneDrive 客户端密钥 |
| `OPLIST_ALICLOUD_UID` | 否 | string | 阿里云盘开发者 AppID |
| `OPLIST_ALICLOUD_KEY` | 否 | string | 阿里云盘开发者 AppKey |
| `OPLIST_BAIDUYUN_UID` | 否 | string | 百度网盘应用 UID |
| `OPLIST_BAIDUYUN_KEY` | 否 | string | 百度网盘应用密钥 AppKey |
| `OPLIST_BAIDUYUN_EXT` | 否 | string | 百度网盘应用 SecretKey |
| `OPLIST_CLOUD115_UID` | 否 | string | 115 网盘应用 ID |
| `OPLIST_CLOUD115_KEY` | 否 | string | 115 网盘应用密钥 |
| `OPLIST_GOOGLEUI_UID` | 否 | string | 谷歌客户端 ID |
| `OPLIST_GOOGLEUI_KEY` | 否 | string | 谷歌客户端秘钥 |
| `OPLIST_YANDEXUI_UID` | 否 | string | Yandex 应用 ID |
| `OPLIST_YANDEXUI_KEY` | 否 | string | Yandex 应用密钥 |
| `OPLIST_DROPBOXS_UID` | 否 | string | Dropbox 应用 ID |
| `OPLIST_DROPBOXS_KEY` | 否 | string | Dropbox 应用密钥 |
| `OPLIST_QUARKPAN_UID` | 否 | string | 夸克云盘应用 ID |
| `OPLIST_QUARKPAN_KEY` | 否 | string | 夸克云盘应用密钥 |
| `OPLIST_CLOUD123_UID` | 否 | string | 123 云盘客户端 ID |
| `OPLIST_CLOUD123_KEY` | 否 | string | 123 云盘客户端密钥 |
| `OPLIST_CLOUD123_URL` | 否 | string | 123 云盘 API 地址 |

---

### 边缘部署
## 边缘部署

#### 克隆代码
### 克隆代码

```shell
git clone https://github.com/OpenListTeam/OpenList-APIPages.git
```

#### 修改配置 (CloudFlare才需要)
### 修改配置（仅 Cloudflare 需要）

创建并修改`wrangler.jsonc`
创建并修改 `wrangler.jsonc`：

```shell
cp wrangler.example.jsonc wrangler.encrypt.jsonc
```

修改变量信息：
- MAIN_URLS：部署回调地址的域名
- 其他参数?：各个网盘的应用信息
```

- `MAIN_URLS`：部署回调地址的域名
- 其他参数：各个网盘的应用信息

```jsonc
{
  "vars": {
    "MAIN_URLS": "api.example.com",
    "PROXY_API": "gts.example.com",
    "onedrive_uid": "*****************************",
    "onedrive_key": "*****************************",
    "alicloud_uid": "*****************************",
    "alicloud_key": "*****************************",
    "baiduyun_uid": "*****************************",
    "baiduyun_key": "*****************************",
    "baiduyun_ext": "*****************************",
    "cloud115_uid": "*****************************",
    "cloud115_key": "*****************************",
    "googleui_uid": "*****************************",
    "googleui_key": "*****************************",
    "yandexui_uid": "*****************************",
    "yandexui_key": "*****************************",
    "dropboxs_uid": "*****************************",
    "dropboxs_key": "*****************************",
    "quarkpan_uid": "*****************************",
    "quarkpan_key": "*****************************",
    "cloud123_uid": "*****************************",
    "cloud123_key": "*****************************",
    "cloud123_url": "*****************************"
  },
  }
}
```

### 变量说明
---

| 变量名称       | 必要 | 变量类型 | 变量说明              |
| -------------- | ---- | -------- |-------------------|
| `MAIN_URLS`    | 是   | string   | 绑定主域名，示例：api.example.com |
| `PROXY_API`    | 否   | string   | 部署在大陆的节点需要指定代理谷歌  |
| `onedrive_uid` | 否   | string   | OneDrive 客户端ID           |
| `onedrive_key` | 否   | string   | OneDrive 客户端密钥           |
| `alicloud_uid` | 否   | string   | 阿里云盘开发者AppID             |
| `alicloud_key` | 否   | string   | 阿里云盘开发者AppKey            |
| `baiduyun_uid` | 否   | string   | 百度网盘应用ID                |
| `baiduyun_key` | 否   | string   | 百度网盘应用密钥AppKey        |
| `baiduyun_ext` | 否   | string   | 百度网盘应用密钥SecretKey        |
| `cloud115_uid` | 否   | string   | 115网盘应用ID                |
| `cloud115_key` | 否   | string   | 115网盘应用密钥                |
| `googleui_uid` | 否   | string   | 谷歌客户端ID                  |
| `googleui_key` | 否   | string   | 谷歌客户端秘钥              |
| `yandexui_uid` | 否   | string   | Yandex应用ID               |
| `yandexui_key` | 否   | string   | Yandex应用密钥               |
| `dropboxs_uid` | 否   | string   | Dropboxx应用ID             |
| `dropboxs_key` | 否   | string   | Dropbox应用密钥              |
| `quarkpan_uid` | 否   | string   | 夸克云盘x应用ID                |
| `quarkpan_key` | 否   | string   | 夸克云盘应用密钥                 |
| `cloud123_uid` | 否   | string   | 123云盘客户端ID               |
| `cloud123_key` | 否   | string   | 123云盘客户端密钥              |
| `cloud123_url` | 否   | string   | 123云盘API地址               |
## 变量说明

| 变量名称 | 必要 | 类型 | 说明 |
| --- | :---: | :---: | --- |
| `MAIN_URLS` | 是 | string | 绑定主域名，示例：`api.example.com` |
| `PROXY_API` | 否 | string | 部署在大陆的节点需要指定代理谷歌 |
| `onedrive_uid` | 否 | string | OneDrive 客户端 ID |
| `onedrive_key` | 否 | string | OneDrive 客户端密钥 |
| `alicloud_uid` | 否 | string | 阿里云盘开发者 AppID |
| `alicloud_key` | 否 | string | 阿里云盘开发者 AppKey |
| `baiduyun_uid` | 否 | string | 百度网盘应用 ID |
| `baiduyun_key` | 否 | string | 百度网盘应用密钥 AppKey |
| `baiduyun_ext` | 否 | string | 百度网盘应用密钥 SecretKey |
| `cloud115_uid` | 否 | string | 115 网盘应用 ID |
| `cloud115_key` | 否 | string | 115 网盘应用密钥 |
| `googleui_uid` | 否 | string | 谷歌客户端 ID |
| `googleui_key` | 否 | string | 谷歌客户端秘钥 |
| `yandexui_uid` | 否 | string | Yandex 应用 ID |
| `yandexui_key` | 否 | string | Yandex 应用密钥 |
| `dropboxs_uid` | 否 | string | Dropbox 应用 ID |
| `dropboxs_key` | 否 | string | Dropbox 应用密钥 |
| `quarkpan_uid` | 否 | string | 夸克云盘应用 ID |
| `quarkpan_key` | 否 | string | 夸克云盘应用密钥 |
| `cloud123_uid` | 否 | string | 123 云盘客户端 ID |
| `cloud123_key` | 否 | string | 123 云盘客户端密钥 |
| `cloud123_url` | 否 | string | 123 云盘 API 地址 |

---

#### 测试代码
## 测试与部署

### 测试代码

```shell
npm install

# 以Cloudflare Worker环境运行 
# 以 Cloudflare Worker 环境运行
npm run dev-cf

# 以Edgeone Functions环境运行 
# 以 EdgeOne Functions 环境运行
npm run dev-eo

# 以Node Service Work环境运行 
# 以 Node Service Worker 环境运行
npm run dev-js

```

#### 部署项目
### 部署项目

```shell
# 以Cloudflare Worker环境部署
# 以 Cloudflare Worker 环境部署
npm run deploy-cf

# 以Edgeone Functions环境部署 
npm run deploy-eo 
# 以 EdgeOne Functions 环境部署
npm run deploy-eo

# 以Node Service Work本地运行
npm build-js && npm deploy-js
# 以 Node Service Worker 本地运行
npm run build-js && npm run deploy-js
```

---

## 前端（React + Ant Design）

前端已重构为基于 **React 18 + TypeScript + Vite + Ant Design 5** 的单页应用，源码位于 `frontend/` 目录，构建产物输出到部署目录 `public/`。

特性：
- 多语言国际化（i18n）：默认跟随浏览器语言，支持简体中文 / 英文 / 繁体中文 / 日语 / 韩语
- 暗黑 / 白天主题：默认跟随浏览器主题，支持手动切换并记忆
- 现代化科技感 UI：玻璃拟态卡片、渐变网格背景、流畅动效
### 特性

- **多语言国际化（i18n）**：默认跟随浏览器语言，支持简体中文 / 英文 / 繁体中文 / 日语 / 韩语
- **暗黑 / 白天主题**：默认跟随浏览器主题，支持手动切换并记忆
- **现代化科技感 UI**：玻璃拟态卡片、渐变网格背景、流畅动效

### 本地开发

```shell
# 1. 安装前端依赖并启动开发服务器（默认 5173 端口，已配置 API 代理到 3000）
npm run dev-web

# 2. 另开终端启动后端（Node 环境）
npm run dev-js
```

### 构建前端

```shell
# 构建产物直接输出到 public/ 目录
npm run build-web
```

> 说明：前端构建产物输出到 `public/` 目录，该目录已加入 `.gitignore`，无需提交到仓库。所有部署方式都会在部署时自动构建前端：
> [!NOTE]
> 前端构建产物输出到 `public/` 目录，该目录已加入 `.gitignore`，无需提交到仓库。所有部署方式都会在部署时自动构建前端：
> - **EdgeOne**：`npm run build-eo` 已内置 `build-web` 构建步骤。
> - **Cloudflare Worker**：`wrangler.jsonc` 配置了 `build.command = "npm run build-web"`，`wrangler deploy` 前会自动构建。
> - **Docker**：`Dockerfile` / `Dockerfile-Lite` 在镜像构建阶段执行 `npm run build-web` 生成静态资源。

---

## 接口文档

### 登录接口

- #### 接口地址
#### 接口地址

#### 全球地址：`https://api.oplist.org/<driver>/requests`
| 站点 | 地址 |
| --- | --- |
| 全球地址 | `https://api.oplist.org/<driver>/requests` |
| 国内地址 | `https://api-cn.oplist.org/<driver>/requests` |

#### 国内地址：`https://api-cn.oplist.org/<driver>/requests`

- #### 接口参数
#### 接口参数

| 参数名称         | 类型  | 必要 | 示例                             | 说明                               |
|--------------| ----- | ---- | -------------------------------- | ---------------------------------- |
| `driver`     | `str` | 是   | onedrive                         | 平台驱动名称，详见"配置设置"部分   |
| `server_use` | `str` | 是   | true                             | 如果为真，则无需提供AppID和Key     |
| `client_uid` | `str` | 是   | 4308adf60f3fe4058533             | 提供客户端ID，详见"配置设置"部分   |
| `client_key` | `str` | 是   | 09F260A4BF5EF7F4181E35E59759C0BC | 提供应用密码，详见"配置设置"部分   |
| `driver_txt` | `str` | 是   | onedrive_go                      | 驱动类型，格式 `driver`+`类型后缀` |
| `server_set` | `str` | 是   | true                             | 是否使用服务器预设的应用ID和密钥   |
| `secret_key` | `str` | 否   | 3yp8NOMsRulxll44f5ayrxF1vgBfPW85 | 百度网盘额外需要 secret_key字段    |
| 参数名称 | 类型 | 必要 | 示例 | 说明 |
| --- | --- | :---: | --- | --- |
| `driver` | `str` | 是 | `onedrive` | 平台驱动名称，详见[配置设置](#配置设置) |
| `server_use` | `str` | 是 | `true` | 如果为真，则无需提供 AppID 和 Key |
| `client_uid` | `str` | 是 | `4308adf60f3fe4058533` | 提供客户端 ID，详见[配置设置](#配置设置) |
| `client_key` | `str` | 是 | `09F260A4BF5EF7F4181E35E59759C0BC` | 提供应用密码，详见[配置设置](#配置设置) |
| `driver_txt` | `str` | 是 | `onedrive_go` | 驱动类型，格式 `driver` + `类型后缀` |
| `server_set` | `str` | 是 | `true` | 是否使用服务器预设的应用 ID 和密钥 |
| `secret_key` | `str` | 否 | `3yp8NOMsRulxll44f5ayrxF1vgBfPW85` | 百度网盘额外需要 secret_key 字段 |

- #### 返回内容
#### 返回内容

如果执行无误，回返回url
如果执行无误，会返回 url。

| 参数名称 | 类型  | 必要 | 示例                                         | 说明               |
| -------- | ----- | ---- | -------------------------------------------- | ------------------ |
| `text`   | `str` | 否   | https://example.com/oauth2/login/?xxx=xxxxxx | 返回登录链接到前端 |
| 参数名称 | 类型 | 必要 | 示例 | 说明 |
| --- | --- | :---: | --- | --- |
| `text` | `str` | 否 | `https://example.com/oauth2/login/?xxx=xxxxxx` | 返回登录链接到前端 |

---

### 回调接口

- #### 接口地址
#### 接口地址

#### `https://api.oplist.org/<driver>/callback`
```text
https://api.oplist.org/<driver>/callback
```

- #### 接口参数
#### 接口参数

| 参数名称     | 类型  | 必要 | 示例                             | 说明                             |
| ------------ | ----- | ---- | -------------------------------- | -------------------------------- |
| `driver`     | `str` | 是   | onedrive                         | 平台驱动名称，详见"配置设置"部分 |
| `code`       | `str` | 是   | 40YJzShAJSodbIXvNEw3Ru9N4Lkznx93 | 回调的认证代码，登录之后URL自带  |
| `server_use` | `str` | 是   | true                             | 如果为真，则无需提供AppID和Key   |
| `client_uid` | `str` | 否   | 4308adf60f3fe4058533             | 提供云盘验证码登录提供client_uid |
| `client_key` | `str` | 否   | 09F260A4BF5EF7F4181E35E59759C0BC | 提供云盘验证码登录提供client_key |
| `grant_type` | `str` | 否   | authorization_code               | 提供云盘，固定authorization_code |
| 参数名称 | 类型 | 必要 | 示例 | 说明 |
| --- | --- | :---: | --- | --- |
| `driver` | `str` | 是 | `onedrive` | 平台驱动名称，详见[配置设置](#配置设置) |
| `code` | `str` | 是 | `40YJzShAJSodbIXvNEw3Ru9N4Lkznx93` | 回调的认证代码，登录之后 URL 自带 |
| `server_use` | `str` | 是 | `true` | 如果为真，则无需提供 AppID 和 Key |
| `client_uid` | `str` | 否 | `4308adf60f3fe4058533` | 提供云盘验证码登录提供 client_uid |
| `client_key` | `str` | 否 | `09F260A4BF5EF7F4181E35E59759C0BC` | 提供云盘验证码登录提供 client_key |
| `grant_type` | `str` | 否 | `authorization_code` | 提供云盘，固定 authorization_code |

- #### 返回内容
#### 返回内容

如果执行无误，会返回经Base64编码的JSON数据。
如果执行无误，会返回经 Base64 编码的 JSON 数据。

| 参数名称          | 类型  | 必要 | 示例                             | 说明                         |
| ----------------- | ----- | ---- |----------------------------------| ---------------------------- |
| `<url 302重定向>` | `302` | 否   | `/#eyJhY2Nlc3Nf......`           | 返回编码的数据到前端         |
| `access_token`    | `str` | 否   | VqKbrWpetI3HnvyvsWquv9BJFL3j4xjc | 返回访问令牌到前端           |
| `refresh_token`   | `str` | 否   | oMMPXrCCrRwMoqVD321Z03PSoxmsAKjI | 返回刷新令牌到前端           |
| `server_use`      | `str` | 否   | true                             | 是否使用 OpenList 提供的参数 |
| `client_uid`      | `str` | 否   | b2eaau943b1bx464                 | 用户传入的客户端ID           |
| `client_key`      | `str` | 否   | SHcAplYIY679BEVF9FveGKtLuSI6MikU | 用户传入的应用密钥           |
| `driver_txt`      | `str` | 否   | onedrive                         | 用户传入的驱动类型           |
| `message_err`     | `str` | 否   | Connection reset by peer         | 服务端错误信息               |
| 参数名称 | 类型 | 必要 | 示例 | 说明 |
| --- | --- | :---: | --- | --- |
| `<url 302重定向>` | `302` | 否 | `/#eyJhY2Nlc3Nf......` | 返回编码的数据到前端 |
| `access_token` | `str` | 否 | `VqKbrWpetI3HnvyvsWquv9BJFL3j4xjc` | 返回访问令牌到前端 |
| `refresh_token` | `str` | 否 | `oMMPXrCCrRwMoqVD321Z03PSoxmsAKjI` | 返回刷新令牌到前端 |
| `server_use` | `str` | 否 | `true` | 是否使用 OpenList 提供的参数 |
| `client_uid` | `str` | 否 | `b2eaau943b1bx464` | 用户传入的客户端 ID |
| `client_key` | `str` | 否 | `SHcAplYIY679BEVF9FveGKtLuSI6MikU` | 用户传入的应用密钥 |
| `driver_txt` | `str` | 否 | `onedrive` | 用户传入的驱动类型 |
| `message_err` | `str` | 否 | `Connection reset by peer` | 服务端错误信息 |

---

### 刷新令牌

- #### 接口地址
#### 接口地址

#### `https://api.oplist.org/<driver>/renewapi`
```text
https://api.oplist.org/<driver>/renewapi
```

- #### 接口参数
#### 接口参数

| 参数名称     | 类型  | 必要 | 示例                             | 说明                             |
| ------------ | ----- | ---- | -------------------------------- | -------------------------------- |
| `apps_types` | `str` | 是   | onedrive_go                      | 平台网盘类型，详见"配置设置"部分 |
| `refresh_ui` | `str` | 是   | 40YJzShAJSodbIXvNEw3Ru9N4Lkznx93 | 刷新需要token，登录之后URL自带   |
| `server_use` | `str` | 是   | true                             | 如果为真，则无需提供AppID和Key   |
| `client_uid` | `str` | 否   | 4308adf60f3fe4058533             | 提供云盘验证码登录提供client_uid |
| `client_key` | `str` | 否   | 09F260A4BF5EF7F4181E35E59759C0BC | 提供云盘验证码登录提供client_key |
| `secret_key` | `str` | 否   | 09F260A4BF5EF7F4181E35E59759C0BC | 百度网盘额外需要 secret_key字段  |
| 参数名称 | 类型 | 必要 | 示例 | 说明 |
| --- | --- | :---: | --- | --- |
| `apps_types` | `str` | 是 | `onedrive_go` | 平台网盘类型，详见[配置设置](#配置设置) |
| `refresh_ui` | `str` | 是 | `40YJzShAJSodbIXvNEw3Ru9N4Lkznx93` | 刷新需要 token，登录之后 URL 自带 |
| `server_use` | `str` | 是 | `true` | 如果为真，则无需提供 AppID 和 Key |
| `client_uid` | `str` | 否 | `4308adf60f3fe4058533` | 提供云盘验证码登录提供 client_uid |
| `client_key` | `str` | 否 | `09F260A4BF5EF7F4181E35E59759C0BC` | 提供云盘验证码登录提供 client_key |
| `secret_key` | `str` | 否 | `09F260A4BF5EF7F4181E35E59759C0BC` | 百度网盘额外需要 secret_key 字段 |

- #### 返回内容
#### 返回内容

如果执行无误，会返回url。
如果执行无误，会返回 url。

| 参数名称        | 类型  | 必要 | 示例            | 说明               |
| --------------- | ----- | ---- | --------------- | ------------------ |
| `refresh_token` | `str` | 是   | xxxxxxxxxxxxxxx | 返回刷新令牌到前端 |
| `access_token`  | `str` | 是   | xxxxxxxxxxxxxxx | 返回访问令牌到前端 |
| 参数名称 | 类型 | 必要 | 示例 | 说明 |
| --- | --- | :---: | --- | --- |
| `refresh_token` | `str` | 是 | `xxxxxxxxxxxxxxx` | 返回刷新令牌到前端 |
| `access_token` | `str` | 是 | `xxxxxxxxxxxxxxx` | 返回访问令牌到前端 |

---

## 配置设置

| 网盘驱动     | 区域类型   | driver   | apps_types  | client_uid | client_key    | secret_key |
|----------|--------| -------- |-------------|------------|---------------|------------|
| Onedrive | 个人版本   | onedrive | onedrive_pr | 客户端ID      | 客户端秘钥         | /          |
| Onedrive | 企业版本   | onedrive | onedrive_go | 客户端ID      | 客户端秘钥         | /          |
| Onedrive | 世纪互联   | onedrive | onedrive_cn | 客户端ID      | 客户端秘钥         | /          |
| Onedrive | 美国版本   | onedrive | onedrive_us | 客户端ID      | 客户端秘钥         | /          |
| Onedrive | 德国版本   | onedrive | onedrive_de | 客户端ID      | 客户端秘钥         | /          |
| 阿里云盘     | 跳转登录   | alicloud | alicloud_go | APP ID     | App Secret    | /          |
| 阿里云盘     | 扫码登录   | alicloud | alicloud_qr | APP ID     | App Secret    | /          |
| 阿里云盘     | 直接登录   | alicloud | alicloud_cs | /          | /             | /          |
| 百度云盘     | 验证登录   | baiduyun | baiduyun_go | AppID      | AppKey        | SecretKey  |
| 百度云盘     | OOB 登录 | baiduyun | baiduyun_go | /          | /             | /          |
| 夸克云盘     | 验证登录   | quarkyun | quarkyun_fn | AppID      | SignKey       | /          |
| 115 云盘   | 验证登录   | 115cloud | 115cloud_go | AppID      | AppSecret     | /          |
| 123 云盘   | 验证登录   | 123cloud | 123cloud_go | client_id  | client_secret | /          |
| 谷歌云盘     | 验证登录   | googleui | googleui_go | 客户端ID      | 客户端秘钥         | /          |
| Yandex   | 验证登录   | yandexui | yandexui_go | AppID      | AppKey        | /          |
| Dropbox  | 验证登录   | dropboxs | dropboxs_go | AppID      | AppKey        | /          |
| 网盘驱动 | 区域类型 | driver | apps_types | client_uid | client_key | secret_key |
| --- | --- | --- | --- | --- | --- | --- |
| Onedrive | 个人版本 | `onedrive` | `onedrive_pr` | 客户端 ID | 客户端秘钥 | / |
| Onedrive | 企业版本 | `onedrive` | `onedrive_go` | 客户端 ID | 客户端秘钥 | / |
| Onedrive | 世纪互联 | `onedrive` | `onedrive_cn` | 客户端 ID | 客户端秘钥 | / |
| Onedrive | 美国版本 | `onedrive` | `onedrive_us` | 客户端 ID | 客户端秘钥 | / |
| Onedrive | 德国版本 | `onedrive` | `onedrive_de` | 客户端 ID | 客户端秘钥 | / |
| 阿里云盘 | 跳转登录 | `alicloud` | `alicloud_go` | APP ID | App Secret | / |
| 阿里云盘 | 扫码登录 | `alicloud` | `alicloud_qr` | APP ID | App Secret | / |
| 阿里云盘 | 直接登录 | `alicloud` | `alicloud_cs` | / | / | / |
| 百度云盘 | 验证登录 | `baiduyun` | `baiduyun_go` | AppID | AppKey | SecretKey |
| 百度云盘 | OOB 登录 | `baiduyun` | `baiduyun_go` | / | / | / |
| 夸克云盘 | 验证登录 | `quarkyun` | `quarkyun_fn` | AppID | SignKey | / |
| 115 云盘 | 验证登录 | `115cloud` | `115cloud_go` | AppID | AppSecret | / |
| 123 云盘 | 验证登录 | `123cloud` | `123cloud_go` | client_id | client_secret | / |
| 谷歌云盘 | 验证登录 | `googleui` | `googleui_go` | 客户端 ID | 客户端秘钥 | / |
| Yandex | 验证登录 | `yandexui` | `yandexui_go` | AppID | AppKey | / |
| Dropbox | 验证登录 | `dropboxs` | `dropboxs_go` | AppID | AppKey | / |

---

## 项目赞助
本项目的中国站点边缘函数、CDN加速及安全防护由[Tencent EdgeOne](https://edgeone.ai/zh?from=github)赞助
<img src="https://edgeone.ai/media/34fe3a45-492d-4ea4-ae5d-ea1087ca7b4b.png" style="width: 500px" />

本项目的中国站点边缘函数、CDN 加速及安全防护由 [Tencent EdgeOne](https://edgeone.ai/zh?from=github) 赞助。

<p align="center">
  <img src="https://edgeone.ai/media/34fe3a45-492d-4ea4-ae5d-ea1087ca7b4b.png" width="500" alt="Tencent EdgeOne" />
</p>

---

<div align="center">

**[OpenList](https://github.com/OpenListTeam) · 让网盘接入更简单**

</div>

