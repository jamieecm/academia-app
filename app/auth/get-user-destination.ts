
import { createClient } from "@/src/lib/supabase/server";

export async function getUserDestination() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return "/";
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

  if (profileError || !profile) {
    return "/onboarding";
  }

  return profile.onboarding_completed
    ? "/dashboard"
    : "/onboarding";
}
