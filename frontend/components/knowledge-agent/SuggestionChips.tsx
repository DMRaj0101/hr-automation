export function SuggestionChips({
  chips,
  onSelect,
}: {
  chips: string[];
  onSelect: (text: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => onSelect(chip)}
          className="rounded-full bg-white text-sm text-vantara-navy hover:border-vantara-gold hover:text-vantara-gold"
          style={{ border: "1px solid #E5E7EB", padding: "8px 16px" }}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
