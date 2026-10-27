# Production Theme Extension

这些文件来自宽 API 当前主题扩展资源，用于给维护者接入真实 Chat 宿主。

它们不包含服务器地址、密钥、账号、数据库或聊天内容。文件名中的构建哈希属于宿主资源标识，接入时必须保持同目录导入关系。

`kuan-chat-theme-v2.js` 需要同目录的：

- `kuan-tc1003-e92a67dc3f.js`
- `kuan-punctuation-knot.js`
- `kuan-theme-transition.js`

`kuan-theme-transition.js` 的 DOM 快照功能由 `kuan-html-to-image.js` 以普通脚本方式提供 `window.htmlToImage`。如果宿主不需要快照，可以让切换动画自然回退为直接切换，但不能把错误留在主题按钮上。

`kuan-work-agent-v1.css/js` 只负责工程模式的事件呈现：命令、结果、审批、计划、终端和恢复状态，不负责真正执行命令。
