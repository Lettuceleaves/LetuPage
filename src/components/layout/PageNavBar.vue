<script setup lang="ts">
import PageOverflowPanel from "@/components/layout/PageOverflowPanel.vue";
import type { RuntimePageRecord, SessionState } from "@/shared/types/runtime";
import { formatRelativeTime } from "@/shared/utils/time";

defineProps<{
  session: SessionState;
  visiblePages: RuntimePageRecord[];
  overflowPages: RuntimePageRecord[];
  onSelect: (pageId: string) => void;
  onClose: (pageId: string) => void;
  onToggleFavorite: (pageId: string) => void;
  onExpand: (value: boolean) => void;
}>();
</script>

<template>
  <section class="page-nav-shell">
    <div class="section-caption">
      <span>最近页面导航</span>
      <small>默认按最新修改时间排序，仅展示前 10 项</small>
    </div>
    <div class="page-nav-list">
      <article
        v-for="page in visiblePages"
        :key="page.pageId"
        class="page-pill"
        :class="{ 'is-active': page.pageId === session.activePageId }"
      >
        <button class="page-pill-main" type="button" @click="onSelect(page.pageId)">
          <strong>{{ page.title }}</strong>
          <span>{{ formatRelativeTime(page.updatedAt) }}</span>
        </button>
        <button
          class="icon-button"
          type="button"
          :title="page.favorited ? '取消收藏' : '加入收藏'"
          @click="onToggleFavorite(page.pageId)"
        >
          {{ page.favorited ? "★" : "☆" }}
        </button>
        <button class="icon-button" type="button" @click="onClose(page.pageId)">
          ×
        </button>
      </article>

      <button
        v-if="overflowPages.length > 10"
        class="expand-button"
        type="button"
        @click="onExpand(!session.navExpanded)"
      >
        {{ session.navExpanded ? "收起列表" : `展开全部 ${overflowPages.length} 项` }}
      </button>
    </div>

    <Transition name="slide-down">
      <PageOverflowPanel
        v-if="session.navExpanded"
        :pages="overflowPages"
        :active-page-id="session.activePageId"
        :on-select="onSelect"
        :on-close="onClose"
      />
    </Transition>
  </section>
</template>
