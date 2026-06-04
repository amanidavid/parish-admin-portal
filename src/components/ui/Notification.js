'use client';
import useUiStore from '@/store/uiStore';

const TYPE_STYLES = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export default function Notification() {
  const notification = useUiStore((state) => state.notification);

  if (!notification) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[90] flex justify-center">
      <div
        className={`pointer-events-auto rounded-xl border px-5 py-3 text-sm font-medium shadow-lg transition-opacity ${TYPE_STYLES[notification.type] || TYPE_STYLES.info}`}
        role="alert"
      >
        {notification.message}
      </div>
    </div>
  );
}
