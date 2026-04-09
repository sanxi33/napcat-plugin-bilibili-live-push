# Bilibili Live Push Open Source Checklist

## 1. 代码与数据边界

- 只复制插件源码，不复制运行目录
- 不提交 `config/`、`data/`、`logs/`、状态文件
- 不提交真实直播间列表、真实群号、真实管理员 QQ

## 2. 包结构

- `package.json.name` 必须是 `napcat-plugin-bilibili-live-push`
- 发布包只包含 `index.mjs` 和 `package.json`
- `napcat.homepage` 指向公开 GitHub 仓库

## 3. 配置

- 提供 `config.example.json`
- `roomsJson` 使用演示房间号和演示群号
- `adminQqList` 使用示例值，不使用真实 QQ

## 4. 文档

- README 说明命令、配置、安装方式
- README 解释轮询机制和已知限制

## 5. GitHub 发布

- 创建独立仓库
- 配置 `INDEX_PAT`
- 推送 tag 触发 Release
- 确认官方索引 PR 已创建
