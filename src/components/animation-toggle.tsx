"use client";

import { Mouse, MouseOff } from "lucide-react";
import { useId, useState } from "react";
import { usePointerEffects } from "@/lib/animation-preference";

export function AnimationToggle() {
  const [enabled, setEnabled] = usePointerEffects();
  const tooltip = useId();
  const [dismissed, setDismissed] = useState(false);
  const label = enabled ? "Turn mouse effects off" : "Turn mouse effects on";
  const Icon = enabled ? Mouse : MouseOff;
  return (
    <div className="animation-control">
      <button
        type="button"
        className="animation-toggle"
        aria-label={label}
        aria-pressed={enabled}
        aria-describedby={tooltip}
        onClick={() => setEnabled(!enabled)}
        onFocus={() => setDismissed(false)}
        onPointerEnter={() => setDismissed(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setDismissed(true);
        }}
      >
        <Icon size={18} aria-hidden="true" />
      </button>
      <span
        id={tooltip}
        role="tooltip"
        className="animation-tooltip"
        data-dismissed={dismissed}
      >
        {label}
      </span>
    </div>
  );
}
