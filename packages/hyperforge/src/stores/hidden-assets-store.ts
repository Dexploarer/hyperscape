/**
 * Hidden Assets Store
 * Zustand store for managing hidden assets with localStorage persistence
 * Used to hide CDN assets from the UI without deleting them
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// =============================================================================
// TYPES
// =============================================================================

interface HiddenAssetsState {
  // Hidden assets stored as Set for O(1) lookups
  hiddenAssets: Set<string>;
  
  // Actions
  isHidden: (assetId: string) => boolean;
  hideAsset: (assetId: string) => void;
  unhideAsset: (assetId: string) => void;
  toggleHidden: (assetId: string) => void;
  hideMultiple: (assetIds: string[]) => void;
  clearAllHidden: () => void;
  
  // Computed getters
  getHiddenCount: () => number;
  getHiddenAssetIds: () => string[];
  
  // Reset
  reset: () => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useHiddenAssetsStore = create<HiddenAssetsState>()(
  devtools(
    persist(
      (set, get) => ({
        hiddenAssets: new Set<string>(),

        isHidden: (assetId: string) => {
          return get().hiddenAssets.has(assetId);
        },

        hideAsset: (assetId: string) => {
          set((state) => ({
            hiddenAssets: new Set([...state.hiddenAssets, assetId]),
          }));
        },

        unhideAsset: (assetId: string) => {
          set((state) => {
            const next = new Set(state.hiddenAssets);
            next.delete(assetId);
            return { hiddenAssets: next };
          });
        },

        toggleHidden: (assetId: string) => {
          set((state) => {
            const next = new Set(state.hiddenAssets);
            if (next.has(assetId)) {
              next.delete(assetId);
            } else {
              next.add(assetId);
            }
            return { hiddenAssets: next };
          });
        },

        hideMultiple: (assetIds: string[]) => {
          set((state) => ({
            hiddenAssets: new Set([...state.hiddenAssets, ...assetIds]),
          }));
        },

        clearAllHidden: () => {
          set({ hiddenAssets: new Set() });
        },

        getHiddenCount: () => {
          return get().hiddenAssets.size;
        },

        getHiddenAssetIds: () => {
          return Array.from(get().hiddenAssets);
        },

        reset: () => {
          set({ hiddenAssets: new Set() });
        },
      }),
      {
        name: "hyperforge-hidden-assets",
        // Convert Set to/from Array for localStorage
        partialize: (state) => ({
          hiddenAssets: Array.from(state.hiddenAssets),
        }),
        merge: (persistedState, currentState) => {
          const persisted = persistedState as { hiddenAssets?: string[] };
          return {
            ...currentState,
            hiddenAssets: persisted.hiddenAssets
              ? new Set(persisted.hiddenAssets)
              : new Set(),
          };
        },
      },
    ),
    { name: "HiddenAssetsStore" },
  ),
);

// =============================================================================
// HELPER HOOKS
// =============================================================================

/**
 * Hook for accessing hidden assets (maintains compatibility with old hook API)
 */
export function useHiddenAssets() {
  const hiddenAssets = useHiddenAssetsStore((state) => state.hiddenAssets);
  const isHidden = useHiddenAssetsStore((state) => state.isHidden);
  const hideAsset = useHiddenAssetsStore((state) => state.hideAsset);
  const unhideAsset = useHiddenAssetsStore((state) => state.unhideAsset);
  const toggleHidden = useHiddenAssetsStore((state) => state.toggleHidden);
  const hideMultiple = useHiddenAssetsStore((state) => state.hideMultiple);
  const clearAllHidden = useHiddenAssetsStore((state) => state.clearAllHidden);
  const getHiddenCount = useHiddenAssetsStore((state) => state.getHiddenCount);
  const getHiddenAssetIds = useHiddenAssetsStore((state) => state.getHiddenAssetIds);
  const isLoaded = true; // Zustand persist handles loading automatically

  // Compute values for backward compatibility
  const hiddenCount = getHiddenCount();
  const hiddenAssetIds = getHiddenAssetIds();

  return {
    hiddenAssets,
    hiddenAssetIds,
    isHidden,
    hideAsset,
    unhideAsset,
    toggleHidden,
    clearAllHidden,
    hideMultiple,
    hiddenCount,
    isLoaded,
  };
}
