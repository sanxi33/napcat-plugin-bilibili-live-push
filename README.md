# napcat-plugin-bilibili-live-push

B 站开播自动推送到 QQ 群。配置好直播间和群号，插件定时检查直播状态，主播开播就在群里发提醒。

## 配置

首次使用先填这三个字段：`roomsJson`、`adminQqList`、`commandPrefix`。

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

`roomsJson` 里每条配置的结构：

```json
[
  {
    "roomId": "394988",
    "groupIds": ["12345678"],
    "name": "某主播"
  }
]
```

可以同时监控多个直播间，各自推送到不同的群。

## 命令

以下示例默认命令前缀为 `/`：

```
/B站推送状态
/开启B站推送
/关闭B站推送
/立即检查B站直播
```

如果把 `commandPrefix` 设为空，可以直接输命令本体。

## 安装

去 [Releases](https://github.com/sanxi33/napcat-plugin-bilibili-live-push/releases) 下载 `napcat-plugin-bilibili-live-push.zip`，NapCat 插件管理导入启用。

NapCat 版本 ≥ 4.15.19 可以用这个快捷按钮：

<a href="https://napneko.github.io/napcat-plugin-index?pluginId=napcat-plugin-bilibili-live-push" target="_blank">
  <img src="https://github.com/NapNeko/napcat-plugin-index/blob/pages/button.png?raw=true" alt="在 NapCat WebUI 中打开" width="170">
</a>

## 注意事项

插件用轮询方式检查直播状态，提醒速度取决于 `pollSeconds`。依赖 B 站公开接口，上游变化时需要更新。首次启用后会立即检查一次。

## License

MIT
