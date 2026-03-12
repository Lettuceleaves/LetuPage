# LetuPage Agent Workflow

本文件不是项目介绍，而是 Agent 在本仓库内必须遵守的执行流程。

## 1. 总原则

你必须把 LetuPage 理解为“前端页面运行时”，而不是业务后端。

你只能让前端负责：

- 页面创建、更新、关闭
- 会话管理
- 页面导航和收藏
- 用户交互采集
- 将交互结果通过 HTTP 发给独立 bridge

你不能让前端负责：

- 接收业务请求并直接产出业务结果
- 在前端开发服务器里承接 Agent 逻辑
- 在前端本地直接生成报告、推理结果或最终业务数据

## 2. 强制执行流程

每次进入本仓库，都按下面顺序执行：

1. 先阅读 [design-doc.md](/E:/projects/LetuPage/design-doc.md)
2. 再阅读 [src/main/bootstrap.ts](/E:/projects/LetuPage/src/main/bootstrap.ts)
3. 再阅读 [src/session/runtime/session-manager.ts](/E:/projects/LetuPage/src/session/runtime/session-manager.ts)
4. 再阅读 [src/page/base/BasePage.ts](/E:/projects/LetuPage/src/page/base/BasePage.ts)
5. 再阅读 [src/interaction/adapters/http-client.ts](/E:/projects/LetuPage/src/interaction/adapters/http-client.ts)
6. 确认本次任务是“页面 CRUD”还是“bridge 接入”
7. 如果任务涉及用户提交结果，先确认独立 bridge 存在，再修改页面

不要跳过这条顺序。

## 3. Bridge 规则

前端页面提交结果时，接收方必须是独立 bridge。

这里的独立 bridge 指：

- Linux 使用 [bridge.sh](/E:/projects/LetuPage/bridge.sh)
- Windows 使用 [bridge.bat](/E:/projects/LetuPage/bridge.bat)

bridge 的职责只有两类：

- 接收前端发来的 HTTP 请求
- 把请求内容交给 Agent 或外部处理方，再返回响应

bridge 不属于前端页面层，也不属于 `vite.config.ts`。

## 4. 明确禁止的做法

以下做法一律视为错误实现：

- 在 `vite.config.ts` 中承接业务请求
- 在前端页面代码中直接模拟 Agent 返回结果
- 在前端本地直接生成报告页数据
- 把“前端提交给 bridge”偷换成“前端提交给前端自己”
- 把启动时预置页面当成运行时动态创建页面

如果任务要求“前端把结果回传给 Agent”，那就必须经过独立 bridge。

## 5. 页面任务的执行方式

如果前端运行时已经存在，你的工作重点就是页面 CRUD。

页面任务只允许做这些事情：

- 新建页面
- 更新页面
- 关闭页面
- 切换页面
- 调整页面交互
- 维护页面收藏和导航行为

不要为了完成业务流程，把 bridge 逻辑塞进页面层。

## 6. 新增页面时必须遵守

新增页面时，必须按下面路径操作：

1. 在 [src/page/views](/E:/projects/LetuPage/src/page/views) 中新增页面类和 Vue 视图
2. 页面类继承 [BasePage.ts](/E:/projects/LetuPage/src/page/base/BasePage.ts)
3. 在页面注册位置完成注册
4. 通过 `sessionManager.openPage()` 打开页面

页面必须满足：

- 声明 `pageType`
- 绑定 `component`
- 交互提交走统一 HTTP 提交能力
- 被选中或更新后刷新 `updatedAt`

## 7. 交互回传规则

前端交互回传遵守以下规则：

- 页面负责收集用户输入
- 页面只负责发送原始结果或结构化结果
- 后续决策必须由 bridge / Agent 完成
- 前端只能根据 HTTP 响应决定关闭、保持或刷新交互

推荐响应语义：

- `2xx`：成功
- `4xx`：输入问题，保持交互打开
- `5xx`：服务异常，保持交互打开

推荐 `action`：

- `close`
- `keep`
- `refresh`
- `redirect`

## 8. 页面导航和收藏规则

这是硬约定，不允许绕开：

- 页面默认按 `updatedAt` 倒序排列
- 用户重新选中页面后，应刷新 `updatedAt`
- 主导航栏最多只显示 10 个页面
- 超出部分通过展开面板展示
- 页面可以加入收藏栏
- 收藏必须持久化到 `localStorage`
- 收藏恢复依赖 `pageKey`，不能依赖临时 `pageId`

相关实现位置：

- [session-manager.ts](/E:/projects/LetuPage/src/session/runtime/session-manager.ts)
- [FavoritesBar.vue](/E:/projects/LetuPage/src/components/layout/FavoritesBar.vue)
- [PageNavBar.vue](/E:/projects/LetuPage/src/components/layout/PageNavBar.vue)
- [PageOverflowPanel.vue](/E:/projects/LetuPage/src/components/layout/PageOverflowPanel.vue)

## 9. 目录理解规则

你必须这样理解 `src`：

```text
src/
  main/         入口和运行时装配
  session/      会话、多页面、收藏、导航
  page/         页面类、页面注册、页面视图
  interaction/  HTTP 交互提交
  components/   通用页面壳子和导航组件
  shared/       共享类型和工具
  styles/       样式
```

不要把这些目录当成业务模块树。

## 10. 执行判断

遇到任务时，先做下面的判断：

1. 如果任务是页面展示或页面切换，改 `page` / `components` / `session`
2. 如果任务是交互提交，改 `interaction` 和页面提交逻辑
3. 如果任务是用户结果回传，先确认 bridge，而不是改前端开发服务器
4. 如果任务要求 Agent 收到请求后继续生成新页面，必须保留“前端 -> bridge -> Agent -> 前端”的链路

如果做不到这条链路，就不要把结果伪装成已经完成。
