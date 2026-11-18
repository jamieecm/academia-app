
import Image from "next/image";

export type PlayerPosition = "POR" | "DEF" | "MED" | "DEL";

export type CardRarity = "BRONZE" | "SILVER" | "GOLD" | "MVP";

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
    background: "linear-gradient(155deg, #A66B43 0%, #70432C 48%, #39241B 100%)",
    border: "#D8A47B",
    accent: "#FFE0BD",
    label: "BRONCE",
  },
  SILVER: {
    background: "linear-gradient(155deg, #D1D7DA 0%, #89949C 48%, #414B52 100%)",
    border: "#F1F4F5",
    accent: "#FFFFFF",
    label: "PLATA",
  },
  GOLD: {
    background: "linear-gradient(155deg, #F1D17A 0%, #A77A21 48%, #594015 100%)",
    border: "#FFE8A3",
    accent: "#FFF5D6",
    label: "ORO",
  },
  MVP: {
    background: "linear-gradient(155deg, #39332A 0%, #171717 48%, #080808 100%)",
    border: "#D5B45F",
    accent: "#EBD28C",
    label: "WEEKLY MVP",
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
    { label: "PAC", value: stats.pace },
    { label: "SHO", value: stats.shooting },
    { label: "PAS", value: stats.passing },
    { label: "DRI", value: stats.dribbling },
    { label: "DEF", value: stats.defending },
    { label: "PHY", value: stats.physical },
  ];

  return (
    <article
      className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-[22px] p-[7px] shadow-[0_25px_70px_rgba(0,0,0,0.5)]"
      style={{
        background: style.background,
        border: `1px solid ${style.border}`,
      }}
    >
      {/* Interior */}
      <div
        className="relative overflow-hidden rounded-[17px] border p-3"
        style={{
          borderColor: `${style.border}90`,
          background: "linear-gradient(180deg, rgba(0,0,0,.10), rgba(0,0,0,.65))",
        }}
      >
        {/* Decorative glow */}
        <div
          className="pointer-events-none absolute -right-16 top-16 h-48 w-48 rounded-full blur-3xl"
          style={{ backgroundColor: `${style.accent}25` }}
        />

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between">

          <div>
            <p
              className="text-[44px] font-black leading-none tracking-tighter"
              style={{ color: style.accent }}
            >
              {stats.overall}
            </p>

            <p
              className="mt-1 text-[11px] font-black uppercase tracking-[0.25em]"
              style={{ color: style.accent }}
            >
              OVR
            </p>

            <div
              className="mt-3 h-[2px] w-9"
              style={{ backgroundColor: style.accent }}
            />

            <p
              className="mt-2 text-lg font-black"
              style={{ color: style.accent }}
            >
              {position}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Image
              src="/escudo-academia.png"
              alt="Academia Fútbol AF"
              width={44}
              height={44}
              className="rounded-full bg-white/90 p-0.5"
            />

            <span
              className="text-[9px] font-black tracking-[0.2em]"
              style={{ color: style.accent }}
            >
              AF · {style.label}
            </span>
          </div>
        </div>

        {/* Player portrait */}
        <div className="relative z-10 mx-auto mt-[-5px] aspect-[4/4.3] w-full max-w-[260px] overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 40%, ${style.accent}40, transparent 70%)`,
            }}
          />

          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`Fotografía de ${nickname}`}
              className="relative z-10 h-full w-full object-contain object-bottom"
            />
          ) : (
            <div className="relative z-10 flex h-full items-center justify-center">
              <span
                className="text-8xl font-black"
                style={{ color: style.accent }}
              >
                {nickname.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Nickname */}
        <div className="relative z-10 -mt-1 text-center">
          <h2
            className="truncate text-xl font-black uppercase tracking-wider"
            style={{ color: style.accent }}
          >
            {nickname}
          </h2>

          <div
            className="mx-auto mt-2 h-[2px] w-24"
            style={{ backgroundColor: style.accent }}
          />

          <p
            className="mt-2 text-[9px] font-bold tracking-[0.35em]"
            style={{ color: style.accent }}
          >
            ACADEMIA FÚTBOL
          </p>
        </div>

        {/* Six attributes */}
        <div className="relative z-10 mt-5 grid grid-cols-3 gap-x-4 gap-y-3 border-t pt-4"
          style={{ borderColor: `${style.accent}60` }}
        >
          {attributes.map((attribute) => (
            <div key={attribute.label} className="flex items-center justify-center gap-2">
              <span
                className="text-[11px] font-black"
                style={{ color: style.accent }}
              >
                {attribute.label}
              </span>

              <span className="text-sm font-black text-white">
                {attribute.value}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="mt-4 flex items-center justify-center border-t pt-3"
          style={{ borderColor: `${style.accent}40` }}
        >
          <p
            className="text-[9px] font-black tracking-[0.35em]"
            style={{ color: style.accent }}
          >
            YOUR GAME · YOUR LEGACY
          </p>
        </div>
      </div>
    </article>
  );
}
