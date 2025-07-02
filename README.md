# OpenList API Token Generator

## 项目说明

用于OpenList获取部分网盘API的接口和页面

部署地址：[OpenList Token 获取工具](https://api.oplist.org/)

## 部署方法

### 一键部署

#### EdgeOne Functions
[![使用 EdgeOne Pages 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?repository-url=https://github.com/OpenListTeam/OpenList-APIPages)

部署完成后，请登录EdgeOne Functions后台，修改环境变量，请参考[变量说明](#变量说明)部分



#### Cloudflare Worker
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/OpenListTeam/OpenList-APIPages)

部署完成后，请登录Cloudflare Worker后台，修改环境变量，请参考[变量说明](#变量说明)部分

### 手动部署

#### 克隆代码

```shell
git clone https://github.com/OpenListTeam/OpenList-APIPages.git
```

#### 修改配置

创建并修改`wrangler.jsonc`

```shell
cp wrangler.example.jsonc wrangler.jsonc
```

修改变量信息：
 - MAIN_URLS：部署回调地址的域名
 - 其他参数?：各个网盘的应用信息
```
  "vars": {
    "MAIN_URLS": "api.example.com",
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
    "quarkpan_key": "*****************************"
  },
```


### Docker部署
#### 拉取镜像
```
docker pull openlistteam/openlist_api_server
```
or
```
docker pull ghcr.io/openlistteam/openlist_api_server:latest
```
#### 启动项目
```
docker run -d --name oplist-api-server \
  -p 3000:3000 \
  -e OPLIST_MAIN_URLS="api.example.com" \
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
  openlistteam/openlist_api_server:latest 
```
- 可以替换镜像为ghcr:
  ```
  ghcr.io/openlistteam/openlist_api_server:latest
  ```
- **请务必根据下面的环境变量，修改你使用的环境变量**

#### 环境变量说明

| 变量名称       | 必要 | 变量类型 | 变量说明                          |
| -------------- | ---- | -------- | --------------------------------- |
| `OPLIST_MAIN_URLS`    | 是   | string   | 绑定主域名，示例：api.example.com |
| `OPLIST_ONEDRIVE_UID` | 否   | string   | OneDrive 客户端ID                 |
| `OPLIST_ONEDRIVE_KEY` | 否   | string   | OneDrive 客户端密钥               |
| `OPLIST_ALICLOUD_UID` | 否   | string   | 阿里云盘开发者AppID               |
| `OPLIST_ALICLOUD_KEY` | 否   | string   | 阿里云盘开发者AppKey              |
| `OPLIST_BAIDUYUN_UID` | 否   | string   | 百度网盘应用密钥AppKey            |
| `OPLIST_BAIDUYUN_KEY` | 否   | string   | 百度网盘应用密钥SecretKey         |
| `OPLIST_BAIDUYUN_EXT` | 否   | string   | 百度网盘应用ext         |
| `OPLIST_CLOUD115_UID` | 否   | string   | 115网盘应用ID                     |
| `OPLIST_CLOUD115_KEY` | 否   | string   | 115网盘应用密钥                   |
| `OPLIST_GOOGLEUI_UID` | 否   | string   | 谷歌客户端ID                      |
| `OPLIST_GOOGLEUI_KEY` | 否   | string   | 谷歌全局API Key                   |
| `OPLIST_YANDEXUI_UID` | 否   | string   | Yandex应用ID                      |
| `OPLIST_YANDEXUI_KEY` | 否   | string   | Yandex应用密钥                    |
| `OPLIST_DROPBOXS_UID` | 否   | string   | Dropboxx应用ID                    |
| `OPLIST_DROPBOXS_KEY` | 否   | string   | Dropbox应用密钥                   |
| `OPLIST_QUARKPAN_UID` | 否   | string   | 夸克云盘x应用ID                   |
| `OPLIST_QUARKPAN_KEY` | 否   | string   | 夸克云盘应用密钥                  |


### 变量说明

| 变量名称       | 必要 | 变量类型 | 变量说明                          |
| -------------- | ---- | -------- | --------------------------------- |
| `MAIN_URLS`    | 是   | string   | 绑定主域名，示例：api.example.com |
| `onedrive_uid` | 否   | string   | OneDrive 客户端ID                 |
| `onedrive_key` | 否   | string   | OneDrive 客户端密钥               |
| `alicloud_uid` | 否   | string   | 阿里云盘开发者AppID               |
| `alicloud_key` | 否   | string   | 阿里云盘开发者AppKey              |
| `baiduyun_uid` | 否   | string   | 百度网盘应用密钥AppKey            |
| `baiduyun_key` | 否   | string   | 百度网盘应用密钥SecretKey         |
| `baiduyun_ext` | 否   | string   | 百度网盘应用ext        |
| `cloud115_uid` | 否   | string   | 115网盘应用ID                     |
| `cloud115_key` | 否   | string   | 115网盘应用密钥                   |
| `googleui_uid` | 否   | string   | 谷歌客户端ID                      |
| `googleui_key` | 否   | string   | 谷歌全局API Key                   |
| `yandexui_uid` | 否   | string   | Yandex应用ID                      |
| `yandexui_key` | 否   | string   | Yandex应用密钥                    |
| `dropboxs_uid` | 否   | string   | Dropboxx应用ID                    |
| `dropboxs_key` | 否   | string   | Dropbox应用密钥                   |
| `quarkpan_uid` | 否   | string   | 夸克云盘x应用ID                   |
| `quarkpan_key` | 否   | string   | 夸克云盘应用密钥                  |



#### 测试代码

```shell
npm install

# 以Cloudflare Worker环境运行 
npm run dev-cf 

# 以Edgeone Functions环境运行 
npm run dev-eo 
```

#### 部署项目

```shell
# 以Cloudflare Worker环境部署
npm run deploy-cf

# 以Edgeone Functions环境部署 
npm run deploy-eo 
```

## 接口文档

### 登录接口

- #### 接口地址

#### 全球地址：`https://api.oplist.org/<driver>/requests`

#### 国内地址：`https://api-cn.oplist.org/<driver>/requests`

- #### 接口参数

| 参数名称         | 类型  | 必要 | 示例                             | 说明                               |
|--------------| ----- | ---- | -------------------------------- | ---------------------------------- |
| `driver`     | `str` | 是   | onedrive                         | 平台驱动名称，详见"配置设置"部分   |
| `server_use` | `str` | 是   | true                             | 如果为真，则无需提供AppID和Key     |
| `client_uid` | `str` | 是   | 4308adf60f3fe4058533             | 提供客户端ID，详见"配置设置"部分   |
| `client_key` | `str` | 是   | 09F260A4BF5EF7F4181E35E59759C0BC | 提供应用密码，详见"配置设置"部分   |
| `driver_txt` | `str` | 是   | onedrive_go                      | 驱动类型，格式 `driver`+`类型后缀` |
| `server_set` | `str` | 是   | true                             | 是否使用服务器预设的应用ID和密钥   |
| `secret_key` | `str` | 否   | 3yp8NOMsRulxll44f5ayrxF1vgBfPW85 | 百度网盘额外需要 secret_key字段    |

- #### 返回内容

如果执行无误，回返回url

| 参数名称 | 类型  | 必要 | 示例                                         | 说明               |
| -------- | ----- | ---- | -------------------------------------------- | ------------------ |
| `text`   | `str` | 否   | https://example.com/oauth2/login/?xxx=xxxxxx | 返回登录链接到前端 |

### 回调接口

- #### 接口地址

#### `https://api.oplist.org/<driver>/callback`

- #### 接口参数

| 参数名称     | 类型  | 必要 | 示例                             | 说明                             |
| ------------ | ----- | ---- | -------------------------------- | -------------------------------- |
| `driver`     | `str` | 是   | onedrive                         | 平台驱动名称，详见"配置设置"部分 |
| `code`       | `str` | 是   | 40YJzShAJSodbIXvNEw3Ru9N4Lkznx93 | 回调的认证代码，登录之后URL自带  |
| `server_use` | `str` | 是   | true                             | 如果为真，则无需提供AppID和Key   |
| `client_uid` | `str` | 否   | 4308adf60f3fe4058533             | 提供云盘验证码登录提供client_uid |
| `client_key` | `str` | 否   | 09F260A4BF5EF7F4181E35E59759C0BC | 提供云盘验证码登录提供client_key |
| `grant_type` | `str` | 否   | authorization_code               | 提供云盘，固定authorization_code |

- #### 返回内容

如果执行无误，会返回经Base64编码的JSON数据。

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

### 刷新令牌

- #### 接口地址

#### `https://api.oplist.org/<driver>/renewapi`

- #### 接口参数

| 参数名称     | 类型  | 必要 | 示例                             | 说明                             |
| ------------ | ----- | ---- | -------------------------------- | -------------------------------- |
| `apps_types` | `str` | 是   | onedrive_go                      | 平台网盘类型，详见"配置设置"部分 |
| `refresh_ui` | `str` | 是   | 40YJzShAJSodbIXvNEw3Ru9N4Lkznx93 | 刷新需要token，登录之后URL自带   |
| `server_use` | `str` | 是   | true                             | 如果为真，则无需提供AppID和Key   |
| `client_uid` | `str` | 否   | 4308adf60f3fe4058533             | 提供云盘验证码登录提供client_uid |
| `client_key` | `str` | 否   | 09F260A4BF5EF7F4181E35E59759C0BC | 提供云盘验证码登录提供client_key |
| `secret_key` | `str` | 否   | 09F260A4BF5EF7F4181E35E59759C0BC | 百度网盘额外需要 secret_key字段  |

- #### 返回内容

如果执行无误，会返回url。

| 参数名称        | 类型  | 必要 | 示例            | 说明               |
| --------------- | ----- | ---- | --------------- | ------------------ |
| `refresh_token` | `str` | 是   | xxxxxxxxxxxxxxx | 返回刷新令牌到前端 |
| `access_token`  | `str` | 是   | xxxxxxxxxxxxxxx | 返回访问令牌到前端 |

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

## 项目赞助
本项目的中国站点边缘函数、CDN加速及安全防护由[Tencent EdgeOne](https://edgeone.ai/zh?from=github)赞助
<img src="https://edgeone.ai/media/34fe3a45-492d-4ea4-ae5d-ea1087ca7b4b.png" style="width: 500px" />