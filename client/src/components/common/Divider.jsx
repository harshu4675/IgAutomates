import { cn } from "@/utils/cn";

export default function Divider({ text, className }) {
  if (text) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <div className="flex-1 h-px bg-border-light" />
        <span className="text-xs text-text-muted font-jakarta uppercase tracking-wider">
          {text}
        </span>
        <div className="flex-1 h-px bg-border-light" />
      </div>
    );
  }

  return <div className={cn("h-px bg-border-light", className)} />;
}
