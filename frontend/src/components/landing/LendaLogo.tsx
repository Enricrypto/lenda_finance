interface LendaLogoProps {
  size?: "sm" | "md";
}

export default function LendaLogo({ size = "md" }: LendaLogoProps) {
  const iconSize = size === "sm" ? "w-5 h-5" : "w-6 h-6";
  const boxSize = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const textSize = size === "sm" ? "text-xl" : "text-2xl";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${boxSize} bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20`}
      >
        <svg
          className={`${iconSize} text-white`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
      <span className={`font-bold ${textSize} tracking-tight text-white`}>
        Lenda
      </span>
    </div>
  );
}
