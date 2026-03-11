<script setup lang="ts">
import type { RuntimePageRecord } from "@/shared/types/runtime";
import { formatRelativeTime } from "@/shared/utils/time";

defineProps<{
  pages: RuntimePageRecord[];
  activePageId: string | null;
  onSelect: (pageId: string) => void;
  onClose: (pageId: string) => void;
}>();
</script>

<template>
  <div class="overflow-panel">
    <div class="section-caption">
      <span>全部页面</span>
      <small>支持上下滚动选择</small>
    </div>
    <div class="overflow-list">
      <article
        v-for="page in pages"
        :key="page.pageId"
        class="overflow-row"
        :class="{ 'is-active': page.pageId === activePageId }"
      >
        <button class="overflow-main" type="button" @click="onSelect(page.pageId)">
          <strong>{{ page.title }}</strong>
          <span>{{ formatRelativeTime(page.updatedAt) }}</span>
        </button>
        <button class="ghost-button" type="button" @click="onClose(page.pageId)">
          关闭
        </button>
      </article>
    </div>
  </div>
</template>
