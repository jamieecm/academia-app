"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Camera,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  Star,
} from "lucide-react";

import { createClient } from "@/src/lib/supabase/client";

import PlayerCard, {
  type PlayerPosition,
  type PlayerStats,
  type CardRarity,
} from "@/src/components/player/player-card";

type OnboardingProps = {
  initialNickname: string;
  initialPosition: string;
  initialAvatar: string;
};

const positions = [
  // --- ARQUERO ---
  {
    code: "POR",
    name: "Portero",
    description: "El último hombre y guardián del arco.",
    emoji: "🧤",
  },
  
  // --- DEFENSAS ---
  {
    code: "DFC",
    name: "Defensa Central",
    description: "Sólido en la marca y el juego aéreo.",
    emoji: "🛡️",
  },
  {
    code: "LI",
    name: "Lateral Izquierdo",
    description: "Velocidad y cobertura por la banda zurda.",
    emoji: "⚡",
  },
  {
    code: "LD",
    name: "Lateral Derecho",
    description: "Desborde y seguridad por la banda diestra.",
    emoji: "⚡",
  },

  // --- MEDIOCAMPISTAS ---
  {
    code: "MCD",
    name: "Mediocampista Defensivo",
    description: "El equilibrio, quite y salida limpia.",
    emoji: "⚓",
  },
  {
    code: "MC",
    name: "Mediocampista Central",
    description: "Control del ritmo, pase y despliegue.",
    emoji: "🎯",
  },
  {
    code: "MCO",
    name: "Mediocampista Ofensivo",
    description: "Visión de juego, último pase y gol.",
    emoji: "🪄",
  },
  {
    code: "MI",
    name: "Mediocentro Izquierdo",
    description: "Recorrido y llegada por la banda izquierda.",
    emoji: "🏃‍♂️",
  },
  {
    code: "MD",
    name: "Mediocentro Derecho",
    description: "Recorrido y llegada por la banda derecha.",
    emoji: "🏃‍♂️",
  },

  // --- DELANTEROS ---
  {
    code: "EI",
    name: "Extremo Izquierdo",
    description: "Desequilibrio, diagonal y remate.",
    emoji: "🔥",
  },
  {
    code: "ED",
    name: "Extremo Derecho",
    description: "Desborde, velocidad y centros precisos.",
    emoji: "🔥",
  },
  {
    code: "DC",
    name: "Delantero Centro",
    description: "Olfato goleador y referencia de ataque.",
    emoji: "⚽",
  },
] as const;

const initialStats: PlayerStats = {
  overall: 50,
  pace: 50,
  shooting: 50,
  passing: 50,
  dribbling: 50,
  defending: 50,
  physical: 50,
};

export default function OnboardingWizard({
  initialNickname,
  initialPosition,
  initialAvatar,
}: OnboardingProps) {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [nickname, setNickname] = useState(initialNickname);
  
  // Posiciones seleccionadas (máximo 3) y la posición principal
  const [selectedPositions, setSelectedPositions] = useState<string[]>(
    initialPosition ? [initialPosition] : []
  );
  const [primaryPosition, setPrimaryPosition] = useState<string>(initialPosition || "");

  const [avatar, setAvatar] = useState(initialAvatar);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(initialAvatar);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);

  const [playerStats, setPlayerStats] =
    useState<PlayerStats>(initialStats);

  const [rarity, setRarity] = useState<CardRarity>("BRONZE");

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    setError("");

    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Selecciona una imagen JPG, PNG o WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La fotografía no puede superar los 5 MB.");
      return;
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handlePositionToggle(code: string) {
    setError("");

    if (selectedPositions.includes(code)) {
      // Si ya está seleccionada, la quitamos
      const updated = selectedPositions.filter((p) => p !== code);
      setSelectedPositions(updated);

      // Si quitamos la principal, reasignamos la principal si queda alguna
      if (primaryPosition === code) {
        setPrimaryPosition(updated.length > 0 ? updated[0] : "");
      }
    } else {
      // Si no está seleccionada, validamos el límite de 3
      if (selectedPositions.length >= 3) {
        setError("Solo puedes seleccionar un máximo de 3 posiciones.");
        return;
      }

      const updated = [...selectedPositions, code];
      setSelectedPositions(updated);

      // Si es la primera que selecciona, la marcamos como principal automáticamente
      if (!primaryPosition) {
        setPrimaryPosition(code);
      }
    }
  }

  function nextStep() {
    setError("");

    if (step === 1) {
      const cleanNickname = nickname.trim();

      if (cleanNickname.length < 3) {
        setError("Tu apodo debe tener al menos 3 caracteres.");
        return;
      }

      if (cleanNickname.length > 20) {
        setError("Tu apodo no puede superar los 20 caracteres.");
        return;
      }
    }

    if (step === 2) {
      if (selectedPositions.length === 0) {
        setError("Selecciona al menos una posición en el campo.");
        return;
      }
      if (!primaryPosition) {
        setError("Debes definir cuál es tu posición principal.");
        return;
      }
    }

    setStep((current) => Math.min(current + 1, 3));
  }

  function previousStep() {
    setError("");
    setStep((current) => Math.max(current - 1, 1));
  }

  async function createPlayerCard() {
    setError("");
    setLoading(true);

    let uploadedPath: string | null = null;

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Tu sesión ha expirado. Inicia sesión nuevamente.");
      }

      let finalAvatar = avatar;

      if (photo) {
        const extension = photo.type === "image/png"
          ? "png"
          : photo.type === "image/webp"
            ? "webp"
            : "jpg";

        const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("player-avatars")
          .upload(filePath, photo, {
            contentType: photo.type,
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        uploadedPath = filePath;

        const { data: publicData } = supabase.storage
          .from("player-avatars")
          .getPublicUrl(filePath);

        finalAvatar = publicData.publicUrl;
      }

      if (!finalAvatar) {
        throw new Error("Debes subir una fotografía para tu Player Card.");
      }

      // Retrieve initial stats first.
      const { data: stats, error: statsError } = await supabase
        .from("player_stats")
        .select(
          "overall, pace, shooting, passing, dribbling, defending, physical, rarity"
        )
        .eq("player_id", user.id)
        .single();

      if (statsError) throw statsError;

      // Save player profile (incluyendo posición principal y posiciones secundarias si tu DB lo soporta)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          nickname: nickname.trim(),
          position: primaryPosition, // Posición principal para la carta
          secondary_positions: selectedPositions.filter(p => p !== primaryPosition), // Opcional si agregaste esta columna
          avatar_url: finalAvatar,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      setPlayerStats({
        overall: stats.overall,
        pace: stats.pace,
        shooting: stats.shooting,
        passing: stats.passing,
        dribbling: stats.dribbling,
        defending: stats.defending,
        physical: stats.physical,
      });

      setRarity(stats.rarity as CardRarity);
      setAvatar(finalAvatar);
      setCreated(true);

    } catch (err) {
      if (uploadedPath) {
        const supabase = createClient();
        await supabase.storage
          .from("player-avatars")
          .remove([uploadedPath]);
      }

      setError(
        err instanceof Error
          ? err.message
          : "No fue posible crear tu Player Card."
      );
    } finally {
      setLoading(false);
    }
  }

  // Final card screen.
  if (created) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#090D09] px-4 py-10 text-white sm:px-6">
        <div className="pointer-events-none absolute -left-40 top-1/4 h-[400px] w-[400px] rounded-full bg-[#36D414]/10 blur-[130px]" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-[400px] w-[400px] rounded-full bg-[#36D414]/10 blur-[150px]" />

        <div className="relative z-10 w-full max-w-[440px]">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#36D414]/10 text-[#36D414]">
              <Check size={34} />
            </div>
            <p className="text-xs font-black tracking-[0.3em] text-[#36D414]">
              ACADEMIA FÚTBOL AF
            </p>
            <h1 className="mt-3 text-3xl font-black uppercase sm:text-4xl">
              ¡TU CARTA ESTÁ LISTA!
            </h1>
            <p className="mt-3 text-sm text-gray-400">
              Bienvenido al equipo, {nickname}.
            </p>
          </div>

          <div className="w-full">
            <PlayerCard
              nickname={nickname}
              position={primaryPosition as PlayerPosition}
              avatarUrl={avatar}
              stats={playerStats}
              rarity={rarity}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-[#36D414]/20 bg-[#36D414]/5 p-4 text-center">
            <Sparkles className="mx-auto mb-2 text-[#36D414]" size={22} />
            <p className="font-bold">Tu historia comienza hoy.</p>
            <p className="mt-1 text-xs text-gray-400">
              Esta es tu primera carta. Posición principal: {primaryPosition}.
            </p>
          </div>

          <button
            onClick={() => {
              router.replace("/dashboard");
              router.refresh();
            }}
            className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#36D414] font-black uppercase tracking-wide text-black transition hover:bg-[#48e51d]"
          >
            Entrar a mi dashboard
            <ArrowRight size={20} />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090D09] px-4 py-10 text-white sm:px-6">
      {/* Destellos de luz ambiental de fondo */}
      <div className="pointer-events-none absolute -left-40 top-1/4 h-[400px] w-[400px] rounded-full bg-[#36D414]/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-[400px] w-[400px] rounded-full bg-[#36D414]/10 blur-[150px]" />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Cabecera / Identidad uniforme con Login */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-full bg-white shadow-[0_0_30px_rgba(54,212,20,0.25)]">
            <Image
              src="/escudo-academia.png"
              alt="Escudo Academia Fútbol AF"
              fill
              priority
              className="object-contain"
              sizes="80px"
            />
          </div>

          <h1 className="text-xl font-black uppercase tracking-tight">
            Academia Fútbol
          </h1>
          <p className="mt-1 text-xs font-bold tracking-[0.25em] text-[#36D414]">
            CREA TU IDENTIDAD
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#36D414]">
              PASO {step} DE 3
            </span>
            <span className="text-[11px] text-gray-500">
              {Math.round((step / 3) * 100)}% COMPLETADO
            </span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((number) => (
              <div
                key={number}
                className={`h-1.5 flex-1 rounded-full transition ${
                  number <= step ? "bg-[#36D414]" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Main form card */}
        <div className="rounded-3xl border border-white/10 bg-[#0D150D]/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {/* Step 1 */}
          {step === 1 && (
            <div>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#36D414]/10 text-[#36D414]">
                  <UserRound size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase">¿CÓMO TE LLAMAMOS?</h2>
                </div>
              </div>
              
              <div className="mt-4">
                <label htmlFor="nickname" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Nombre futbolístico
                </label>
                <div className="relative">
                  <UserRound
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Ingresa tu nombre o apodo"
                    maxLength={20}
                    autoFocus
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#111711] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#36D414] focus:ring-2 focus:ring-[#36D414]/10"
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-gray-500">
                  <span>Entre 3 y 20 caracteres</span>
                  <span>{nickname.length}/20</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#36D414]/10 text-[#36D414]">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase">TUS POSICIONES</h2>
                  <p className="text-xs text-gray-400">Hasta 3 posiciones</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Selecciona tus posiciones y marca con una estrella tu <strong className="text-[#36D414]">posición principal</strong>.
              </p>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-[#111711] p-3 text-xs border border-white/5">
                <span className="text-gray-400">Seleccionadas: <strong className="text-white">{selectedPositions.length}/3</strong></span>
                <span className="text-gray-400">Principal: <strong className="text-[#36D414]">{primaryPosition || "Ninguna"}</strong></span>
              </div>

              <div className="mt-4 max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {positions.map((item) => {
                  const isSelected = selectedPositions.includes(item.code);
                  const isPrimary = primaryPosition === item.code;

                  return (
                    <div
                      key={item.code}
                      className={`flex flex-col justify-between rounded-xl border p-3 transition ${
                        isSelected
                          ? "border-[#36D414] bg-[#36D414]/10"
                          : "border-white/10 bg-[#111711] hover:border-white/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handlePositionToggle(item.code)}
                          className="flex flex-1 items-center gap-3 text-left"
                        >
                          <span className="text-xl">{item.emoji}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-black text-xs">
                              {item.code} · {item.name}
                            </span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePositionToggle(item.code)}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                            isSelected
                              ? "border-[#36D414] bg-[#36D414] text-black"
                              : "border-white/20 bg-transparent text-transparent"
                          }`}
                        >
                          <Check size={12} strokeWidth={3} />
                        </button>
                      </div>

                      {/* Botón para definir posición principal si ya está seleccionada */}
                      {isSelected && (
                        <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2">
                          <span className="text-[10px] uppercase font-bold text-gray-400">
                            {isPrimary ? "Posición Principal" : "Hacer Principal"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setPrimaryPosition(item.code);
                              setError("");
                            }}
                            className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold transition ${
                              isPrimary
                                ? "bg-[#36D414] text-black"
                                : "bg-white/10 text-gray-300 hover:bg-white/20"
                            }`}
                          >
                            <Star size={11} className={isPrimary ? "fill-current" : ""} />
                            {isPrimary ? "Principal" : "Elegir"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#36D414]/10 text-[#36D414]">
                  <Camera size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase">FOTOGRAFÍA</h2>
                  <p className="text-xs text-gray-400">Retrato de tu carta</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Sube una fotografía para crear el retrato de tu Player Card.
              </p>

              <label
                htmlFor="avatar"
                className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#36D414]/40 bg-[#111711] p-6 transition hover:border-[#36D414] hover:bg-[#36D414]/5"
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Vista previa de la fotografía"
                    className="mb-4 h-36 w-28 rounded-xl border border-[#36D414]/30 object-cover shadow-md"
                  />
                ) : (
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#36D414]/10 text-[#36D414]">
                    <Upload size={28} />
                  </div>
                )}
                <span className="text-xs font-bold text-white">
                  {photoPreview ? "Cambiar fotografía" : "Seleccionar fotografía"}
                </span>
                <span className="mt-1 text-center text-[10px] text-gray-500">
                  JPG, PNG o WEBP · Máximo 5 MB
                </span>
                <input
                  id="avatar"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="sr-only"
                />
              </label>

              <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <p className="text-[11px] leading-relaxed text-gray-400">
                  Consejo: utiliza una fotografía frontal, con buena iluminación y donde tu rostro sea claramente visible.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300"
            >
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={previousStep}
                disabled={loading}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 font-bold text-gray-300 transition hover:bg-white/5 disabled:opacity-50 text-xs"
              >
                <ArrowLeft size={16} />
                Atrás
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#36D414] text-xs font-black uppercase tracking-wide text-black shadow-[0_5px_20px_rgba(54,212,20,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#48e51d]"
              >
                Continuar
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={createPlayerCard}
                disabled={loading || !photoPreview}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#36D414] text-xs font-black uppercase tracking-wide text-black shadow-[0_5px_20px_rgba(54,212,20,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#48e51d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "CREANDO..." : "CREAR MI CARTA"}
                {!loading && <Sparkles size={16} />}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500">
          <p className="mt-4 text-center text-[11px] text-gray-600">
            © 2027 Academia Fútbol.<br />Todos los derechos reservados.
          </p>
        </div>
      </div>
    </main>
  );
}