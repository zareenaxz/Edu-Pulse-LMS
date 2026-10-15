import React from 'react';
import { AlertTriangle, Trash2, HelpCircle, CheckCircle2, X } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed with this action?", 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  type = "danger", // 'danger' | 'warning' | 'info' | 'success'
  onConfirm, 
  onClose 
}) {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: Trash2,
      iconBg: "bg-rose-50 text-rose-600",
      btnClass: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20"
    },
    warning: {
      icon: AlertTriangle,
      iconBg: "bg-amber-50 text-amber-600",
      btnClass: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20"
    },
    info: {
      icon: HelpCircle,
      iconBg: "bg-brand-50 text-brand-600",
      btnClass: "bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20"
    },
    success: {
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 text-emerald-600",
      btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
    }
  };

  const currentTheme = typeConfig[type] || typeConfig.danger;
  const Icon = currentTheme.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${currentTheme.iconBg}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">{title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{message}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-sm transition ${currentTheme.btnClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}