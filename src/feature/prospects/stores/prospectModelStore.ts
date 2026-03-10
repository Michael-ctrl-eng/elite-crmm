import { create } from "zustand";

interface ProspectModelState {
  isOpen: boolean;
  mode: "add" | "edit";
  openModal: (mode?: "add" | "edit") => void;
  closeModal: () => void;
}

export const useProspectModelStore = create<ProspectModelState>((set) => ({
  isOpen: false,
  mode: "add",
  openModal: (mode = "add") => set({ isOpen: true, mode }),
  closeModal: () => set({ isOpen: false }),
}));
