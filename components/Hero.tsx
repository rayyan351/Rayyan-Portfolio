"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

// Type is set on a drafting grid: cap height and baseline guides for each line.
const LINES = [
  { text: "Muhammad", base: 196 },
  { text: "Rayyan", base: 418 },
];
const CAP = 142; // cap height of the face at 200px

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const svg = root.current!.querySelector(".hero__name")!;
        gsap.set(svg, { autoAlpha: 0 });
        let tl: gsap.core.Timeline | undefined;

        document.fonts.ready.then(() => {
          tl = gsap.timeline({ defaults: { ease: "power3.out" } });
          tl.set(svg, { autoAlpha: 1 })
            .from(".hero__guide", {
              scaleX: 0,
              transformOrigin: "0% 50%",
              duration: 1.1,
              stagger: 0.08,
              ease: "power2.inOut",
            })
            .fromTo(
              ".hero__glyphs",
              { strokeDasharray: 1400, strokeDashoffset: 1400, fillOpacity: 0, strokeOpacity: 1 },
              { strokeDashoffset: 0, duration: 1.8, stagger: 0.25, ease: "power2.inOut" },
              "-=0.7"
            )
            .to(".hero__glyphs", { fillOpacity: 1, duration: 0.7, stagger: 0.15 }, "-=0.5")
            .to(".hero__glyphs", { strokeOpacity: 0, duration: 0.8 }, "<0.3")
            .to(".hero__guide", { opacity: 0.12, duration: 1 }, "<")
            .from(".hero__reveal", { y: 18, autoAlpha: 0, duration: 0.9, stagger: 0.1 }, "-=1.1");
        });

        return () => tl?.kill();
      });
    },
    { scope: root }
  );

  return (
    <section className="hero wrap" id="top" ref={root} aria-labelledby="hero-title">
      <h1 className="sr-only" id="hero-title">Muhammad Rayyan, full-stack developer</h1>
      <svg className="hero__name" viewBox="0 0 1200 470" aria-hidden="true">
        <line className="hero__guide hero__guide--dash" x1="4" y1="0" x2="4" y2="470" />
        {LINES.map((l) => (
          <g key={l.text}>
            <line className="hero__guide hero__guide--dash" x1="0" y1={l.base - CAP} x2="1200" y2={l.base - CAP} />
            <line className="hero__guide" x1="0" y1={l.base} x2="1200" y2={l.base} />
            <text className="hero__glyphs" x="0" y={l.base} aria-hidden="true">
              {l.text}
            </text>
          </g>
        ))}
      </svg>

      <p className="status hero__reveal">Taking freelance and remote work</p>
      <div className="hero__row">
        <p className="hero__lede hero__reveal">
          Full-stack developer in Karachi. I design and build websites and web apps, from the first
          sketch to the live link. <span>Currently studying AI at Bahria University.</span>
        </p>
        <div className="hero__actions hero__reveal">
          <a className="btn btn--solid" href="#work">See my work</a>
          <a className="btn btn--ghost" href="#contact">Get in touch</a>
        </div>
      </div>
    </section>
  );
}
