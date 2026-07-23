# 镜像与发布说明

本仓库是 `deveco-arkts-lsp` 的非官方 GitHub 镜像与 npm 发布入口。

- 上游仓库：`https://gitcode.com/openharmony-mcp/deveco-arkts-lsp`
- npm 包：`@rvaim/deveco-arkts-lsp`
- 同步频率：每 6 小时检查一次，也支持手动触发
- 功能源码：保持上游内容不变

GitHub Actions 只在临时发布目录中调整 npm 包名、仓库元数据和启动包装，并在发布包的 README 顶部加入镜像说明。仓库会定期同步所有上游提交，但只有上游 `package.json` 的版本号出现尚未发布的新值时，才会发布 npm 包。

原项目版权及许可证归原作者和贡献者所有。发布包保留原始 `LICENSE`。
