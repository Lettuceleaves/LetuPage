import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

function mockInteractionApi() {
  return {
    name: "mock-interaction-api",
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: () => void) => {
        if (req.method !== "POST" || !req.url?.startsWith("/api/session/")) {
          next();
          return;
        }

        let body = "";
        req.on("data", (chunk: any) => {
          body += chunk.toString();
        });

        req.on("end", () => {
          const payload = body ? JSON.parse(body) : {};
          const input = payload.payload ?? {};
          const mode = input.mode ?? "close";
          const title = String(input.title ?? "").trim();

          let statusCode = 200;
          let action = "close";
          let message = "后端已接收交互结果，默认关闭弹窗。";

          if (!title) {
            statusCode = 422;
            action = "keep";
            message = "标题不能为空，弹窗保持打开。";
          } else if (mode === "keep") {
            action = "keep";
            message = "后端接受提交，但要求保持弹窗打开。";
          } else if (mode === "refresh") {
            action = "refresh";
            message = "后端要求刷新页面内容。";
          }

          res.statusCode = statusCode;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              code: statusCode,
              action,
              message,
              payload: {
                echoedTitle: title,
                echoedMode: mode,
                processedAt: Date.now()
              }
            })
          );
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [vue(), mockInteractionApi()],
  resolve: {
    alias: {
      "@": "/src"
    }
  }
});
