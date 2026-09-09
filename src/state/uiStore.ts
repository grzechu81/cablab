/**
 * Transient UI state — which cabinet is selected, which modal is open. This is
 * deliberately separate from `useProjectStore`: none of it belongs in the save
 * file (`docs/01-architecture.md` — the project store holds raw `Project` only).
 */

import { create } from 'zustand'

export type ModalId = 'settings' | 'cutList'

interface UiStore {
  selectedCabinetId: string | null
  activeModal: ModalId | null

  select: (id: string | null) => void
  openModal: (modal: ModalId) => void
  closeModal: () => void
}

export const useUiStore = create<UiStore>()((set) => ({
  selectedCabinetId: null,
  activeModal: null,

  select: (id) => set({ selectedCabinetId: id }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
}))
