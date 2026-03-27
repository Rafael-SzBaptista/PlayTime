import { cn } from "@/lib/utils";

/** Ilustrações em `public/` (mesmas da página Criar jogo). */
export function getGameTypeArtSrc(gameType: string | null | undefined): string | null {
  const n = (gameType ?? "").trim().toLowerCase();
  if (!n) return null;
  if (n.includes("amigo")) return "/card-amigo-secreto.png";
  if (n.includes("rouba")) return "/card-rouba-presente.png";
  if (n.includes("bingo")) return "/card-bingo-presentes.png";
  return null;
}

const SIZE_CLASS = {
  /** Lista (ex.: Meus Jogos) */
  sm: "h-24 w-24 sm:h-28 sm:w-28",
  /** Compacto em cabeçalhos */
  md: "h-28 w-28 sm:h-32 sm:w-32",
  /** Página do jogo (Rouba / Bingo) */
  lg: "h-32 w-32 sm:h-36 sm:w-36",
  /** Cabeçalho do evento */
  xl: "h-36 w-36 sm:h-40 sm:w-40 md:h-44 md:w-44",
} as const;

export type GameTypeIconSize = keyof typeof SIZE_CLASS;

type GameTypeIconProps = {
  gameType: string | null | undefined;
  /** Usado quando não há arte para o tipo (ex.: emoji gravado no jogo). */
  emojiFallback?: string | null;
  size?: GameTypeIconSize;
  /** Ajusta diferenças visuais entre artes para ficarem com o mesmo "peso". */
  normalizeVisualSize?: boolean;
  className?: string;
};

function getNormalizedScaleClass(gameType: string | null | undefined): string {
  const n = (gameType ?? "").trim().toLowerCase();
  if (n.includes("rouba")) return "scale-[0.82]";
  if (n.includes("amigo")) return "scale-[1.08]";
  if (n.includes("bingo")) return "scale-[1.04]";
  return "scale-100";
}

export function GameTypeIcon({
  gameType,
  emojiFallback = "🎁",
  size = "lg",
  normalizeVisualSize = false,
  className,
}: GameTypeIconProps) {
  const src = getGameTypeArtSrc(gameType);
  if (src) {
    return (
      <span className={cn(SIZE_CLASS[size], "inline-flex shrink-0 items-center justify-center overflow-hidden", className)}>
        <img
          src={src}
          alt=""
          draggable={false}
          className={cn(
            "h-full w-full object-contain select-none transition-transform",
            normalizeVisualSize && getNormalizedScaleClass(gameType),
          )}
        />
      </span>
    );
  }
  return (
    <span
      className={cn(
        size === "sm" && "text-5xl",
        size === "md" && "text-5xl",
        size === "lg" && "text-6xl sm:text-7xl",
        size === "xl" && "text-7xl sm:text-8xl",
        "inline-block leading-none",
        className,
      )}
      aria-hidden
    >
      {emojiFallback ?? "🎁"}
    </span>
  );
}
