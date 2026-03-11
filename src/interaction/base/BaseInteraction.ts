import type {
  InteractionResponse,
  InteractionSubmitPayload
} from "@/shared/types/runtime";

export abstract class BaseInteraction<TPayload = unknown, TResult = unknown> {
  abstract readonly interactionType: string;

  onInit(): void {}

  onAttach(): void {}

  onDetach(): void {}

  onSubmit(_payload: TPayload): void {}

  onCancel(): void {}

  abstract submit(
    input: InteractionSubmitPayload<TPayload>
  ): Promise<InteractionResponse<TResult>>;
}
