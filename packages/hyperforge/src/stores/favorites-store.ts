/**
 * Favorites Store
 * Zustand store for managing favorite assets with localStorage persistence
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// =============================================================================
// TYPES
// =============================================================================

interface FavoritesState {
  // Favorites stored as Set for O(1) lookups
  favorites: Set<string>;
  
  // Actions
  isFavorite: (assetId: string) => boolean;
  toggleFavorite: (assetId: string) => void;
  addFavorite: (assetId: string) => void;
  removeFavorite: (assetId: string) => void;
  
  // Computed getters
  getFavoritesCount: () => number;
  getFavoritesArray: () => string[];
  
  // Reset
  clearFavorites: () => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useFavoritesStore = create<FavoritesState>()(
  devtools(
    persist(
      (set, get) => ({
        favorites: new Set<string>(),

        isFavorite: (assetId: string) => {
          return get().favorites.has(assetId);
        },

        toggleFavorite: (assetId: string) => {
          set((state) => {
            const next = new Set(state.favorites);
            if (next.has(assetId)) {
              next.delete(assetId);
            } else {
              next.add(assetId);
            }
            return { favorites: next };
          });
        },

        addFavorite: (assetId: string) => {
          set((state) => ({
            favorites: new Set([...state.favorites, assetId]),
          }));
        },

        removeFavorite: (assetId: string) => {
          set((state) => {
            const next = new Set(state.favorites);
            next.delete(assetId);
            return { favorites: next };
          });
        },

        clearFavorites: () => {
          set({ favorites: new Set() });
        },

        getFavoritesCount: () => {
          return get().favorites.size;
        },

        getFavoritesArray: () => {
          return Array.from(get().favorites);
        },
      }),
      {
        name: "hyperforge-favorites",
        // Convert Set to/from Array for localStorage
        partialize: (state) => ({
          favorites: Array.from(state.favorites),
        }),
        merge: (persistedState, currentState) => {
          const persisted = persistedState as { favorites?: string[] };
          return {
            ...currentState,
            favorites: persisted.favorites
              ? new Set(persisted.favorites)
              : new Set(),
          };
        },
      },
    ),
    { name: "FavoritesStore" },
  ),
);

// =============================================================================
// HELPER HOOKS
// =============================================================================

/**
 * Hook for accessing favorites (maintains compatibility with old hook API)
 */
export function useFavorites() {
  const favorites = useFavoritesStore((state) => state.favorites);
  const isFavorite = useFavoritesStore((state) => state.isFavorite);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const addFavorite = useFavoritesStore((state) => state.addFavorite);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const getFavoritesCount = useFavoritesStore((state) => state.getFavoritesCount);
  const getFavoritesArray = useFavoritesStore((state) => state.getFavoritesArray);
  const isLoaded = true; // Zustand persist handles loading automatically

  // Compute values for backward compatibility
  const favoritesCount = getFavoritesCount();
  const favoritesArray = getFavoritesArray();

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    favoritesCount,
    favoritesArray,
    isLoaded,
  };
}
