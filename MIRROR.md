# 镜像与发布说明

本仓库是 `deveco-arkts-lsp` 的非官方 GitHub 镜像与 npm 发布入口。

- 上游仓库：`https://gitcode.com/openharmony-mcp/deveco-arkts-lsp`
- npm 包：`@rvaim/deveco-arkts-lsp`
- 同步频率：每 6 小时检查一次，也支持手动触发
- 功能源码：保持上游内容不变

GitHub Actions 只在临时发布目录中调整 npm 包名、版本号、仓库元数据和启动包装，并在发布包的 README 顶部加入镜像说明。仓库会定期同步所有上游提交，但只有上游 `package.json` 的版本号出现尚未处理的新值时，才会发布 npm 包。成功发布后会在 `.github/npm-upstream-version` 中记录上游版本；普通源码同步、重复运行和 npm 包被删除都不会触发同一上游版本的再次发布。

由于上游 npm 启动包装需要修正，本镜像的发布版本在上游版本后固定附加 `-rvaim.1`。该后缀只表示包装修订，不会随普通源码同步递增；例如上游 `1.0.0` 对应 `1.0.0-rvaim.1`。

原项目版权及许可证归原作者和贡献者所有。发布包保留原始 `LICENSE`。
