<script setup lang="ts">
import { computed, inject } from "vue";
import FavoritesBar from "@/components/layout/FavoritesBar.vue";
import PageNavBar from "@/components/layout/PageNavBar.vue";
import PageWorkspace from "@/components/layout/PageWorkspace.vue";
import type { AppRuntime } from "@/main/bootstrap";

const injectedRuntime = inject<AppRuntime>("appRuntime");

if (!injectedRuntime) {
  throw new Error("App runtime is not available.");
}

const runtime = injectedRuntime;

const session = computed(() => runtime.sessionManager.activeSession);
const activePage = computed(() =>
  session.value
    ? runtime.sessionManager.getActivePage(session.value.sessionId)
    : null
);
const visiblePages = computed(() =>
  session.value
    ? runtime.sessionManager.getVisibleNavPages(session.value.sessionId)
    : []
);
const overflowPages = computed(() =>
  session.value
    ? runtime.sessionManager.getOverflowPages(session.value.sessionId)
    : []
);

function restoreFavorite(pageKey: string) {
  if (!session.value) {
    return;
  }

  runtime.sessionManager.restoreFavorite(session.value.sessionId, pageKey);
}

function selectPage(pageId: string) {
  if (!session.value) {
    return;
  }

  runtime.sessionManager.focusPage(session.value.sessionId, pageId);
  runtime.sessionManager.setNavExpanded(session.value.sessionId, false);
}

function closePage(pageId: string) {
  if (!session.value) {
    return;
  }

  runtime.sessionManager.closePage(session.value.sessionId, pageId);
}

function toggleFavorite(pageId: string) {
  if (!session.value) {
    return;
  }

  runtime.sessionManager.toggleFavorite(session.value.sessionId, pageId);
}

function toggleExpanded(value: boolean) {
  if (!session.value) {
    return;
  }

  runtime.sessionManager.setNavExpanded(session.value.sessionId, value);
}

function resetSession() {
  if (!session.value) {
    return;
  }

  runtime.sessionManager.resetDemoSession(session.value.sessionId);
}
</script>

<template>
  <div v-if="session" class="app-shell">
    <header class="app-hero">
      <div class="hero-copy">
        <p class="eyebrow">LetuPage MVP</p>
        <h1>面向 Agent 的前端运行时框架</h1>
        <p>
          当前实现覆盖 `main / session / page` 结构、收藏栏、最近页面导航、HTTP
          交互回传和响应动作驱动。
        </p>
      </div>
      <div class="hero-actions">
        <button class="primary-button" type="button" @click="resetSession">
          重置演示会话
        </button>
        <div class="hero-metrics">
          <span>{{ session.pages.length }} 个页面</span>
          <span>{{ session.favoritePages.length }} 个收藏</span>
          <span>{{ runtime.sessionManager.eventLog.length }} 条事件</span>
        </div>
      </div>
    </header>

    <FavoritesBar :session="session" :on-select="restoreFavorite" />

    <PageNavBar
      :session="session"
      :visible-pages="visiblePages"
      :overflow-pages="overflowPages"
      :on-select="selectPage"
      :on-close="closePage"
      :on-toggle-favorite="toggleFavorite"
      :on-expand="toggleExpanded"
    />

    <section class="layout-grid">
      <PageWorkspace :page="activePage" />

      <aside class="inspector-panel">
        <div class="section-caption">
          <span>运行时摘要</span>
          <small>最近事件与设计文档对照</small>
        </div>
        <ul class="inspector-list">
          <li>页面导航默认按最新修改时间排序。</li>
          <li>主导航栏只显示前 10 个页面。</li>
          <li>收藏栏固定显示并持久化到 localStorage。</li>
          <li>页面交互通过 HTTP POST 提交到后端接口。</li>
          <li>后端响应码和 action 控制弹窗关闭或保持。</li>
        </ul>

        <div class="event-log">
          <h3>最近事件</h3>
          <ul v-if="runtime.sessionManager.eventLog.length > 0">
            <li
              v-for="event in runtime.sessionManager.eventLog.slice(0, 8)"
              :key="`${event.type}-${event.timestamp}`"
            >
              <strong>{{ event.type }}</strong>
              <span>{{ event.pageId }}</span>
            </li>
          </ul>
          <p v-else>当前还没有事件，打开任意页面弹窗并提交即可看到日志。</p>
        </div>
      </aside>
    </section>
  </div>
</template>

