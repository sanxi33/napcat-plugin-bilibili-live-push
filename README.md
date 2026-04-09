# napcat-plugin-bilibili-live-push

一个 NapCat 原生插件，用来轮询 Bilibili 直播间状态，并在主播开播时推送通知到指定 QQ 群。

## 功能

- 轮询多个 Bilibili 直播间
- 在“未开播 -> 开播”状态切换时自动推送
- 支持给不同直播间配置不同推送群
- 支持管理员命令开启、关闭和立即检查
- 自动记录直播间状态，避免重复推送

## 配置

```json
{
  "enabled": true,
  "pollSeconds": 60,
  "requestTimeoutMs": 12000,
  "commandPrefix": "球鳖",
  "adminQqList": "123456789,987654321",
  "roomsJson": "[{\"roomId\":\"394988\",\"groupIds\":[\"12345678\"],\"name\":\"主播A\"}]",
  "statePath": "data/bilibili-live-push-state.json"
}
```

- `enabled`：是否启用插件
- `pollSeconds`：轮询间隔，范围 `15-300`
- `requestTimeoutMs`：请求超时，范围 `3000-60000`
- `commandPrefix`：命令前缀，留空后可直接触发命令
- `adminQqList`：管理员 QQ，逗号分隔
- `roomsJson`：直播间配置 JSON 字符串
- `statePath`：状态文件路径，通常保持默认即可

`roomsJson` 示例：

```json
[
  {
    "roomId": "394988",
    "groupIds": ["12345678", "87654321"],
    "name": "某主播"
  }
]
```

## 命令

- `球鳖 B站推送状态`
- `球鳖 开启B站推送`
- `球鳖 关闭B站推送`
- `球鳖 立即检查B站直播`

如果把前缀留空，也可以直接发送命令本体。

## 安装

1. 下载当前仓库 [Releases](https://github.com/sanxi33/napcat-plugin-bilibili-live-push/releases) 中的 `napcat-plugin-bilibili-live-push.zip`
2. 在 NapCat 插件管理中导入压缩包
3. 启用插件并填写 `roomsJson` 和管理员配置

## 发布产物

这个插件没有额外构建步骤，发布包只需要：

- `index.mjs`
- `package.json`

## 已知限制

- 依赖 Bilibili 直播公开接口，如果上游接口结构变化，插件需要更新
- 当前是轮询方案，不是 WebHook 推送，通知时效取决于 `pollSeconds`
- 首次启用时会立即检查一次直播间状态

## License

MIT
