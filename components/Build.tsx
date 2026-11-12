"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Project } from "./data";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STAGES = ["Idea", "Design", "Code", "Ship"] as const;

/*
 * Two ways to read a build:
 * - Scrubbed (wide, tall screens with motion allowed): the section pins and scrolling plays
 *   Idea → Design → Code → Ship.
 * - Tap (phones, short laptops, reduced motion): no pinning; the four stages are tabs that
 *   switch the frame, so the page stays short.
 */
const SCRUB_QUERY = "(min-width: 900px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)";
// Where each stage sits along the pinned scroll (matches the timeline below).
const STAGE_AT = [0.08, 0.37, 0.62, 0.93];

function jitter(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x) - 0.5;
}

export default function Build({ p, index, total }: { p: Project; index: number; total: number }) {
  const root = useRef<HTMLElement>(null);
  const scrubbed = useRef(false);
  const [tapStep, setTapStep] = useState(3);

  useGSAP(
    () => {
      const el = root.current!;
      const mm = gsap.matchMedia();

      mm.add(SCRUB_QUERY, () => {
        scrubbed.current = true;
        el.classList.add("is-scrubbed");
        el.dataset.step = "0";
        const label = el.querySelector(".frame__stage-label");
        if (label) label.textContent = STAGES[0];

        const crisp = gsap.utils.toArray<SVGRectElement>(".wire__crisp rect", el);
        crisp.forEach((r) => {
          const len = 2 * (r.width.baseVal.value + r.height.baseVal.value);
          gsap.set(r, { strokeDasharray: len, strokeDashoffset: len, fillOpacity: 0 });
        });

        const bounds = [1, 2.2, 3.3];
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          onUpdate: () => {
            const t = tl.time();
            const step = t < bounds[0] ? 0 : t < bounds[1] ? 1 : t < bounds[2] ? 2 : 3;
            if (el.dataset.step !== String(step)) {
              el.dataset.step = String(step);
              if (label) label.textContent = STAGES[step];
            }
          },
        });
        tl.from(".wire__sketch rect", { autoAlpha: 0, stagger: 0.05, duration: 0.6 })
          .to({}, { duration: 0.4 })
          .to(".wire__sketch", { autoAlpha: 0, duration: 0.4 }, 1)
          .to(crisp, { strokeDashoffset: 0, stagger: 0.05, duration: 0.6 }, 1)
          .to(crisp, { fillOpacity: 1, duration: 0.3 }, 1.6)
          .from(".wire__dim", { autoAlpha: 0, duration: 0.2 }, 1.6)
          .to({}, { duration: 0.3 })
          .fromTo(".tree", { xPercent: 12, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.3 }, 2.2)
          .from(".tree li", { autoAlpha: 0, x: -8, stagger: 0.05, duration: 0.15 }, 2.35)
          .to({}, { duration: 0.3 })
          .fromTo(".shot", { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "power1.inOut" }, 3.3)
          .to(".tree", { xPercent: 12, autoAlpha: 0, duration: 0.3 }, 3.3)
          .to({}, { duration: 0.4 });

        ScrollTrigger.create({ trigger: el, start: "top top", end: "bottom bottom", scrub: 0.6, animation: tl });

        return () => {
          scrubbed.current = false;
          el.classList.remove("is-scrubbed");
          delete el.dataset.step;
        };
      });
    },
    { scope: root }
  );

  const pick = (i: number) => {
    if (!scrubbed.current) {
      setTapStep(i);
      return;
    }
    // In the pinned version, a stage name jumps the scroll to that stage.
    const el = root.current!;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const y = top + (el.offsetHeight - window.innerHeight) * STAGE_AT[i];
    const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number) => void } }).__lenis;
    lenis ? lenis.scrollTo(y) : window.scrollTo({ top: y, behavior: "smooth" });
  };

  const host = p.live ? new URL(p.live).host : p.name;

  return (
    <article className="build" id={`build-${p.id}`} ref={root} data-tap={tapStep} aria-labelledby={`${p.id}-name`}>
      <div className="wrap build__stage">
        <header className="build__head">
          <p className="build__count">Project {index + 1} of {total}</p>
          <h3 className="build__name" id={`${p.id}-name`}>{p.name}</h3>
          <p className="build__kind">{p.kind}</p>
          <p className="build__stack">{p.stack.join(", ")}</p>
        </header>

        <div className="frame">
          <div className="frame__bar">
            <span className="frame__stage-label" aria-hidden="true">{STAGES[tapStep]}</span>
            <span className="frame__url">{host}</span>
            <span className="frame__stage-label" aria-hidden="true">{index + 1}/{total}</span>
          </div>
          <div className="canvas">
            <svg className="wire wire__sketch" viewBox="0 0 1440 900" aria-hidden="true">
              {p.wireframe.map(([x, y, w, h], i) => (
                <rect
                  key={i}
                  x={x + jitter(i) * 18}
                  y={y + jitter(i + 7) * 14}
                  width={w + jitter(i + 3) * 24}
                  height={h + jitter(i + 5) * 18}
                  rx={8}
                  transform={`rotate(${jitter(i + 11) * 1.4} ${x + w / 2} ${y + h / 2})`}
                />
              ))}
            </svg>
            <svg className="wire wire__crisp" viewBox="0 0 1440 900" aria-hidden="true">
              {p.wireframe.map(([x, y, w, h], i) => (
                <rect key={i} x={x} y={y} width={w} height={h} rx={4} />
              ))}
              <text className="wire__dim" x="1420" y="884" textAnchor="end">1440 × 900</text>
            </svg>
            <img className="shot" src={p.shot} alt={p.shotAlt} loading="lazy" decoding="async" />
            <div className="tree" aria-hidden="true">
              <p className="tree__title">Project structure</p>
              <ul>
                {p.tree.map((t, i) => (
                  <li key={i} style={{ paddingLeft: `${t.depth * 1.4}em` }}>
                    <span className={t.dir ? "tree__dir" : "tree__file"}>
                      {t.name}
                      {t.dir && !t.name.endsWith("/") ? "/" : ""}
                    </span>
                    {t.note && <span className="tree__note">{`  // ${t.note}`}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="build__body">
          <ol className="steps" aria-label={`How ${p.name} was built`}>
            {STAGES.map((s, i) => (
              <li className="step" key={s}>
                <button
                  type="button"
                  className="step__label"
                  aria-pressed={tapStep === i}
                  onClick={() => pick(i)}
                >
                  {s}
                </button>
                <p className="step__text"><span>{p.steps[i]}</span></p>
              </li>
            ))}
          </ol>

          <div className="build__links">
            {p.live && (
              <a className="textlink" href={p.live} target="_blank" rel="noreferrer">
                {p.liveLabel ?? "Visit the live site"}
              </a>
            )}
            {p.code && (
              <a className="textlink textlink--muted" href={p.code} target="_blank" rel="noreferrer">
                Read the code
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
