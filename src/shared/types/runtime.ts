import type { Component } from "vue";

export type PageStatus = "idle" | "active" | "hidden" | "closed";
export type PageContainer = "main" | "side" | "overlay";
export type InteractionAction = "keep" | "close" | "refresh" | "redirect";

export interface RuntimeMessage<T = unknown> {
  version: string;
  type: string;
  sessionId: string;
  pageId?: string;
  requestId?: string;
  timestamp: number;
  payload?: T;
  meta?: Record<string, unknown>;
}

export interface FavoritePageRecord {
  pageKey: string;
  title: string;
  type: string;
  container: PageContainer;
  payload?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface InteractionSubmitPayload<T = unknown> {
  sessionId: string;
  pageId: string;
  interactionId: string;
  action: string;
  payload?: T;
  timestamp: number;
  endpoint?: string;
}

export interface InteractionResponse<T = unknown> {
  code: number;
  action: InteractionAction;
  message?: string;
  payload?: T;
}

export interface PageController {
  readonly pageType: string;
  readonly component: Component;
  onInit(): void;
  onMount(): void;
  onOpen(): void;
  onClose(): void;
  onUpdate(payload: unknown): void;
  onDestroy(): void;
  emit(type: string, payload?: unknown): void;
  touch(): void;
  close(): void;
}

export interface RuntimePageRecord {
  pageId: string;
  pageKey: string;
  sessionId: string;
  type: string;
  title: string;
  status: PageStatus;
  visible: boolean;
  closable: boolean;
  favorited: boolean;
  container: PageContainer;
  payload: Record<string, unknown>;
  meta: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  component: Component;
  controller: PageController;
}

export interface SessionState {
  sessionId: string;
  taskId: string;
  pages: RuntimePageRecord[];
  activePageId: string | null;
  favoritePages: FavoritePageRecord[];
  navExpanded: boolean;
}

export interface OpenPageInput {
  sessionId: string;
  pageId?: string;
  pageKey: string;
  type: string;
  title: string;
  payload?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  closable?: boolean;
  container?: PageContainer;
}
