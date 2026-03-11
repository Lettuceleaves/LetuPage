import { AppRuntime } from "@/main/bootstrap";

let runtime: AppRuntime | null = null;

export function createAppRuntime() {
  if (!runtime) {
    runtime = new AppRuntime();
    runtime.bootstrap();
  }

  return runtime;
}
