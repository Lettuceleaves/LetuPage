import { InteractionHttpClient } from "@/interaction/adapters/http-client";
import type { PageContext } from "@/page/base/BasePage";
import type { PageRegistry } from "@/page/registry/page-registry";
import type {
  FavoritePageRecord,
  OpenPageInput,
  RuntimeMessage,
  RuntimePageRecord,
  SessionState
} from "@/shared/types/runtime";
import { FavoritesStorage } from "@/session/store/favorites-storage";

interface SessionManagerOptions {
  pageRegistry: PageRegistry;
}

const NAV_LIMIT = 10;

export class SessionManager {
  readonly sessions: SessionState[] = [];
  readonly httpClient = new InteractionHttpClient();
  readonly eventLog: RuntimeMessage[] = [];

  private readonly favoritesStorage = new FavoritesStorage();

  constructor(private readonly options: SessionManagerOptions) {}

  get activeSession() {
    return this.sessions[0] ?? null;
  }

  createSession(taskId: string) {
    const sessionId = `session-${Date.now()}`;
    const session: SessionState = {
      sessionId,
      taskId,
      pages: [],
      activePageId: null,
      favoritePages: this.favoritesStorage.load(),
      navExpanded: false
    };

    this.sessions.unshift(session);
    return session;
  }

  seedDemoPages(sessionId: string) {
    const session = this.requireSession(sessionId);
    const seeds = [
      "首页概览",
      "任务回执",
      "配置检查",
      "发布记录",
      "接口日志",
      "素材面板",
      "Skill 检索",
      "导航调试",
      "收藏恢复",
      "响应码演示",
      "窗口布局",
      "主题预览"
    ];

    seeds.forEach((title, index) => {
      this.openPage({
        sessionId,
        pageKey: `demo-${index + 1}`,
        type: "demo-workbench",
        title,
        payload: {
          description: `${title} 页面用于演示独立 bridge、session 内 page CRUD、日志回传与等待 Agent 后续改页的流程。`,
          tags: ["session", "page", "bridge", index % 2 === 0 ? "favorite" : "flow"],
          endpoint: "http://127.0.0.1:8080/submit",
          healthEndpoint: "http://127.0.0.1:8080/health",
          accent: index % 3
        },
        meta: {
          index
        }
      });
    });

    session.favoritePages.forEach((favorite) => {
      if (!session.pages.some((page) => page.pageKey === favorite.pageKey)) {
        this.restoreFavorite(sessionId, favorite.pageKey);
      }
    });

    this.focusPage(session.sessionId, session.pages[0]?.pageId ?? null);
  }

  openPage(input: OpenPageInput) {
    const session = this.requireSession(input.sessionId);
    const existing = session.pages.find((page) => page.pageKey === input.pageKey);
    if (existing) {
      this.focusPage(session.sessionId, existing.pageId);
      return existing;
    }

    const controller = this.options.pageRegistry.create(input);
    const page: RuntimePageRecord = {
      pageId: input.pageId ?? `${input.pageKey}-${crypto.randomUUID()}`,
      pageKey: input.pageKey,
      sessionId: input.sessionId,
      type: input.type,
      title: input.title,
      status: "idle",
      visible: true,
      closable: input.closable ?? true,
      favorited: session.favoritePages.some(
        (favorite) => favorite.pageKey === input.pageKey
      ),
      container: input.container ?? "main",
      payload: input.payload ?? {},
      meta: input.meta ?? {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      component: controller.component,
      controller
    };

    const context: PageContext = {
      page,
      httpClient: this.httpClient,
      touchPage: (pageId) => this.touchPage(session.sessionId, pageId),
      emitEvent: (message) => this.logEvent(message),
      closePage: (pageId) => this.closePage(session.sessionId, pageId)
    };

    controller.attachContext(context);
    controller.onOpen();
    page.status = "active";
    session.pages.unshift(page);
    session.activePageId = page.pageId;
    this.touchPage(session.sessionId, page.pageId);
    return page;
  }

  focusPage(sessionId: string, pageId: string | null) {
    if (!pageId) {
      return;
    }

    const session = this.requireSession(sessionId);
    const page = session.pages.find((item) => item.pageId === pageId);
    if (!page) {
      return;
    }

    session.activePageId = page.pageId;
    session.pages.forEach((item) => {
      item.status = item.pageId === page.pageId ? "active" : "idle";
    });
    this.touchPage(sessionId, page.pageId);
  }

  closePage(sessionId: string, pageId: string) {
    const session = this.requireSession(sessionId);
    const index = session.pages.findIndex((page) => page.pageId === pageId);
    if (index === -1) {
      return;
    }

    const [page] = session.pages.splice(index, 1);
    page.controller.onClose();
    page.controller.onDestroy();

    if (session.activePageId === pageId) {
      session.activePageId = session.pages[0]?.pageId ?? null;
      if (session.activePageId) {
        this.focusPage(sessionId, session.activePageId);
      }
    }
  }

  touchPage(sessionId: string, pageId: string) {
    const session = this.requireSession(sessionId);
    const page = session.pages.find((item) => item.pageId === pageId);
    if (!page) {
      return;
    }

    page.updatedAt = Date.now();
  }

  updatePage(sessionId: string, pageId: string, payload: Record<string, unknown>) {
    const session = this.requireSession(sessionId);
    const page = session.pages.find((item) => item.pageId === pageId);
    if (!page) {
      return;
    }

    page.payload = {
      ...page.payload,
      ...payload
    };
    page.controller.onUpdate(page.payload);
    this.touchPage(sessionId, pageId);
  }

  toggleFavorite(sessionId: string, pageId: string) {
    const session = this.requireSession(sessionId);
    const page = session.pages.find((item) => item.pageId === pageId);
    if (!page) {
      return;
    }

    const existing = session.favoritePages.find(
      (favorite) => favorite.pageKey === page.pageKey
    );

    if (existing) {
      session.favoritePages = session.favoritePages.filter(
        (favorite) => favorite.pageKey !== page.pageKey
      );
      page.favorited = false;
    } else {
      session.favoritePages.unshift(this.toFavoriteRecord(page));
      page.favorited = true;
    }

    this.favoritesStorage.save(session.favoritePages);
  }

  restoreFavorite(sessionId: string, pageKey: string) {
    const session = this.requireSession(sessionId);
    const favorite = session.favoritePages.find((item) => item.pageKey === pageKey);
    if (!favorite) {
      return;
    }

    const existing = session.pages.find((page) => page.pageKey === pageKey);
    if (existing) {
      this.focusPage(sessionId, existing.pageId);
      return;
    }

    this.openPage({
      sessionId,
      pageKey: favorite.pageKey,
      type: favorite.type,
      title: favorite.title,
      payload: favorite.payload,
      meta: favorite.meta,
      container: favorite.container
    });
  }

  setNavExpanded(sessionId: string, value: boolean) {
    const session = this.requireSession(sessionId);
    session.navExpanded = value;
  }

  getSortedPages(sessionId: string) {
    const session = this.requireSession(sessionId);
    return [...session.pages].sort((left, right) => right.updatedAt - left.updatedAt);
  }

  getVisibleNavPages(sessionId: string) {
    return this.getSortedPages(sessionId).slice(0, NAV_LIMIT);
  }

  getOverflowPages(sessionId: string) {
    return this.getSortedPages(sessionId);
  }

  getActivePage(sessionId: string) {
    const session = this.requireSession(sessionId);
    return session.pages.find((page) => page.pageId === session.activePageId) ?? null;
  }

  resetDemoSession(sessionId: string) {
    const session = this.requireSession(sessionId);
    session.pages.splice(0, session.pages.length);
    session.activePageId = null;
    this.seedDemoPages(sessionId);
  }

  private requireSession(sessionId: string) {
    const session = this.sessions.find((item) => item.sessionId === sessionId);
    if (!session) {
      throw new Error(`Session "${sessionId}" does not exist.`);
    }

    return session;
  }

  private toFavoriteRecord(page: RuntimePageRecord): FavoritePageRecord {
    return {
      pageKey: page.pageKey,
      title: page.title,
      type: page.type,
      container: page.container,
      payload: page.payload,
      meta: page.meta
    };
  }

  private logEvent(message: RuntimeMessage) {
    this.eventLog.unshift(message);
    this.eventLog.splice(50);
  }
}




