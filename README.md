# LetuPage Agent Workflow

本文件不是项目介绍，而是 Agent 进入本仓库后必须遵守的标准执行流程。

## 1. 先检查项目是否已经启动

进入仓库后，第一步不是改代码，而是先判断项目是否已经在本地运行。

执行规则：

1. 先检查本地是否已经有 LetuPage 运行中的前端进程
2. 如果已经启动，不要重复启动
3. 如果没有启动，再执行：

```bash
npm run dev
```

这一步的目的只有一个：确保你面对的是一个正在运行的页面运行时。

## 2. 再阅读工具和可用资源

确认运行时存在后，再阅读本仓库里已经提供的工具和资源。

优先阅读顺序：

1. [design-doc.md](./design-doc.md)
2. [src/main/bootstrap.ts](./src/main/bootstrap.ts)
3. [src/session/runtime/session-manager.ts](./src/session/runtime/session-manager.ts)
4. [src/page/base/BasePage.ts](./src/page/base/BasePage.ts)
5. [src/interaction/adapters/http-client.ts](./src/interaction/adapters/http-client.ts)
6. [bridge.sh](./bridge.sh)
7. [bridge.bat](./bridge.bat)

你需要先知道：

- 当前有哪些页面运行时能力
- 当前有哪些交互提交能力
- 当前 session 是怎么管理的
- 当前 bridge 是怎么接请求的

不要在没有阅读这些资源之前直接改页面流程。

## 3. 然后找到或创建自己的 Session

页面不是直接散落在应用里的，页面必须属于某个 `session`。

执行规则：

1. 先确认当前任务是否已经有可复用的 `session`
2. 如果有，就在已有 `session` 内继续工作
3. 如果没有，就创建自己的 `session`
4. 后续页面都必须挂在这个 `session` 下

你要优先理解和使用：

- [session-manager.ts](./src/session/runtime/session-manager.ts)

不要绕过 `session` 直接手写页面集合状态。

## 4. 最后在 Session 下完成 Page

确认 `session` 后，再开始做页面。

页面任务只允许围绕以下动作展开：

- 创建页面
- 更新页面
- 关闭页面
- 切换页面
- 调整页面交互
- 维护页面收藏和导航行为

新增页面时，按下面路径处理：

1. 在 [src/page/views](./src/page/views) 中新增页面类和页面视图
2. 页面类继承 [BasePage.ts](./src/page/base/BasePage.ts)
3. 在页面注册位置完成注册
4. 通过 `sessionManager.openPage()` 把页面挂到当前 `session`

页面必须满足：

- 声明 `pageType`
- 绑定 `component`
- 交互走统一 HTTP 提交能力
- 被选中或更新后刷新 `updatedAt`

## 5. 交互必须发给独立 Bridge

如果页面需要把用户结果回传出去，接收方必须是独立 bridge。

可用 bridge：

- Linux 使用 [bridge.sh](./bridge.sh)
- Windows 使用 [bridge.bat](./bridge.bat)

前端只负责：

- 收集用户输入
- 发送 HTTP 请求
- 根据响应决定关闭、保持或刷新交互

前端不负责：

- 直接生成业务结果
- 直接代替 Agent 做决策
- 在前端本地伪造完整业务闭环

## 6. 明确禁止的做法

以下做法一律视为错误：

- 不检查项目是否已经启动，直接重复启动
- 不经过 `session`，直接把页面塞进应用
- 在 `vite.config.ts` 中承接业务请求
- 在前端页面代码中直接模拟 Agent 返回结果
- 把“前端提交给 bridge”改成“前端提交给前端自己”
- 把启动时预置页面当成运行时动态创建页面

## 7. 页面导航和收藏是硬约定

你不能破坏以下规则：

- 页面默认按 `updatedAt` 倒序排列
- 用户重新选中页面后，应刷新 `updatedAt`
- 主导航栏最多只显示 10 个页面
- 超出部分通过展开面板展示
- 页面可以加入收藏栏
- 收藏必须持久化到 `localStorage`
- 收藏恢复依赖 `pageKey`，不能依赖临时 `pageId`

相关实现：

- [session-manager.ts](./src/session/runtime/session-manager.ts)
- [FavoritesBar.vue](./src/components/layout/FavoritesBar.vue)
- [PageNavBar.vue](./src/components/layout/PageNavBar.vue)
- [PageOverflowPanel.vue](./src/components/layout/PageOverflowPanel.vue)

## 8. 遇到任务时怎么判断

你只按下面顺序判断：

1. 项目是否已经启动
2. 工具和资源是否已经阅读
3. 当前是否已有可用 `session`
4. 本次任务是创建 page、更新 page，还是处理交互
5. 是否需要独立 bridge 接收请求

如果这五步没有走完，不要直接开始写业务流程。
