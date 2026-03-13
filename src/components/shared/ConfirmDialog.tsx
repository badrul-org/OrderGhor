import { useTranslation } from '../../i18n';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  danger?: boolean;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmText, danger }: ConfirmDialogProps) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn" onClick={onCancel}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl bg-gray-100 text-sm font-semibold text-gray-700 hover:bg-gray-200 active:bg-gray-200 transition-colors"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-11 rounded-xl text-sm font-bold text-white active:opacity-90 transition-all ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'gradient-primary hover:shadow-md'
            }`}
          >
            {confirmText || t.common.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
