"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FiCheck, FiInfo, FiX } from "react-icons/fi";

const ToastContext = createContext(null);

let idCounter = 0;

const noop = () => {};
const fallbackApi = { show: noop, success: noop, error: noop, info: noop };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const show = useCallback(
    (message, type = "info", duration = 3500) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      show,
      success: (msg, duration) => show(msg, "success", duration),
      error: (msg, duration) => show(msg, "error", duration ?? 5000),
      info: (msg, duration) => show(msg, "info", duration),
    }),
    [show],
  );

  useEffect(() => {
    const goOffline = () =>
      show("You are offline. Please check your connection.", "error", 6000);
    const goOnline = () => show("You are back online.", "success");
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    const pending = timers.current;
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      Object.values(pending).forEach(clearTimeout);
    };
  }, [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-item toast-item--${t.type}`}
            role={t.type === "error" ? "alert" : "status"}
          >
            <span className="toast-item-icon" aria-hidden="true">
              {t.type === "success" ? (
                <FiCheck size={13} />
              ) : t.type === "error" ? (
                <FiX size={13} />
              ) : (
                <FiInfo size={13} />
              )}
            </span>
            <span className="toast-item-message">{t.message}</span>
            <button
              type="button"
              className="toast-item-close"
              aria-label="Dismiss message"
              onClick={() => dismiss(t.id)}
            >
              <FiX size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext) || fallbackApi;
}
