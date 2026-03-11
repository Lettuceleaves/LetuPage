<script setup lang="ts">
import { onMounted, watch } from "vue";
import type { RuntimePageRecord } from "@/shared/types/runtime";

const props = defineProps<{
  page: RuntimePageRecord | null;
}>();

function runMountHook(page: RuntimePageRecord | null) {
  page?.controller.onMount();
}

onMounted(() => {
  runMountHook(props.page);
});

watch(
  () => props.page?.pageId,
  () => {
    runMountHook(props.page);
  }
);
</script>

<template>
  <section class="workspace-panel">
    <div v-if="page" class="workspace-frame">
      <component :is="page.component" :page="page" :controller="page.controller" />
    </div>
    <div v-else class="workspace-empty">
      当前没有活动页面，请从收藏栏或导航栏中选择一个页面。
    </div>
  </section>
</template>
