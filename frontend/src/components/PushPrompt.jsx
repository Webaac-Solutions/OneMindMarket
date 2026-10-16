"use client";

import { useEffect, useRef, useState } from "react";
import OneSignal from "react-onesignal";
import { FiBell, FiX } from "react-icons/fi";
import "@/styles/Notifications.css";

const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const DISMISS_KEY = "omm_push_dismissed";
const OPT_OUT_KEY = "omm_push_opt_out";
const SHOW_AFTER_MS = 10000;
const REOPEN_AFTER_MS = 5 * 60 * 1000;
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

let initPromise;
// Init the SDK once per page load
export function initOneSignal() {
  if (!initPromise)
    initPromise = OneSignal.init({
      appId: APP_ID,
      allowLocalhostAsSecureOrigin: true,
    });
  return initPromise;
}

const listeners = new Set();
export const onPushChange = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const notify = () => listeners.forEach((fn) => fn());
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function enablePush() {
  try {
    await initOneSignal();
  } catch (err) {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    )
      await Notification.requestPermission();
    throw err;
  }
  try {
    localStorage.removeItem(OPT_OUT_KEY);
  } catch {}
  if (Notification.permission === "default")
    await OneSignal.Notifications.requestPermission();
  if (Notification.permission === "granted")
    await OneSignal.User.PushSubscription.optIn();
  for (let i = 0; i < 10 && !OneSignal.User.PushSubscription.optedIn; i++)
    await wait(300);
  notify();
  if (!OneSignal.User.PushSubscription.optedIn)
    throw new Error("Push subscription was not created");
}

export async function disablePush() {
  await initOneSignal();
  try {
    localStorage.setItem(OPT_OUT_KEY, "1");
  } catch {}
  await OneSignal.User.PushSubscription.optOut();
  notify();
}

const recentlyDismissed = () => {
  try {
    return (
      Date.now() - Number(localStorage.getItem(DISMISS_KEY) || 0) < COOLDOWN_MS
    );
  } catch {
    return false;
  }
};

const PushPrompt = () => {
  const [show, setShow] = useState(false);
  const timer = useRef(null);

  const shouldAsk = () => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission !== "default"
    )
      return false;
    if (recentlyDismissed()) return false;
    try {
      if (OneSignal.User.PushSubscription.optedIn) return false;
    } catch {}
    return true;
  };

  const schedule = (ms) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (shouldAsk()) setShow(true);
    }, ms);
  };

  useEffect(() => {
    if (!APP_ID) return;
    let cancelled = false;

    schedule(SHOW_AFTER_MS);

    initOneSignal()
      .then(() => {
        if (cancelled || !OneSignal.Notifications.isPushSupported()) return;
        if (Notification.permission !== "granted") return;
        let optedOut = false;
        try {
          optedOut = localStorage.getItem(OPT_OUT_KEY) === "1";
        } catch {}
        if (!optedOut && !OneSignal.User.PushSubscription.optedIn) {
          OneSignal.User.PushSubscription.optIn()
            .then(notify)
            .catch((err) => console.error("Push opt-in failed:", err));
        }
      })
      .catch((err) => console.error("OneSignal init failed:", err));

    const off = onPushChange(() => {
      try {
        if (OneSignal.User.PushSubscription.optedIn) {
          clearTimeout(timer.current);
          setShow(false);
        }
      } catch {}
    });

    return () => {
      cancelled = true;
      clearTimeout(timer.current);
      off();
    };
  }, []);

  const allow = async () => {
    setShow(false);
    try {
      await enablePush();
    } catch (err) {
      console.error("Push permission failed:", err);
    }
    if (
      typeof Notification === "undefined" ||
      Notification.permission === "default"
    )
      schedule(REOPEN_AFTER_MS);
  };

  const notNow = () => {
    setShow(false);
    clearTimeout(timer.current);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  };

  const close = () => {
    setShow(false);
    schedule(REOPEN_AFTER_MS);
  };

  if (!show) return null;

  return (
    <div
      className="push-prompt"
      role="dialog"
      aria-label="Enable notifications"
    >
      <span className="push-prompt-icon">
        <FiBell size={20} />
      </span>
      <div className="push-prompt-body">
        <strong>Stay updated</strong>
        <p>Get notified about new announcements and offers.</p>
        <div className="push-prompt-actions">
          <button type="button" className="push-prompt-allow" onClick={allow}>
            Allow
          </button>
          <button type="button" className="push-prompt-later" onClick={notNow}>
            Not now
          </button>
        </div>
      </div>
      <button
        type="button"
        className="push-prompt-close"
        onClick={close}
        aria-label="Close"
      >
        <FiX size={16} />
      </button>
    </div>
  );
};

export default PushPrompt;
