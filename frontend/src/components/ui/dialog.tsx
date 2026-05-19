'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Dialog({ isOpen, onClose, title, description, children, actions, size = 'md' }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-2xl overflow-hidden`}
          >
            {(title || description) && (
              <div className="px-6 pt-6 pb-4">
                {title && <h3 className="text-lg font-bold text-gray-900">{title}</h3>}
                {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
              </div>
            )}
            {children && <div className="px-6 pb-4">{children}</div>}
            {actions && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                {actions}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger' | 'warning';
  loading?: boolean;
}

const variantConfig: Record<string, { icon: React.ReactNode; confirmClass: string; iconBg: string }> = {
  default: {
    icon: <Info className="w-6 h-6 text-blue-600" />,
    confirmClass: 'bg-primary hover:bg-primary/90 text-white',
    iconBg: 'bg-blue-50',
  },
  danger: {
    icon: <AlertCircle className="w-6 h-6 text-red-600" />,
    confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
    iconBg: 'bg-red-50',
  },
  warning: {
    icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
    confirmClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    iconBg: 'bg-amber-50',
  },
};

export function ConfirmDialog({
  isOpen, onClose, onConfirm, title, description,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'default', loading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];

  return (
    <Dialog isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0`}>
          {config.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 ${config.confirmClass}`}
        >
          {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  actionLabel?: string;
  onAction?: () => void;
}

const alertVariantConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  info: {
    icon: <Info className="w-6 h-6" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  success: {
    icon: <CheckCircle className="w-6 h-6" />,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  warning: {
    icon: <AlertTriangle className="w-6 h-6" />,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  error: {
    icon: <AlertCircle className="w-6 h-6" />,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
};

export function AlertModal({
  isOpen, onClose, title, message, variant = 'info', actionLabel, onAction,
}: AlertModalProps) {
  const config = alertVariantConfig[variant];

  return (
    <Dialog isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div className={`w-16 h-16 rounded-2xl ${config.bg} flex items-center justify-center mx-auto mb-4 ${config.color}`}>
          {config.icon}
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">{message}</p>
      </div>
      <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-gray-100">
        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all active:scale-95 ${config.bg} ${config.color} border ${config.border}`}
          >
            {actionLabel}
          </button>
        )}
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all active:scale-95"
        >
          {actionLabel ? 'Close' : 'OK'}
        </button>
      </div>
    </Dialog>
  );
}
