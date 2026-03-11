import { reactive } from "vue";
import { PageRegistry } from "@/page/registry/page-registry";
import { registerDemoPages } from "@/page/registry/register-demo-pages";
import { SessionManager } from "@/session/runtime/session-manager";

export class AppRuntime {
  readonly pageRegistry = new PageRegistry();

  readonly sessionManager = reactive(
    new SessionManager({
      pageRegistry: this.pageRegistry
    })
  );

  bootstrap() {
    registerDemoPages(this.pageRegistry);
    const session = this.sessionManager.createSession("task-seed");
    this.sessionManager.seedDemoPages(session.sessionId);
  }
}
