import type {
  InteractionAction,
  InteractionResponse,
  InteractionSubmitPayload
} from "@/shared/types/runtime";

export class InteractionHttpClient {
  async submit<TPayload = unknown, TResult = unknown>(
    input: InteractionSubmitPayload<TPayload>
  ): Promise<InteractionResponse<TResult>> {
    const endpoint =
      input.endpoint ??
      `/api/session/${input.sessionId}/page/${input.pageId}/interaction/${input.interactionId}`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });

      const data = await this.readResponseBody<TResult>(response);
      return {
        code: response.status,
        action: this.resolveAction(response.status, data.action),
        message: data.message,
        payload: data.payload
      };
    } catch (error) {
      return {
        code: 0,
        action: "keep",
        message:
          error instanceof Error
            ? error.message
            : "请求失败，交互弹窗保持打开。"
      };
    }
  }

  async checkHealth(endpoint: string) {
    try {
      const response = await fetch(endpoint, {
        method: "GET"
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  private resolveAction(
    status: number,
    action?: InteractionAction
  ): InteractionAction {
    if (action) {
      return action;
    }

    if (status >= 200 && status < 300) {
      return "close";
    }

    return "keep";
  }

  private async readResponseBody<TResult>(
    response: Response
  ): Promise<Partial<InteractionResponse<TResult>>> {
    const contentType = response.headers.get("Content-Type") ?? "";
    const text = await response.text();
    if (!text.trim()) {
      return {};
    }

    if (!contentType.includes("application/json")) {
      return {};
    }

    try {
      return JSON.parse(text) as Partial<InteractionResponse<TResult>>;
    } catch {
      return {};
    }
  }
}
