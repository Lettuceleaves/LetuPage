<script setup lang="ts">
import type { FavoritePageRecord, SessionState } from "@/shared/types/runtime";

defineProps<{
  session: SessionState;
  onSelect: (pageKey: string) => void;
}>();

function favoriteLabel(favorite: FavoritePageRecord) {
  return `${favorite.title} · ${favorite.type}`;
}
</script>

<template>
  <section class="favorites-bar">
    <div class="section-caption">
      <span>收藏栏</span>
      <small>{{ session.favoritePages.length }} 个固定入口</small>
    </div>
    <div v-if="session.favoritePages.length > 0" class="favorite-list">
      <button
        v-for="favorite in session.favoritePages"
        :key="favorite.pageKey"
        class="favorite-chip"
        type="button"
        :title="favoriteLabel(favorite)"
        @click="onSelect(favorite.pageKey)"
      >
        {{ favorite.title }}
      </button>
    </div>
    <div v-else class="empty-caption">
      还没有收藏页面，点击导航项上的星标即可固定到这里。
    </div>
  </section>
</template>
