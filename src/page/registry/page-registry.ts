import type { BasePage } from "@/page/base/BasePage";
import type { OpenPageInput } from "@/shared/types/runtime";

type PageFactory = (input: OpenPageInput) => BasePage;

export class PageRegistry {
  private readonly pageFactories = new Map<string, PageFactory>();

  register(type: string, factory: PageFactory) {
    this.pageFactories.set(type, factory);
  }

  create(input: OpenPageInput) {
    const factory = this.pageFactories.get(input.type);
    if (!factory) {
      throw new Error(`Page type "${input.type}" is not registered.`);
    }

    return factory(input);
  }
}
