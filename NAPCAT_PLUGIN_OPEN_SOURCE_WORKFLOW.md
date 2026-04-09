# NapCat Plugin Open Source Workflow

这是一份已经在实际项目中跑通的标准流程文档，用于把本地运行中的 NapCat 插件拆分为独立开源仓库，并接入 NapCat 官方索引。

## 总原则

- 不直接公开 `NapCat.Shell` 运行目录
- 在运行目录外创建独立仓库
- 只复制源码和必要资源
- 不提交真实配置、状态文件、日志、缓存
- 发布包只包含插件运行所需文件

## 标准流程

1. 评估插件是否适合先开源
2. 从现网目录只复制必要源码
3. 建立最小仓库骨架
4. 清理 token、cookie、群号、QQ、绝对路径等敏感信息
5. 规范 `package.json`
6. 写 README 和 `config.example.json`
7. 配置 `release.yml` 和 `update-index.yml`
8. 创建独立 GitHub 仓库
9. 配置 `INDEX_PAT`
10. 推送 `main` 和版本 tag
11. 检查 Release 与官方索引 PR

## 必备文件

- `index.mjs`
- `package.json`
- `README.md`
- `LICENSE`
- `.gitignore`
- `config.example.json`
- `.github/workflows/release.yml`
- `.github/workflows/update-index.yml`

## 发布验收

- Release 成功发布
- zip 资产可下载
- zip 内文件结构正确
- 官方索引 PR 成功创建
