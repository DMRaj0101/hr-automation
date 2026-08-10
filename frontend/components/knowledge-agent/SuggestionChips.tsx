import { useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";

const NAVY = "#14213D";
const GOLD = "#D9A653";

export function SuggestionChips({
  chips,
  onSelect,
}: {
  chips: string[];
  onSelect: (text: string) => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);

  const handleClick = (chip: string, index: number) => {
    setClickedIndex(index);
    onSelect(chip);
    setTimeout(() => setClickedIndex(null), 400);
  };

  if (!chips.length) return null;

  const tilts = [-1.5, 1, -0.5, 1.5, -1, 0.5];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={15} style={{ color: GOLD }} strokeWidth={2.5} />
        <p className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: "#9aa3b2" }}>
          Quick suggestions
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {chips.map((chip, index) => {
          const isHovered = hoveredIndex === index;
          const isClicked = clickedIndex === index;
          const tilt = tilts[index % tilts.length];

          return (
            <button
              key={`${chip}-${index}`}
              onClick={() => handleClick(chip, index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="group relative text-left transition-all duration-300"
              style={{
                width: 208,
                padding: "12px 14px 14px",
                backgroundColor: isClicked ? GOLD : "#fffdf8",
                border: `1.5px solid ${isHovered ? GOLD : "#ece6d8"}`,
                borderRadius: "4px 12px 12px 12px",
                transform: isClicked
                  ? "scale(0.96) rotate(0deg)"
                  : isHovered
                  ? "translateY(-4px) rotate(0deg)"
                  : `rotate(${tilt}deg)`,
                boxShadow: isHovered ? "0 12px 22px rgba(20,33,61,0.16)" : "0 3px 8px rgba(20,33,61,0.08)",
                cursor: "pointer",
              }}
            >
              <span
                className="absolute top-0 right-0 transition-colors duration-300"
                style={{
                  width: 0,
                  height: 0,
                  borderStyle: "solid",
                  borderWidth: "0 14px 14px 0",
                  borderColor: `transparent ${isHovered ? GOLD : "#e5dfd0"} transparent transparent`,
                  borderTopRightRadius: 4,
                }}
              />

              <p className="text-[13px] font-semibold leading-snug pr-3" style={{ color: isClicked ? "#fff" : NAVY }}>
                {chip}
              </p>

              <span
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold transition-all duration-300"
                style={{ color: isClicked ? "#fff" : GOLD, opacity: isHovered || isClicked ? 1 : 0.65 }}
              >
                Ask this
                <ArrowUpRight
                  size={13}
                  strokeWidth={2.5}
                  style={{ transform: isHovered ? "translate(1px,-1px)" : "translate(0,0)", transition: "transform 300ms" }}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}