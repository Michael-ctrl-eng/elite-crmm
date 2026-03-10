import { create } from "zustand";

interface CustomerModalState {
  isOpen: boolean;
  mode: "add" | "edit";
  openModal: (mode?: "add" | "edit") => void;
  closeModal: () => void;
}

export const useCustomerModalStore = create<CustomerModalState>((set) => ({
  isOpen: false,
  mode: "add",
  openModal: (mode = "add") => set({ isOpen: true, mode }),
  closeModal: () => set({ isOpen: false }),
}));
