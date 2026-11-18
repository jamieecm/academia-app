import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { getUserDestination } from "../get-user-destination";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();

    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Resolve and compare origins so backslash-based external URLs are rejected too.
      let safeNext: string | null = null;
      if (next && next.startsWith("/") && !next.startsWith("//")) {
        try {
          const candidate = new URL(next, origin);
          if (candidate.origin === origin) {
            safeNext = `${candidate.pathname}${candidate.search}${candidate.hash}`;
          }
        } catch {
          safeNext = null;
        }
      }

      const destination =
        safeNext ?? await getUserDestination();

      return NextResponse.redirect(
        new URL(destination, origin)
      );
    }
  }

  return NextResponse.redirect(
    new URL("/?error=auth_callback", origin)
  );
}
