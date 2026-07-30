import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ChatInput({
  value,
  onChange,
  onSend,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="flex gap-3">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSend();
        }}
        placeholder="Ask about an employee, ticket, or system status..."
      />
      <Button onClick={onSend}>Send</Button>
    </div>
  );
}
