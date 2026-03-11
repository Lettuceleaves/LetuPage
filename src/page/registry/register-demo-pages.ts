import { PageRegistry } from "@/page/registry/page-registry";
import { DemoWorkbenchPage } from "@/page/views/demo-workbench-page";

export function registerDemoPages(pageRegistry: PageRegistry) {
  pageRegistry.register("demo-workbench", (input) => new DemoWorkbenchPage(input));
}
