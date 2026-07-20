"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";
import Header from "@/components/Header";
import TabNav from "@/components/TabNav";
import Toast from "@/components/Toast";

export default function AppShell({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const loading = useAppStore((s) => s.loading);
  const currentUserId = useAppStore((s) => s.userId);
  const hydrate = useAppStore((s) => s.hydrate);

  useEffect(() => {
    if (currentUserId === userId) return;
    const supabase = createClient();
    hydrate(supabase, userId);
  }, [userId, currentUserId, hydrate]);

  if (loading) {
    return (
      <div className="mt-16 text-center text-sm text-muted">
        Loading your adventure…
      </div>
    );
  }

  return (
    <div>
      <Header />
      <TabNav />
      <main className="mt-4 space-y-4">{children}</main>
      <footer className="mt-10 text-center text-xs text-muted">
        This is a self-understanding tool, not a diagnostic or clinical
        instrument, and not a crisis service.
      </footer>
      <Toast />
    </div>
  );
}
