"use client";

import { useAppStore } from "@/lib/store/useAppStore";

export default function Toast() {
  const toastMessage = useAppStore((s) => s.toastMessage);

  if (!toastMessage) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-white shadow-lg"
      role="status"
      aria-live="polite"
    >
      {toastMessage}
    </div>
  );
}
