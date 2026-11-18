import Image from "next/image";

import {
  getPlayerPositionName,
  type PlayerPosition,
  type PlayerRarity,
} from "@/src/lib/player/rating";

export type { PlayerPosition } from "@/src/lib/player/rating";
export type CardRarity = PlayerRarity;

export type PlayerStats = {
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
};

type PlayerCardProps = {
  nickname: string;
  position: PlayerPosition;
  avatarUrl: string;
  stats: PlayerStats;
  rarity?: CardRarity;
};

const rarityStyles: Record<
  CardRarity,
  { background: string; border: string; accent: string; label: string }
> = {
  BRONZE: {
    background: "linear-gradient(155deg, #9a603b 0%, #493022 48%, #171d18 100%)",
    border: "#d8a47b",
    accent: "#ffe0bd",
    label: "BRONCE",
  },
  SILVER: {
    background: "linear-gradient(155deg, #c3cdd2 0%, #58666d 48%, #19201f 100%)",
    border: "#e3ebed",
    accent: "#ffffff",
    label: "PLATA",
  },
  GOLD: {
    background: "linear-gradient(155deg, #d5b45d 0%, #69501e 48%, #1c2117 100%)",
    border: "#ffe8a3",
    accent: "#fff5d6",
    label: "ORO",
  },
};

export default function PlayerCard({
  nickname,
  position,
  avatarUrl,
  stats,
  rarity = "BRONZE",
}: PlayerCardProps) {
  const style = rarityStyles[rarity];
  const attributes = [
    { label: "RIT", value: stats.pace },
    { label: "TIR", value: stats.shooting },
    { label: "PAS", value: stats.passing },
    { label: "REG", value: stats.dribbling },
    { label: "DEF", value: stats.defending },
    { label: "FIS", value: stats.physical },
  ];

  return (
    <article
      className="relative mx-auto w-full max-w-[350px] overflow-hidden rounded-[26px] p-[6px] shadow-[0_28px_80px_rgba(0,0,0,0.48)]"
      style={{
        background: style.background,
        border: `1px solid ${style.border}`,
      }}
    >
      <div
        className="relative overflow-hidden rounded-[21px] border p-4 sm:p-5"
        style={{
          borderColor: `${style.border}80`,
          background: "linear-gradient(180deg, rgba(5,12,7,.12), rgba(5,10,7,.84))",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-44 opacity-[0.11]"
          style={{
            backgroundImage:
              "linear-gradient(90deg, transparent 49.7%, white 50%, transparent 50.3%), radial-gradient(ellipse at center, transparent 42%, white 42.5%, transparent 43%), linear-gradient(0deg, transparent 49.7%, white 50%, transparent 50.3%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 top-20 h-48 w-48 rounded-full blur-3xl"
          style={{ backgroundColor: `${style.accent}20` }}
        />

        <header className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/55">
              Valoración
            </p>
            <div className="mt-1 flex items-end gap-2">
              <span
                className="text-[56px] font-black leading-[0.9] tracking-[-0.07em]"
                style={{ color: style.accent }}
              >
                {stats.overall}
              </span>
              <span
                className="mb-1 text-[10px] font-black tracking-[0.22em]"
                style={{ color: style.accent }}
              >
                OVR
              </span>
            </div>
            <p className="mt-3 text-base font-black" style={{ color: style.accent }}>
              {position}
            </p>
            <p className="mt-0.5 max-w-36 text-[10px] font-semibold leading-tight text-white/65">
              {getPlayerPositionName(position)}
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <Image
              src="/escudo-academia.png"
              alt="Escudo de Academia Fútbol AF"
              width={42}
              height={42}
              className="rounded-full bg-white/90 p-0.5 shadow-lg"
            />
            <span
              className="rounded-full border px-2.5 py-1 text-[9px] font-black tracking-[0.16em]"
              style={{
                borderColor: `${style.accent}70`,
                color: style.accent,
                backgroundColor: "rgba(0,0,0,.2)",
              }}
            >
              {style.label}
            </span>
          </div>
        </header>

        <div className="relative z-10 mx-auto -mt-1 aspect-[4/4.05] w-full max-w-[245px] overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 42%, ${style.accent}38, transparent 68%)`,
            }}
          />
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`Fotografía de ${nickname}`}
              className="relative z-10 h-full w-full object-contain object-bottom drop-shadow-[0_16px_18px_rgba(0,0,0,.45)]"
            />
          ) : (
            <div className="relative z-10 flex h-full items-center justify-center">
              <span className="text-8xl font-black" style={{ color: style.accent }}>
                {nickname.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="relative z-10 -mt-1 text-center">
          <h2
            className="truncate text-xl font-black uppercase tracking-[0.12em]"
            style={{ color: style.accent }}
          >
            {nickname}
          </h2>
          <p className="mt-1 text-[9px] font-bold tracking-[0.28em] text-white/45">
            ACADEMIA FÚTBOL · PLAYER CARD
          </p>
        </div>

        <div
          className="relative z-10 mt-5 grid grid-cols-2 gap-x-5 gap-y-3 border-t pt-4"
          style={{ borderColor: `${style.accent}45` }}
        >
          {attributes.map((attribute) => (
            <div key={attribute.label}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[9px] font-black tracking-[0.15em]" style={{ color: style.accent }}>
                  {attribute.label}
                </span>
                <span className="text-xs font-black tabular-nums text-white">
                  {attribute.value}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-black/35">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(attribute.value / 99) * 100}%`,
                    backgroundColor: style.accent,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div
          className="relative z-10 mt-4 flex items-center justify-between border-t pt-3 text-[8px] font-bold uppercase tracking-[0.2em] text-white/45"
          style={{ borderColor: `${style.accent}30` }}
        >
          <span>Tu juego</span>
          <span>Tu legado</span>
        </div>
      </div>
    </article>
  );
}
