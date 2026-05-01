import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

interface SidebarCardProps {
  readonly title: string;
  readonly defaultOpen?: boolean;
  readonly children: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly icon?: React.ReactNode;
}

export function SidebarCard({ title, defaultOpen = true, children, actions, icon }: SidebarCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl bg-card/60">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5"
      >
        <span className="text-base font-medium text-foreground font-['SimSun','Songti_SC','STSong',serif] flex items-center gap-2">
          {icon && <span className="shrink-0">{icon}</span>}
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          {actions}
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}
