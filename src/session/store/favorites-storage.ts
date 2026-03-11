import type { FavoritePageRecord } from "@/shared/types/runtime";

const STORAGE_KEY = "letupage:favorites:v1";

export class FavoritesStorage {
  load(): FavoritePageRecord[] {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as FavoritePageRecord[];
    } catch {
      return [];
    }
  }

  save(favorites: FavoritePageRecord[]) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }
}
