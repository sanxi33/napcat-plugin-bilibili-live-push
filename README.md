# napcat-plugin-bilibili-live-push

一个为 NapCat 设计的 Bilibili 开播提醒插件。配置好直播间号和群号后，插件会定时检查直播状态，并在主播开播时把提醒发到指定 QQ 群。

## 适用场景

- 需要在 QQ 群里接收 B 站开播提醒
- 同时监控多个直播间
- 不同直播间需要推送到不同群

## 环境要求

- 已部署 NapCat，并了解如何导入插件包 (`.zip`)
- 已知要监控的直播间号
- 已知要接收提醒的 QQ 群号
- 需要至少一个管理员 QQ 用于控制开关命令

## 安装步骤

### 1. 下载插件

前往 [Releases](https://github.com/sanxi33/napcat-plugin-bilibili-live-push/releases) 页面，下载最新版本的 `napcat-plugin-bilibili-live-push.zip`。

### 2. 导入 NapCat

在 NapCat 的插件管理界面中导入 zip 文件，并启用插件。

### 3. 最小化配置示例

首次使用时，建议先填这几个字段：

- `roomsJson`
- `adminQqList`
- `commandPrefix`

```json
{
  "enabled": true,
  "pollSeconds": 60,
  "requestTimeoutMs": 12000,
  "commandPrefix": "/",
  "adminQqList": "123456789,987654321",
  "roomsJson": "[{\"roomId\":\"394988\",\"groupIds\":[\"12345678\"],\"name\":\"某主播\"}]",
  "statePath": "data/bilibili-live-push-state.json"
}
```

`roomsJson` 里的单条配置示例：

```json
[
  {
    "roomId": "394988",
    "groupIds": ["12345678"],
    "name": "某主播"
  }
]
```

## 使用方法

以下示例默认命令前缀为 `/`：

```
/B站推送状态
/开启B站推送
/关闭B站推送
/立即检查B站直播
```

如果你把 `commandPrefix` 设为空，则可以直接输入命令本体。

## 验证安装

建议按以下顺序测试：

1. 发送 `/B站推送状态`
2. 再发送 `/立即检查B站直播`
3. 若插件正常返回状态信息且无报错，说明核心配置已生效

## 快捷安装链接

NapCat 版本 ≥ `4.15.19` 时，可点击下方按钮快速跳转至插件安装页面：

<a href="https://napneko.github.io/napcat-plugin-index?pluginId=napcat-plugin-bilibili-live-push" target="_blank">
  <img src="https://github.com/NapNeko/napcat-plugin-index/blob/pages/button.png?raw=true" alt="在 NapCat WebUI 中打开" width="170">
</a>

## 已知限制

- 插件采用轮询方式检查直播状态，提醒速度取决于 `pollSeconds`
- 依赖 Bilibili 公开接口，上游接口变化时可能需要更新插件
- 首次启用后会立即检查一次直播状态

## License

MIT
