import { create } from "zustand";

interface CompanyModalState {
  isOpen: boolean;
  mode: "add" | "edit";
  openModal: (mode?: "add" | "edit") => void;
  closeModal: () => void;
}

export const useCompanyModalStore = create<CompanyModalState>((set) => ({
  isOpen: false,
  mode: "add",
  openModal: (mode = "add") => set({ isOpen: true, mode }),
  closeModal: () => set({ isOpen: false }),
}));
