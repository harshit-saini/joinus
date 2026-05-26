"use client";

import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const installDismissKey = "joinus:pwa-install-dismissed";

function isInstalled() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(navigatorWithStandalone.standalone);
}

function isIOS() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function PwaClient() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [hasNativePrompt, setHasNativePrompt] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (isInstalled() || localStorage.getItem(installDismissKey)) {
      return;
    }

    setIsIosDevice(isIOS());

    const fallbackTimer = window.setTimeout(() => {
      if (!isInstalled() && !localStorage.getItem(installDismissKey)) {
        setIsVisible(true);
      }
    }, 1800);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setHasNativePrompt(true);
      setIsVisible(true);
    };

    const handleInstalled = () => {
      setIsVisible(false);
      localStorage.setItem(installDismissKey, "installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const helperText = useMemo(() => {
    if (hasNativePrompt) {
      return "Install JoinUs for quick access to invitations and your dashboard.";
    }

    if (isIosDevice) {
      return "On iPhone or iPad, tap Share, then Add to Home Screen.";
    }

    return "Use your browser menu and choose Install app or Add to Dock.";
  }, [hasNativePrompt, isIosDevice]);

  async function handleInstall() {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    localStorage.setItem(installDismissKey, choice.outcome === "accepted" ? "installed" : new Date().toISOString());
    setIsVisible(false);
  }

  function dismiss() {
    localStorage.setItem(installDismissKey, new Date().toISOString());
    setIsVisible(false);
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-lg border border-stone-300 bg-[#fffaf2] p-4 text-stone-950 shadow-2xl">
      <div className="flex gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-teal-800 text-lg font-semibold text-white">
          J
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold">Install JoinUs</p>
          <p className="mt-1 text-sm leading-6 text-stone-600">{helperText}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:border-teal-700"
        >
          Not now
        </button>
        {installPrompt ? (
          <button
            type="button"
            onClick={handleInstall}
            className="rounded-md bg-teal-800 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-900"
          >
            Install
          </button>
        ) : (
          <button
            type="button"
            onClick={dismiss}
            className="rounded-md bg-stone-950 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-900"
          >
            Got it
          </button>
        )}
      </div>
    </div>
  );
}
