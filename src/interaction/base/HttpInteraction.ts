import { BaseInteraction } from "@/interaction/base/BaseInteraction";
import { InteractionHttpClient } from "@/interaction/adapters/http-client";
import type {
  InteractionResponse,
  InteractionSubmitPayload
} from "@/shared/types/runtime";

export class HttpInteraction<TPayload = unknown, TResult = unknown> extends BaseInteraction<
  TPayload,
  TResult
> {
  readonly interactionType = "http";

  constructor(private readonly client: InteractionHttpClient) {
    super();
  }

  submit(
    input: InteractionSubmitPayload<TPayload>
  ): Promise<InteractionResponse<TResult>> {
    this.onSubmit(input.payload as TPayload);
    return this.client.submit<TPayload, TResult>(input);
  }
}
