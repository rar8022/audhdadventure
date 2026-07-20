import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

/**
 * Supabase client for use in Client Components ("use client").
 * Safe to call repeatedly — @supabase/ssr manages a single underlying
 * instance per browser tab.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Derived from the function's actual return type rather than re-built from
// `SupabaseClient<Database>` directly. If npm ever resolves two separate
// copies of @supabase/supabase-js (one direct, one nested under
// @supabase/ssr), a hand-written `SupabaseClient<Database>` in another file
// can structurally mismatch this one and fail `tsc` — deriving via
// ReturnType sidesteps that entirely.
export type SupabaseBrowserClient = ReturnType<typeof createClient>;
