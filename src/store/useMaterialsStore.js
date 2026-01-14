import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Safe localStorage getter with error handling
const safeGetStorage = () => {
  try {
    return localStorage;
  } catch (e) {
    console.warn('localStorage not available:', e);
    return null;
  }
};

export const useMaterialsStore = create(
  persist(
    (set) => ({
      // Materials library (uploaded files)
      materialsLibrary: [],
      
      // Selected materials for current session
      selectedMaterials: [],
      
      // Actions
      addMaterial: (material) => {
        set((state) => ({
          materialsLibrary: [...state.materialsLibrary, material],
        }));
      },
      
      removeMaterial: (index) => {
        set((state) => ({
          materialsLibrary: state.materialsLibrary.filter((_, i) => i !== index),
        }));
      },
      
      setSelectedMaterials: (materials) => set({ selectedMaterials: materials }),
      
      clearSelectedMaterials: () => set({ selectedMaterials: [] }),
    }),
    {
      name: 'coach-copilot-materials',
      storage: createJSONStorage(() => {
        const storage = safeGetStorage();
        if (!storage) {
          // Return a mock storage if localStorage is not available
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return storage;
      }),
      partialize: (state) => {
        // Ensure we always return a valid object, never undefined or null
        if (!state || typeof state !== 'object') {
          return {
            materialsLibrary: [],
            selectedMaterials: [],
          };
        }
        return {
          materialsLibrary: Array.isArray(state.materialsLibrary) ? state.materialsLibrary : [],
          selectedMaterials: Array.isArray(state.selectedMaterials) ? state.selectedMaterials : [],
        };
      },
      // Add error handling for corrupted data
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Error rehydrating materials store:', error);
          // Clear corrupted data
          try {
            localStorage.removeItem('coach-copilot-materials');
          } catch (e) {
            console.warn('Failed to clear corrupted localStorage:', e);
          }
        }
        // Ensure state is always an object
        if (!state || typeof state !== 'object') {
          console.warn('Invalid state after rehydration, resetting to defaults');
        }
      },
    }
  )
);
