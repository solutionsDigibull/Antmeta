"use client";

import { ReactNode } from "react";
import { Icon } from "@/components/icons";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, children, width = 540 }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 backdrop-blur-[4px]" onClick={onClose}>
      <div
        className="bg-am-login-card-bg border border-am-border-strong rounded-[14px] w-full max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,.3)]"
        style={{ maxWidth: width, borderTop: "3px solid var(--am-primary)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-am-border-faint">
          <div className="font-poppins text-[18px] font-bold text-am-text">{title}</div>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center text-am-text-3 hover:text-am-text cursor-pointer">
            <Icon name="close" size={14} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
