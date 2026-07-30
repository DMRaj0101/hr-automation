export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-6 w-6 rounded-sm bg-vantara-gold" />
      <span
        className={
          light
            ? "text-lg font-bold tracking-widest text-white"
            : "text-lg font-bold tracking-widest text-vantara-navy"
        }
      >
        VANTARA
      </span>
    </div>
  );
}
