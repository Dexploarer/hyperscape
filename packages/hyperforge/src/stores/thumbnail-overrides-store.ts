/**
 * Thumbnail Overrides Store
 * Zustand store for managing local thumbnail overrides for CDN assets
 * Persists overrides in localStorage
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// =============================================================================
// TYPES
// =============================================================================

type ThumbnailOverrides = Record<string, string>;

interface ThumbnailOverridesState {
  // Thumbnail overrides: assetId -> thumbnailUrl
  overrides: ThumbnailOverrides;
  
  // Actions
  setThumbnailOverride: (assetId: string, thumbnailUrl: string) => void;
  getThumbnailUrl: (assetId: string, originalUrl?: string) => string | undefined;
  hasOverride: (assetId: string) => boolean;
  removeOverride: (assetId: string) => void;
  clearOverrides: () => void;
  
  // Reset
  reset: () => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useThumbnailOverridesStore = create<ThumbnailOverridesState>()(
  devtools(
    persist(
      (set, get) => ({
        overrides: {},

        setThumbnailOverride: (assetId: string, thumbnailUrl: string) => {
          set((state) => ({
            overrides: {
              ...state.overrides,
              [assetId]: thumbnailUrl,
            },
          }));
        },

        getThumbnailUrl: (assetId: string, originalUrl?: string) => {
          const overrides = get().overrides;
          return overrides[assetId] || originalUrl;
        },

        hasOverride: (assetId: string) => {
          return assetId in get().overrides;
        },

        removeOverride: (assetId: string) => {
          set((state) => {
            const { [assetId]: _, ...rest } = state.overrides;
            return { overrides: rest };
          });
        },

        clearOverrides: () => {
          set({ overrides: {} });
        },

        reset: () => {
          set({ overrides: {} });
        },
      }),
      {
        name: "hyperforge-thumbnail-overrides",
      },
    ),
    { name: "ThumbnailOverridesStore" },
  ),
);

// =============================================================================
// HELPER HOOKS
// =============================================================================

/**
 * Hook for accessing thumbnail overrides (maintains compatibility with old hook API)
 */
export function useThumbnailOverrides() {
  const overrides = useThumbnailOverridesStore((state) => state.overrides);
  const setThumbnailOverride = useThumbnailOverridesStore(
    (state) => state.setThumbnailOverride,
  );
  const getThumbnailUrl = useThumbnailOverridesStore(
    (state) => state.getThumbnailUrl,
  );
  const hasOverride = useThumbnailOverridesStore((state) => state.hasOverride);
  const removeOverride = useThumbnailOverridesStore(
    (state) => state.removeOverride,
  );
  const clearOverrides = useThumbnailOverridesStore(
    (state) => state.clearOverrides,
  );
  const loaded = true; // Zustand persist handles loading automatically

  return {
    overrides,
    loaded,
    setThumbnailOverride,
    getThumbnailUrl,
    hasOverride,
    removeOverride,
    clearOverrides,
  };
}
