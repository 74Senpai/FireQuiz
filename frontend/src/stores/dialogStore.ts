import { create } from 'zustand';

type DialogType = 'alert' | 'confirm';

interface DialogOptions {
  title: string;
  description?: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface DialogState {
  isOpen: boolean;
  options: DialogOptions | null;
  showDialog: (options: DialogOptions) => void;
  closeDialog: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  isOpen: false,
  options: null,
  showDialog: (options) => {
    set({ 
      isOpen: true, 
      options: { 
        type: 'alert', 
        confirmText: 'Xác nhận', 
        cancelText: 'Hủy', 
        ...options 
      } 
    });
  },
  closeDialog: () => set({ isOpen: false, options: null }),
}));
