export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {/* Gold V mark — no box */}
      <svg
        viewBox="0 0 100 100"
        className="h-7 w-7 shrink-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F3D590" />
            <stop offset="45%" stopColor="#D9A653" />
            <stop offset="100%" stopColor="#B8863A" />
          </linearGradient>
        </defs>
        <text
          x="50"
          y="76"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="800"
          fontSize="82"
          fill="url(#logoGold)"
        >
          V
        </text>
      </svg>

      {/* Glassy VANTARA wordmark */}
      <span
        className={
          light
            ? "bg-gradient-to-b from-white via-white/90 to-white/60 bg-clip-text text-lg font-bold tracking-widest text-transparent drop-shadow-[0_1px_2px_rgba(255,255,255,0.25)]"
            : "bg-gradient-to-b from-vantara-navy via-vantara-navy/90 to-vantara-navy/60 bg-clip-text text-lg font-bold tracking-widest text-transparent"
        }
      >
        VANTARA
      </span>
    </div>
  );
}