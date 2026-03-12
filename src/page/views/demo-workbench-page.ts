import DemoWorkbenchPageView from "@/page/views/DemoWorkbenchPageView.vue";
import { BasePage } from "@/page/base/BasePage";
import type { InteractionResponse, OpenPageInput } from "@/shared/types/runtime";

export interface DemoSubmitPayload {
  title: string;
  detail: string;
}

export class DemoWorkbenchPage extends BasePage {
  readonly pageType = "demo-workbench";
  readonly component = DemoWorkbenchPageView;

  readonly definition: OpenPageInput;

  constructor(definition: OpenPageInput) {
    super();
    this.definition = definition;
  }

  async submitDialog(payload: DemoSubmitPayload) {
    const response = await this.submitInteraction<DemoSubmitPayload, Record<string, never>>(
      "dialog-form",
      "submit",
      payload,
      String(this.definition.payload?.endpoint ?? "")
    );

    this.touch();
    this.emit("interaction.submit", payload);
    return response;
  }

  handleDialogClosed(result: InteractionResponse) {
    this.emit("interaction.closed", result);
  }
}
