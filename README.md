# napcat-plugin-bilibili-live-push

一个给 NapCat 用的 Bilibili 开播提醒插件。你填好直播间和群号后，它会定时检查直播状态，并在主播开播时把通知发到指定 QQ 群。

## 这份 README 默认把你当作

- 已经装好了 NapCat，会在 WebUI 里导入插件 zip
- 愿意在配置页里填几个字段，但不想先研究源码
- 已经知道自己要监控哪个直播间、要推到哪个群

如果你是来二开插件或研究构建流程的，这份 README 不是按开发者视角写的。

## 这个插件适合谁

适合：

- 想在 QQ 群里收 B 站开播提醒
- 想同时监控多个直播间
- 希望每个直播间可以推到不同群

不太适合：

- 想要秒级实时推送的人
- 不知道直播间号和群号的人

## 装之前要准备什么

在安装之前，先准备好这 3 件事：

1. 你要监控的 Bilibili 直播间号
2. 你要推送到的 QQ 群号
3. 可以管理这个插件的管理员 QQ 号

其中最容易卡住的是 `roomsJson`。你可以先直接照下面这个例子改：

```json
[
  {
    "roomId": "394988",
    "groupIds": ["12345678"],
    "name": "某主播"
  }
]
```

说明：

- `roomId`：Bilibili 直播间号
- `groupIds`：要接收通知的 QQ 群号列表
- `name`：备注名，可选，但建议填，方便你自己识别

## 安装

### 1. 下载插件

从 [Releases](https://github.com/sanxi33/napcat-plugin-bilibili-live-push/releases) 下载最新的：

- `napcat-plugin-bilibili-live-push.zip`

### 2. 导入 NapCat

在 NapCat 插件管理里导入这个 zip，并启用插件。

### 3. 先填最少配置

第一次建议你只先填这几个：

- `roomsJson`
- `adminQqList`
- `commandPrefix`

推荐示例：

```json
{
  "enabled": true,
  "pollSeconds": 60,
  "requestTimeoutMs": 12000,
  "commandPrefix": "球鳖",
  "adminQqList": "123456789,987654321",
  "roomsJson": "[{\"roomId\":\"394988\",\"groupIds\":[\"12345678\"],\"name\":\"某主播\"}]",
  "statePath": "data/bilibili-live-push-state.json"
}
```

其中：

- `adminQqList` 是逗号分隔的 QQ 号字符串，不是数组
- `pollSeconds` 建议先保持默认 `60`
- `statePath` 一般不用改

## 常用命令

如果命令前缀是默认的 `球鳖`，可以直接这样用：

- `球鳖 B站推送状态`
- `球鳖 开启B站推送`
- `球鳖 关闭B站推送`
- `球鳖 立即检查B站直播`

如果你把前缀留空，就直接发送命令本体。

## 第一次怎么确认自己配对了

建议按这个顺序测：

1. 先发 `球鳖 B站推送状态`，确认插件有响应
2. 再发 `球鳖 立即检查B站直播`
3. 如果没报错，说明配置格式基本正确

## 一键跳到 NapCat WebUI 安装页

如果你的 NapCat 版本是 `4.15.19` 或更高，可以直接点下面按钮跳到插件安装界面：

<a href="https://napneko.github.io/napcat-plugin-index?pluginId=napcat-plugin-bilibili-live-push" target="_blank">
  <img src="https://github.com/NapNeko/napcat-plugin-index/blob/pages/button.png?raw=true" alt="在 NapCat WebUI 中打开" width="170">
</a>

## 已知限制

- 这是轮询检查，不是 WebHook，所以提醒速度取决于 `pollSeconds`
- 插件依赖 Bilibili 公开接口，上游改动后可能需要更新
- 首次启用后会立即检查一次直播状态

## License

MIT
