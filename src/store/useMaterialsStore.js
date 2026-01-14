import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
      storage: createJSONStorage(() => localStorage),
    }
  )
);
