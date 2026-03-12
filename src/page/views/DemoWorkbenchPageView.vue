<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { InteractionHttpClient } from "@/interaction/adapters/http-client";
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
const title = ref(props.page.title);
const detail = ref("");
const feedback = ref("bridge 尚未确认 ready。请先启动并保持独立 bridge 运行。");
const lastStatus = ref<number | null>(null);
const submitting = ref(false);
const checkingBridge = ref(false);
const bridgeReady = ref(false);
const bridgeMessage = ref("未检查");
const bridgeClient = new InteractionHttpClient();
let bridgeTimer: ReturnType<typeof setInterval> | null = null;

const tags = computed(() => {
  const value = props.page.payload.tags;
  return Array.isArray(value) ? value.map(String) : [];
});

const submitEndpoint = computed(() =>
  String(props.page.payload.endpoint ?? "http://127.0.0.1:8080/submit")
);
const healthEndpoint = computed(() =>
  String(props.page.payload.healthEndpoint ?? "http://127.0.0.1:8080/health")
);

async function refreshBridgeStatus() {
  checkingBridge.value = true;
  const ready = await bridgeClient.checkHealth(healthEndpoint.value);
  bridgeReady.value = ready;
  bridgeMessage.value = ready
    ? "bridge ready，可开始交互并提交日志。"
    : "bridge 未 ready，前端禁止发起交互提交。";
  if (!ready) {
    dialogOpen.value = false;
  }
  checkingBridge.value = false;
}

function openDialog() {
  if (!bridgeReady.value) {
    feedback.value = "bridge 未 ready，不能开始交互。";
    return;
  }

  dialogOpen.value = true;
}

async function handleSubmit() {
  if (!bridgeReady.value) {
    feedback.value = "bridge 未 ready，提交被阻止。";
    return;
  }

  submitting.value = true;
  const payload: DemoSubmitPayload = {
    title: title.value,
    detail: detail.value
  };
  const result = await props.controller.submitDialog(payload);

  lastStatus.value = result.code;
  if (result.code >= 200 && result.code < 300) {
    feedback.value = "交互已写入 bridge 日志。下一步应由 Agent 读取日志，再修改或新增 page。";
    dialogOpen.value = false;
    props.controller.handleDialogClosed(result);
  } else {
    feedback.value = result.message ?? "bridge 返回异常，交互保持打开。";
  }

  submitting.value = false;
}

onMounted(() => {
  refreshBridgeStatus();
  bridgeTimer = setInterval(() => {
    refreshBridgeStatus();
  }, 5000);
});

onBeforeUnmount(() => {
  if (bridgeTimer) {
    clearInterval(bridgeTimer);
  }
});
</script>

<template>
  <article class="demo-page">
    <header class="demo-page-header">
      <div>
        <p class="eyebrow">Demo Page</p>
        <h1>{{ page.title }}</h1>
      </div>
      <div class="header-actions">
        <button
          class="ghost-button"
          type="button"
          :disabled="checkingBridge"
          @click="refreshBridgeStatus"
        >
          {{ checkingBridge ? "检查中..." : "检查 bridge" }}
        </button>
        <button
          class="primary-button"
          type="button"
          :disabled="!bridgeReady || checkingBridge"
          @click="openDialog"
        >
          {{ bridgeReady ? "开始交互" : "等待 bridge ready" }}
        </button>
      </div>
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
          <li>bridge 未 ready 前，前端不能开始交互提交。</li>
          <li>bridge 只接收原始结果并写入唯一日志。</li>
          <li>bridge 提交成功后，只返回简单 200。</li>
          <li>后续结果页或页面更新必须由 Agent 读取日志后完成。</li>
        </ul>
      </div>
      <div class="info-panel">
        <h3>Bridge 状态</h3>
        <p>{{ bridgeMessage }}</p>
        <p>health: <code>{{ healthEndpoint }}</code></p>
        <p>submit: <code>{{ submitEndpoint }}</code></p>
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
              <h2>提交原始结果到 bridge</h2>
            </div>
            <button class="icon-button" type="button" @click="dialogOpen = false">
              ×
            </button>
          </header>

          <label class="field">
            <span>标题</span>
            <input v-model="title" type="text" placeholder="输入本次交互标题" />
          </label>

          <label class="field">
            <span>说明</span>
            <textarea
              v-model="detail"
              rows="4"
              placeholder="这里的内容会作为原始结果写入 bridge 日志"
            />
          </label>

          <footer class="dialog-footer">
            <button class="ghost-button" type="button" @click="dialogOpen = false">
              取消
            </button>
            <button
              class="primary-button"
              type="button"
              :disabled="submitting || !bridgeReady"
              @click="handleSubmit"
            >
              {{ submitting ? "提交中..." : "写入 bridge 日志" }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </article>
</template>
