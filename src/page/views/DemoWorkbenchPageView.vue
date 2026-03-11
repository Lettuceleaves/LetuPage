<script setup lang="ts">
import { computed, ref } from "vue";
import type { RuntimePageRecord } from "@/shared/types/runtime";
import type {
  DemoSubmitPayload,
  DemoWorkbenchPage
} from "@/page/views/demo-workbench-page";

const props = defineProps<{
  page: RuntimePageRecord;
  controller: DemoWorkbenchPage;
}>();

const dialogOpen = ref(false);
const submitMode = ref<DemoSubmitPayload["mode"]>("close");
const title = ref(props.page.title);
const detail = ref("");
const feedback = ref("后端尚未返回结果。");
const lastStatus = ref<number | null>(null);
const submitting = ref(false);

const tags = computed(() => {
  const value = props.page.payload.tags;
  return Array.isArray(value) ? value.map(String) : [];
});

async function handleSubmit() {
  submitting.value = true;
  const result = await props.controller.submitDialog({
    title: title.value,
    detail: detail.value,
    mode: submitMode.value
  });

  lastStatus.value = result.code;
  feedback.value = result.message ?? "后端未返回说明。";

  if (result.action === "close") {
    dialogOpen.value = false;
    props.controller.handleDialogClosed(result);
  }

  if (result.action === "refresh") {
    feedback.value = `${feedback.value} 页面内容已按约定刷新。`;
  }

  submitting.value = false;
}
</script>

<template>
  <article class="demo-page">
    <header class="demo-page-header">
      <div>
        <p class="eyebrow">Demo Page</p>
        <h1>{{ page.title }}</h1>
      </div>
      <button class="primary-button" type="button" @click="dialogOpen = true">
        打开交互弹窗
      </button>
    </header>

    <section class="hero-card" :data-accent="String(page.payload.accent ?? 0)">
      <div>
        <h2>页面说明</h2>
        <p>
          {{ String(page.payload.description ?? "这是一个示例页面，用于演示 LetuPage 的运行时。") }}
        </p>
      </div>
      <div class="tag-grid">
        <span v-for="tag in tags" :key="tag" class="tag">
          {{ tag }}
        </span>
      </div>
    </section>

    <section class="demo-grid">
      <div class="info-panel">
        <h3>当前约定</h3>
        <ul>
          <li>交互通过 HTTP POST 回传后端。</li>
          <li>后端可以用响应码和 action 决定弹窗是否关闭。</li>
          <li>页面被选中或被交互更新后会刷新最新修改时间。</li>
        </ul>
      </div>
      <div class="info-panel">
        <h3>接口地址</h3>
        <code>{{ String(page.payload.endpoint ?? "/api/...") }}</code>
      </div>
      <div class="info-panel">
        <h3>最近反馈</h3>
        <p>{{ feedback }}</p>
        <p v-if="lastStatus !== null" class="status-note">HTTP {{ lastStatus }}</p>
      </div>
    </section>

    <Transition name="fade">
      <div v-if="dialogOpen" class="dialog-backdrop">
        <div class="dialog-panel">
          <header class="dialog-header">
            <div>
              <p class="eyebrow">Interaction</p>
              <h2>提交到后端</h2>
            </div>
            <button class="icon-button" type="button" @click="dialogOpen = false">
              ×
            </button>
          </header>

          <label class="field">
            <span>标题</span>
            <input v-model="title" type="text" placeholder="留空会触发 422 并保持打开" />
          </label>

          <label class="field">
            <span>说明</span>
            <textarea
              v-model="detail"
              rows="4"
              placeholder="这里的内容会随请求一起 POST 给后端"
            />
          </label>

          <label class="field">
            <span>后端动作</span>
            <select v-model="submitMode">
              <option value="close">200 + close</option>
              <option value="keep">200 + keep</option>
              <option value="refresh">200 + refresh</option>
            </select>
          </label>

          <footer class="dialog-footer">
            <button class="ghost-button" type="button" @click="dialogOpen = false">
              取消
            </button>
            <button
              class="primary-button"
              type="button"
              :disabled="submitting"
              @click="handleSubmit"
            >
              {{ submitting ? "提交中..." : "发送到后端" }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </article>
</template>
