import type { Component } from "vue";
import { HttpInteraction } from "@/interaction/base/HttpInteraction";
import { InteractionHttpClient } from "@/interaction/adapters/http-client";
import type {
  InteractionResponse,
  InteractionSubmitPayload,
  RuntimeMessage,
  RuntimePageRecord
} from "@/shared/types/runtime";

export interface PageContext {
  readonly page: RuntimePageRecord;
  readonly httpClient: InteractionHttpClient;
  touchPage: (pageId: string) => void;
  emitEvent: (message: RuntimeMessage) => void;
  closePage: (pageId: string) => void;
}

export abstract class BasePage {
  abstract readonly pageType: string;
  abstract readonly component: Component;

  protected context: PageContext | null = null;

  attachContext(context: PageContext) {
    this.context = context;
    this.onInit();
  }

  onInit(): void {}

  onMount(): void {}

  onOpen(): void {}

  onClose(): void {}

  onUpdate(_payload: unknown): void {}

  onDestroy(): void {}

  emit(type: string, payload?: unknown) {
    if (!this.context) {
      return;
    }

    this.context.emitEvent({
      version: "v1",
      type,
      sessionId: this.context.page.sessionId,
      pageId: this.context.page.pageId,
      timestamp: Date.now(),
      payload
    });
  }

  touch() {
    this.context?.touchPage(this.context.page.pageId);
  }

  close() {
    if (this.context) {
      this.context.closePage(this.context.page.pageId);
    }
  }

  protected async submitInteraction<TPayload = unknown, TResult = unknown>(
    interactionId: string,
    action: string,
    payload: TPayload,
    endpoint?: string
  ): Promise<InteractionResponse<TResult>> {
    if (!this.context) {
      return {
        code: 0,
        action: "keep",
        message: "页面上下文尚未挂载。"
      };
    }

    const interaction = new HttpInteraction<TPayload, TResult>(
      this.context.httpClient
    );

    return interaction.submit({
      sessionId: this.context.page.sessionId,
      pageId: this.context.page.pageId,
      interactionId,
      action,
      payload,
      timestamp: Date.now(),
      endpoint
    } satisfies InteractionSubmitPayload<TPayload>);
  }
}
