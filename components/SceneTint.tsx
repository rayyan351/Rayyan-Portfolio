"use client";

import { useEffect, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";
import { projects } from "./data";

gsap.registerPlugin(ScrollTrigger);

/**
 * Each case study borrows a little of its client's colour. One fixed layer per project sits
 * behind the page and only its opacity changes, so the crossfade costs nothing to render.
 */
export default function SceneTint() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const triggers = projects.map((p) =>
      ScrollTrigger.create({
        trigger: `#build-${p.id}`,
        start: "top 55%",
        end: "bottom 45%",
        onToggle: (self) => setActive((cur) => (self.isActive ? p.id : cur === p.id ? null : cur)),
      })
    );
    return () => triggers.forEach((t) => t.kill());
  }, []);

  return (
    <div className="tint" aria-hidden="true">
      {projects.map((p) => (
        <div
          key={p.id}
          className={`tint__layer${active === p.id ? " is-on" : ""}`}
          style={{ ["--accent" as string]: p.accent }}
        />
      ))}
    </div>
  );
}
