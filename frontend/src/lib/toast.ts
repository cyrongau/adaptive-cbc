import toast, { ToastOptions } from 'react-hot-toast';

const baseOptions: ToastOptions = {
  duration: 4000,
  style: {
    borderRadius: '12px',
    background: '#fff',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    padding: '0',
    minWidth: '320px',
    fontSize: '14px',
    fontWeight: '600',
  },
};

const iconBase = {
  style: { fontSize: '18px' },
};

export const appToast = {
  success: (message: string, options?: ToastOptions) =>
    toast.success(message, {
      ...baseOptions,
      ...options,
      iconTheme: { primary: '#006a34', secondary: '#fff' },
    }),

  error: (message: string, options?: ToastOptions) =>
    toast.error(message, {
      ...baseOptions,
      ...options,
      iconTheme: { primary: '#ef4444', secondary: '#fff' },
      duration: 6000,
    }),

  loading: (message: string, options?: ToastOptions) =>
    toast.loading(message, {
      ...baseOptions,
      ...options,
    }),

  dismiss: (toastId?: string) => toast.dismiss(toastId),
};
