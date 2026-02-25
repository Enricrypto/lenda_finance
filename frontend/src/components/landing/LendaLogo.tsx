interface LendaLogoProps {
  size?: "sm" | "md";
  textColor?: string;
}

export default function LendaLogo({ size = "md", textColor = "text-white" }: LendaLogoProps) {
  const boxSize = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const textSize = size === "sm" ? "text-xl" : "text-2xl";

  return (
    <div className="flex items-center gap-3">
      <svg
        className={boxSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Square border */}
        <rect x="18" y="18" width="64" height="64" stroke="white" strokeWidth="4" />
        {/* Outer triangle */}
        <polyline points="18,82 50,24 82,82" stroke="white" strokeWidth="4" strokeLinejoin="miter" />
        {/* Inner triangle */}
        <polyline points="34,82 50,40 66,82" stroke="white" strokeWidth="4" strokeLinejoin="miter" />
      </svg>
      <span className={`font-bold ${textSize} tracking-tight ${textColor}`}>
        Lenda
      </span>
    </div>
  );
}
