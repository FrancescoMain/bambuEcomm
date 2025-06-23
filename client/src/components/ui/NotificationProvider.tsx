"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Toast } from "./Toast";
import { ConfirmModal } from "./ConfirmModal";

interface NotificationContextType {
  showToast: (message: string, type: "success" | "error" | "warning" | "info") => void;
  showConfirm: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: "danger" | "primary" | "warning";
    onConfirm: () => void;
  }) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};

interface ToastState {
  id: number;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  confirmVariant: "danger" | "primary" | "warning";
  onConfirm: () => void;
}

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Conferma",
    cancelText: "Annulla",
    confirmVariant: "primary",
    onConfirm: () => {},
  });

  const showToast = (message: string, type: "success" | "error" | "warning" | "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showConfirm = (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: "danger" | "primary" | "warning";
    onConfirm: () => void;
  }) => {
    setConfirm({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || "Conferma",
      cancelText: options.cancelText || "Annulla",
      confirmVariant: options.confirmVariant || "primary",
      onConfirm: options.onConfirm,
    });
  };

  const handleConfirm = () => {
    confirm.onConfirm();
    setConfirm((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    setConfirm((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm }}>
      {children}
      
      {/* Render Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Render Confirm Modal */}
      <ConfirmModal
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        confirmVariant={confirm.confirmVariant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </NotificationContext.Provider>
  );
};
