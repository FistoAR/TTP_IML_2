import React, { createContext, useContext, useState, useCallback, useRef } from "react";

// ─── Context ──────────────────────────────────────────────
const ToastContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timerRefs = useRef({});

  const removeToast = useCallback((id) => {
    // Clear any existing timer
    if (timerRefs.current[id]) {
      clearTimeout(timerRefs.current[id]);
      delete timerRefs.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = "success", duration = 3000) => {
      const id = Date.now() + Math.random();

      setToasts((prev) => [...prev, { id, message, type }]);

      // Auto-dismiss
      if (duration > 0) {
        timerRefs.current[id] = setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id; // return id in case caller wants to dismiss manually
    },
    [removeToast]
  );

  // ─── Shorthand helpers ──────────────────────────────────
  const success = useCallback(
    (msg, duration) => addToast(msg, "success", duration),
    [addToast]
  );

  const error = useCallback(
    (msg, duration) => addToast(msg, "error", duration),
    [addToast]
  );

  const info = useCallback(
    (msg, duration) => addToast(msg, "info", duration),
    [addToast]
  );

  const warning = useCallback(
    (msg, duration) => addToast(msg, "warning", duration),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ addToast, removeToast, success, error, info, warning }}
    >
      {children}

      {/* ─── Toast Container (renders ALL active toasts) ─── */}
      <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast, index) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            index={index}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Single Toast Item ────────────────────────────────────
function ToastItem({ toast, index, onClose }) {
  const { id, message, type } = toast;

  // ── Colour map ──────────────────────────────────────────
  const colorMap = {
    success: {
      border: "border-green-500",
      icon: "text-green-500",
      bg: "bg-green-50",
    },
    error: {
      border: "border-red-500",
      icon: "text-red-500",
      bg: "bg-red-50",
    },
    info: {
      border: "border-blue-500",
      icon: "text-blue-500",
      bg: "bg-blue-50",
    },
    warning: {
      border: "border-amber-500",
      icon: "text-amber-500",
      bg: "bg-amber-50",
    },
  };

  const colors = colorMap[type] || colorMap.info;

  // ── Icon per type ───────────────────────────────────────
  const icons = {
    success: (
      <svg className="w-[1.25vw] h-[1.25vw]" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        />
      </svg>
    ),
    error: (
      <svg className="w-[1.25vw] h-[1.25vw]" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        />
      </svg>
    ),
    info: (
      <svg className="w-[1.25vw] h-[1.25vw]" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        />
      </svg>
    ),
    warning: (
      <svg className="w-[1.25vw] h-[1.25vw]" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        />
      </svg>
    ),
  };

  return (
    <div
      className={`pointer-events-auto bg-white border-[0.18vw] ${colors.border} p-4 pr-10 rounded-lg shadow-2xl max-w-md min-w-[20vw] relative animate-slide-in`}
      style={{
        animation: "slideIn 0.3s ease-out forwards",
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 mt-[0.05vw] ${colors.icon}`}>
          {icons[type] || icons.info}
        </div>

        {/* Message */}
        <p className="text-[0.8vw] font-medium flex-1 text-gray-800 leading-snug">
          {message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-[0.5vw] right-[0.5vw] w-[1.4vw] h-[1.4vw] flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all cursor-pointer text-[1vw] font-bold leading-none"
        title="Close"
      >
        ×
      </button>
    </div>
  );
}

// ─── Custom Hook ──────────────────────────────────────────
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return context;
}