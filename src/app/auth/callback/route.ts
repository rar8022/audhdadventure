import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Discord OAuth (and any future provider) redirects here with a `code`
// param per Supabase's PKCE flow. Exchanging it sets the session cookie,
// then we send the user on into the app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`);
}
