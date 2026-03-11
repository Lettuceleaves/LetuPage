# LetuPage

LetuPage 是一个面向 Agent 的前端框架。这个 `README.md` 不是给最终用户看的，而是给进入本仓库工作的 Agent 看的引导文件。

你的任务不是把它当成普通网站来维护，而是把它当成一个“Agent 可调用的页面运行时框架”来扩展。

## 1. 先理解项目目标

这个项目当前的核心目标是：

- 基于 Vue 3 构建一个前端框架
- 提供 `main / session / page` 三层运行时
- 支持一个 `session` 内同时存在多个 `page`
- 支持收藏栏、最近页面导航、展开面板
- 通过 HTTP `POST` 把页面交互结果回传给后端
- 允许后端通过响应码和响应体动作控制前端交互状态

这个项目当前不是：

- 低代码搭建器
- JSON Schema 页面引擎
- CLI 桥接程序本体
- 只做样式展示的组件库

## 2. 开工前先读哪些文件

进入本项目后，优先阅读：

1. [design-doc.md](/E:/projects/LetuPage/design-doc.md)
2. [src/main/bootstrap.ts](/E:/projects/LetuPage/src/main/bootstrap.ts)
3. [src/session/runtime/session-manager.ts](/E:/projects/LetuPage/src/session/runtime/session-manager.ts)
4. [src/page/base/BasePage.ts](/E:/projects/LetuPage/src/page/base/BasePage.ts)
5. [src/interaction/adapters/http-client.ts](/E:/projects/LetuPage/src/interaction/adapters/http-client.ts)

理解顺序：

- 先看设计目标和边界
- 再看运行时入口
- 再看会话和页面管理
- 最后看页面基类和 HTTP 交互方式

## 3. 当前实现状态

当前仓库已经有一版可运行 MVP，包含：

- Vite + Vue 3 + TypeScript 基础工程
- `main / session / page / interaction` 基础运行时
- 页面基类与 HTTP 交互基类
- 收藏栏与 `localStorage` 持久化
- 最近修改时间排序
- 导航栏最多展示 10 个页面
- 超出后通过展开面板展示全部页面
- 示例页面和示例交互弹窗
- 开发环境中的 mock HTTP 接口

当前演示入口：

- [src/App.vue](/E:/projects/LetuPage/src/App.vue)
- [src/page/views/DemoWorkbenchPageView.vue](/E:/projects/LetuPage/src/page/views/DemoWorkbenchPageView.vue)

开发环境 mock 接口位置：

- [vite.config.ts](/E:/projects/LetuPage/vite.config.ts)

## 4. 目录怎么理解

`src` 下的重要结构如下：

```text
src/
  main/         应用启动与运行时装配
  session/      会话、多页面管理、收藏和导航状态
  page/         页面基类、页面注册、页面视图
  interaction/  交互抽象与 HTTP 提交
  components/   可复用布局和导航组件
  shared/       共享类型与工具
  styles/       全局样式
```

理解方式：

- `main` 管应用入口
- `session` 管页面集合和排序、收藏、切换
- `page` 管页面定义和页面类
- `interaction` 管交互提交，不直接做复杂业务逻辑
- `components` 管通用 UI 壳子

不要把资源结构和三层运行时混在一起理解。

## 5. Agent 在这个项目里应该怎么做事

如果你要实现新能力，优先遵循下面的工作方式：

1. 先确认需求属于哪一层：`main`、`session`、`page`、`interaction` 还是通用组件。
2. 如果是页面行为，优先考虑是否应该写在页面基类或具体页面类里。
3. 如果是会话级功能，例如收藏、排序、导航、恢复，优先写在 `session-manager`。
4. 如果是用户交互回传后端，优先走 HTTP 交互适配器，不要绕过统一提交入口。
5. 如果是页面展示层变化，优先复用现有布局组件，而不是直接把逻辑塞进 `App.vue`。

## 6. 新增页面的标准做法

新增页面时，遵循这个路径：

1. 在 [src/page/views](/E:/projects/LetuPage/src/page/views) 新建页面类和 Vue 视图。
2. 页面类继承 [BasePage.ts](/E:/projects/LetuPage/src/page/base/BasePage.ts)。
3. 在 [register-demo-pages.ts](/E:/projects/LetuPage/src/page/registry/register-demo-pages.ts) 或新的注册文件里完成注册。
4. 通过 `sessionManager.openPage()` 打开页面。

最小要求：

- 页面类必须声明 `pageType`
- 页面类必须绑定 `component`
- 页面交互回传后端时，优先调用基类中的交互提交能力
- 页面被选中或更新后，要允许 `updatedAt` 刷新，从而影响导航排序

## 7. 交互是怎么回传后端的

项目当前的约定是：

- 页面负责采集用户输入
- 前端负责把交互结果转成 HTTP 请求
- 后端负责返回响应码和动作
- 前端根据响应结果决定关闭、保持或刷新交互

重点文件：

- [http-client.ts](/E:/projects/LetuPage/src/interaction/adapters/http-client.ts)
- [BasePage.ts](/E:/projects/LetuPage/src/page/base/BasePage.ts)
- [DemoWorkbenchPageView.vue](/E:/projects/LetuPage/src/page/views/DemoWorkbenchPageView.vue)

推荐响应语义：

- `2xx`：成功
- `4xx`：输入问题，通常保持交互打开
- `5xx`：服务异常，通常保持交互打开

响应体中的 `action` 当前建议使用：

- `close`
- `keep`
- `refresh`
- `redirect`

## 8. 页面导航和收藏规则

这是当前项目的硬约定：

- 页面默认按 `updatedAt` 倒序排列
- 用户重新选中页面后，应刷新 `updatedAt`
- 主导航栏最多只显示 10 个页面
- 超出的页面通过展开面板查看
- 页面可以加入收藏栏
- 收藏信息必须持久化到 `localStorage`
- 收藏恢复依赖稳定的 `pageKey`，不要把会话内临时 `pageId` 当成持久化主键

相关实现：

- [session-manager.ts](/E:/projects/LetuPage/src/session/runtime/session-manager.ts)
- [FavoritesBar.vue](/E:/projects/LetuPage/src/components/layout/FavoritesBar.vue)
- [PageNavBar.vue](/E:/projects/LetuPage/src/components/layout/PageNavBar.vue)
- [PageOverflowPanel.vue](/E:/projects/LetuPage/src/components/layout/PageOverflowPanel.vue)

## 9. 运行项目

安装依赖：

```bash
npm install
```

开发模式：

```bash
npm run dev
```

类型检查：

```bash
npm run typecheck
```

生产构建：

```bash
npm run build
```

在没有特殊原因时，提交前至少跑 `npm run typecheck`。如果条件允许，最好再跑一次 `npm run build`。
