import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import PlayerCard, {
  type PlayerPosition,
  type PlayerStats,
  type CardRarity,
} from "@/src/components/player/player-card";
import { signOut } from "@/app/auth/actions";

// Permite rutas bloqueantes con connection() en Next.js 16
export const instant = false;

export default async function DashboardPage() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("nickname, position, avatar_url, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const { data: stats, error: statsError } = await supabase
    .from("player_stats")
    .select("*")
    .eq("player_id", user.id)
    .single();

  if (statsError || !stats) {
    throw new Error("No fue posible cargar las estadísticas del jugador.");
  }

  const playerStats: PlayerStats = {
    overall: stats.overall,
    pace: stats.pace,
    shooting: stats.shooting,
    passing: stats.passing,
    dribbling: stats.dribbling,
    defending: stats.defending,
    physical: stats.physical,
  };

  return (
    <main className="min-h-screen bg-[#090D09] px-5 py-10 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <img
            src="/escudo-academia.png"
            alt="Academia Fútbol AF"
            className="h-12 w-12 rounded-full bg-white"
          />
          <div>
            <h1 className="font-black uppercase">Academia Fútbol</h1>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#36D414]">
              PLAYER PLATFORM
            </p>
          </div>
        </div>

        <form action={signOut}>
          <button className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-[#36D414] hover:text-[#36D414]">
            Cerrar sesión
          </button>
        </form>
      </header>

      <section className="mx-auto max-w-6xl py-12">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#36D414]">
            PANEL DEL JUGADOR
          </p>
          <h2 className="mt-3 text-3xl font-black uppercase sm:text-4xl">
            HOLA, {profile.nickname}
          </h2>
          <p className="mt-3 text-gray-400">
            Bienvenido a tu espacio personal en Academia Fútbol AF.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[340px_1fr]">
          <div>
            <PlayerCard
              nickname={profile.nickname ?? "JUGADOR"}
              position={profile.position as PlayerPosition}
              avatarUrl={profile.avatar_url ?? ""}
              stats={playerStats}
              rarity={stats.rarity as CardRarity}
            />
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-[#111711] p-6">
              <p className="text-xs font-bold tracking-[0.2em] text-[#36D414]">
                TU PRIMERA CARTA
              </p>
              <h3 className="mt-3 text-xl font-black uppercase">
                Tu historia comienza aquí.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">
                Tu perfil ya está creado. A medida que registremos tus partidos y
                rendimiento, podremos actualizar tus estadísticas y evolución
                futbolística.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-[#111711] p-5">
                <p className="text-xs text-gray-500">VALORACIÓN</p>
                <p className="mt-2 text-3xl font-black text-[#36D414]">
                  {stats.overall}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#111711] p-5">
                <p className="text-xs text-gray-500">POSICIÓN</p>
                <p className="mt-2 text-3xl font-black">{profile.position}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}