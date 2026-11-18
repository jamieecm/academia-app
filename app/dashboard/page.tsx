import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Activity, ArrowUpRight, Award, LogOut, Target } from "lucide-react";

import { signOut } from "@/app/auth/actions";
import PlayerCard, { type PlayerStats } from "@/src/components/player/player-card";
import {
  calculatePlayerRating,
  getPlayerPositionName,
  isPlayerPosition,
  type PlayerAttributes,
} from "@/src/lib/player/rating";
import { createClient } from "@/src/lib/supabase/server";

export const instant = false;

const attributeInfo: Record<keyof PlayerAttributes, { label: string; short: string }> = {
  pace: { label: "Ritmo", short: "PAC" },
  shooting: { label: "Tiro", short: "SHO" },
  passing: { label: "Pase", short: "PAS" },
  dribbling: { label: "Regate", short: "DRI" },
  defending: { label: "Defensa", short: "DEF" },
  physical: { label: "Físico", short: "PHY" },
};

const rarityLabels = {
  BRONZE: "Bronce",
  SILVER: "Plata",
  GOLD: "Oro",
} as const;

const rarityColors = {
  BRONZE: "text-[#e7ad83] bg-[#e7ad83]/10 border-[#e7ad83]/20",
  SILVER: "text-[#d5e1e8] bg-[#d5e1e8]/10 border-[#d5e1e8]/20",
  GOLD: "text-[#f4d27d] bg-[#f4d27d]/10 border-[#f4d27d]/20",
} as const;

export default async function DashboardPage() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/");

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
    .select("pace, shooting, passing, dribbling, defending, physical")
    .eq("player_id", user.id)
    .single();

  if (statsError || !stats) {
    throw new Error("No fue posible cargar las estadísticas del jugador.");
  }

  const position = profile.position;
  if (typeof position !== "string" || !isPlayerPosition(position)) {
    throw new Error("La posición guardada del jugador no es válida.");
  }

  const attributes: PlayerAttributes = {
    pace: stats.pace,
    shooting: stats.shooting,
    passing: stats.passing,
    dribbling: stats.dribbling,
    defending: stats.defending,
    physical: stats.physical,
  };
  const rating = calculatePlayerRating(position, attributes);
  const playerStats: PlayerStats = {
    ...rating.attributes,
    overall: rating.overall,
  };

  const rankedAttributes = (Object.keys(attributeInfo) as (keyof PlayerAttributes)[])
    .map((key) => ({ key, ...attributeInfo[key], value: attributes[key] }))
    .sort((a, b) => b.value - a.value);
  const strongestAttribute = rankedAttributes[0];
  const growthAttribute = rankedAttributes[rankedAttributes.length - 1];

  const nextTier =
    rating.overall < 65
      ? { label: "Plata", threshold: 65 }
      : rating.overall < 75
        ? { label: "Oro", threshold: 75 }
        : null;
  const tierProgress = nextTier
    ? rating.overall < 65
      ? Math.round((rating.overall / 65) * 100)
      : Math.round(((rating.overall - 65) / (75 - 65)) * 100)
    : 100;

  const nickname = profile.nickname?.trim() || "Jugador";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080c09] px-4 py-5 text-white sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute -left-48 top-40 h-[420px] w-[420px] rounded-full bg-[#36d414]/[0.07] blur-[140px]" />
      <div className="pointer-events-none absolute -right-48 top-[620px] h-[460px] w-[460px] rounded-full bg-emerald-400/[0.04] blur-[150px]" />

      <header className="relative mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 backdrop-blur sm:px-5">
        <div className="flex items-center gap-3">
          <img
            src="/escudo-academia.png"
            alt="Academia Fútbol AF"
            className="h-11 w-11 rounded-full bg-white p-0.5"
          />
          <div>
            <p className="text-sm font-black uppercase tracking-wide">Academia Fútbol</p>
            <p className="mt-0.5 text-[9px] font-bold tracking-[0.24em] text-[#70e65c]">
              PLAYER PLATFORM
            </p>
          </div>
        </div>

        <form action={signOut}>
          <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-semibold text-gray-300 transition hover:border-white/25 hover:bg-white/5 hover:text-white sm:px-4 sm:text-sm">
            <LogOut size={15} />
            <span className="hidden sm:inline">Cerrar sesión</span>
            <span className="sm:hidden">Salir</span>
          </button>
        </form>
      </header>

      <div className="relative mx-auto max-w-7xl pb-10 pt-9 sm:pt-12">
        <section className="mb-8 flex flex-col justify-between gap-6 border-b border-white/[0.08] pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#36d414]/20 bg-[#36d414]/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8af276]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#36d414] shadow-[0_0_10px_#36d414]" />
              Área personal del jugador
            </div>
            <p className="text-sm font-medium text-gray-400">Bienvenido de nuevo,</p>
            <h1 className="mt-1 text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl">
              {nickname}<span className="text-[#36d414]">.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
              Tu perfil futbolístico, valoración y atributos principales en un solo lugar.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-semibold text-gray-200">
              <Target size={14} className="text-[#76e663]" />
              {getPlayerPositionName(position)}
            </span>
            <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${rarityColors[rating.rarity]}`}>
              <Award size={14} />
              Carta {rarityLabels[rating.rarity]}
            </span>
          </div>
        </section>

        <div className="grid items-start gap-7 xl:grid-cols-[350px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <PlayerCard
              nickname={nickname}
              position={position}
              avatarUrl={profile.avatar_url ?? ""}
              stats={playerStats}
              rarity={rating.rarity}
            />

            <div className="rounded-2xl border border-white/[0.08] bg-[#101610] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                    Siguiente categoría
                  </p>
                  <p className="mt-2 text-lg font-black">
                    {nextTier ? `Rango ${nextTier.label}` : "Rango Oro alcanzado"}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#36d414]/15 bg-[#36d414]/[0.07] text-[#7be967]">
                  <ArrowUpRight size={19} />
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between text-[11px]">
                <span className="text-gray-500">
                  {nextTier
                    ? `Actual ${rating.overall} OVR`
                    : "Actual 75 OVR"}
                </span>
                <span className="font-bold text-[#8af276]">
                  {nextTier
                    ? `Meta ${nextTier.threshold} OVR`
                    : "100% completado"}
                </span>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]"
                role="progressbar"
                aria-label="Progreso hacia la siguiente categoría de carta"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={tierProgress}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#36d414] to-[#b2ff72] shadow-[0_0_14px_rgba(54,212,20,0.35)] transition-all"
                  style={{ width: `${tierProgress}%` }}
                />
              </div>
              <p className="mt-3 text-[11px] leading-5 text-gray-500">
                La categoría depende de tu OVR actual: Plata desde 65 y Oro desde 75.
              </p>
            </div>
          </aside>

          <div className="space-y-6">
            <section className="grid gap-3 sm:grid-cols-3">
              <article className="relative overflow-hidden rounded-2xl border border-[#36d414]/20 bg-gradient-to-br from-[#173017] to-[#101610] p-5">
                <div className="absolute -right-4 -top-8 h-24 w-24 rounded-full bg-[#36d414]/10 blur-2xl" />
                <p className="relative text-[10px] font-bold uppercase tracking-[0.17em] text-gray-400">
                  Valoración general
                </p>
                <div className="relative mt-3 flex items-end gap-2">
                  <span className="text-5xl font-black leading-none tracking-tight text-[#8af276]">
                    {rating.overall}
                  </span>
                  <span className="pb-1 text-xs font-bold tracking-[0.15em] text-gray-400">OVR</span>
                </div>
                <p className="relative mt-3 text-[11px] text-gray-500">Calculada según tu posición y atributos</p>
              </article>

              <article className="rounded-2xl border border-white/[0.08] bg-[#101610] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-gray-500">
                  Tu fortaleza
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10 text-xs font-black text-sky-300">
                    {strongestAttribute.short}
                  </div>
                  <div>
                    <p className="text-lg font-black">{strongestAttribute.label}</p>
                    <p className="text-[11px] text-gray-500">Atributo más alto</p>
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black text-sky-300">{strongestAttribute.value}<span className="ml-1 text-xs font-semibold text-gray-500">/ 99</span></p>
              </article>

              <article className="rounded-2xl border border-white/[0.08] bg-[#101610] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-gray-500">
                  Área a desarrollar
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/10 text-xs font-black text-amber-200">
                    {growthAttribute.short}
                  </div>
                  <div>
                    <p className="text-lg font-black">{growthAttribute.label}</p>
                    <p className="text-[11px] text-gray-500">Atributo por reforzar</p>
                  </div>
                </div>
                <p className="mt-3 text-2xl font-black text-amber-200">{growthAttribute.value}<span className="ml-1 text-xs font-semibold text-gray-500">/ 99</span></p>
              </article>
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-[#101610] p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <div className="flex items-center gap-2 text-[#7de96b]">
                    <Activity size={16} />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Análisis de atributos</p>
                  </div>
                  <h2 className="mt-2 text-xl font-black tracking-tight">Tu perfil de juego</h2>
                </div>
                <p className="text-[11px] text-gray-500">Escala de valoración · 1 a 99</p>
              </div>

              <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {rankedAttributes.map((attribute) => (
                  <div key={attribute.key}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-gray-200">{attribute.label}</span>
                      <span className="text-sm font-black tabular-nums text-white">{attribute.value}</span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-white/[0.07]"
                      role="progressbar"
                      aria-label={`${attribute.label}: ${attribute.value} de 99`}
                      aria-valuemin={1}
                      aria-valuemax={99}
                      aria-valuenow={attribute.value}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#248d1d] to-[#72ed5b]"
                        style={{ width: `${(attribute.value / 99) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#111a12] to-[#101610] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#36d414]/15 bg-[#36d414]/[0.07] text-[#7de96b]">
                  <Target size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold">La valoración evoluciona contigo</p>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-gray-400">
                    Tu OVR se calcula con los atributos actuales y tu posición principal. Cuando se actualicen tus atributos, tu carta reflejará el nuevo perfil.
                  </p>
                </div>
              </div>
              <span className="inline-flex w-fit items-center rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {getPlayerPositionName(position)}
              </span>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
