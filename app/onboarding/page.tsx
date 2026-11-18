import { connection } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingWizard from "@/src/components/player/onboarding-wizard";

export const instant = false;

export default async function OnboardingPage() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/");
  }

  // Obtener datos iniciales si ya existen en el perfil
  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, position, avatar_url, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) {
    redirect("/dashboard");
  }

  return (
    <OnboardingWizard
      initialNickname={profile?.nickname || ""}
      initialPosition={profile?.position || ""}
      initialAvatar={profile?.avatar_url || ""}
    />
  );
}