"use client";

import { useRef, useState } from "react";
import { highlight } from "./highlight";
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
const SCRUB_QUERY = "(min-width: 1100px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)";
// Where each stage sits along the pinned scroll (matches the timeline below).
const STAGE_AT = [0.08, 0.36, 0.6, 0.92];

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

        const frame = el.querySelector(".frame");
        const dot = el.querySelector<HTMLElement>(".steps__dot");
        const items = el.querySelectorAll<HTMLElement>(".step");
        const video = el.querySelector<HTMLVideoElement>(".ship-video");
        const rowH = items[items.length - 1]?.offsetHeight ?? 44;
        let pinned = false;

        const playVideo = (on: boolean) => {
          if (!video) return;
          if (on) {
            if (!video.src) video.src = video.dataset.src!;
            video.play().catch(() => {});
          } else video.pause();
        };
        const setStep = (step: number) => {
          el.dataset.step = String(step);
          if (label) label.textContent = STAGES[step];
          if (dot) gsap.to(dot, { y: step * rowH, duration: 0.55, ease: "power3.out" });
          playVideo(pinned && step === 3);
        };

        const bounds = [1, 2.2, 3.3];
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          onUpdate: () => {
            const t = tl.time();
            const step = t < bounds[0] ? 0 : t < bounds[1] ? 1 : t < bounds[2] ? 2 : 3;
            if (el.dataset.step !== String(step)) setStep(step);
          },
        });
        // The frame starts tilted on the drafting table and settles flat as the build completes.
        tl.fromTo(
          frame,
          { rotateX: 16, rotateY: -14, rotateZ: 1.5, scale: 0.88, transformPerspective: 1700, transformOrigin: "50% 60%" },
          { rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1, duration: 3.4, ease: "power1.inOut" },
          0
        )
          // Idea: loose sketch
          .from(".wire__sketch rect", { autoAlpha: 0, stagger: 0.05, duration: 0.6 }, 0)
          // Design: precise blueprint lines replace the sketch
          .to(".wire__sketch", { autoAlpha: 0, duration: 0.4 }, 1)
          .to(crisp, { strokeDashoffset: 0, stagger: 0.05, duration: 0.6 }, 1)
          .to(crisp, { fillOpacity: 1, duration: 0.3 }, 1.6)
          .from(".wire__dim", { autoAlpha: 0, duration: 0.2 }, 1.6)
          // Code: the real folder structure, then real code from the repo types in line by line
          .fromTo(".tree", { xPercent: 10, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.3 }, 2.2)
          .from(".tree li", { autoAlpha: 0, x: -8, stagger: 0.04, duration: 0.12 }, 2.3)
          .fromTo(".code", { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.25 }, 2.25)
          .fromTo(".code__src", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", stagger: 0.07, duration: 0.14 }, 2.35)
          // Ship: the finished site wipes in, then the real footage takes over
          .fromTo(".shot", { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "power1.inOut" }, 3.3)
          .to([".tree", ".code"], { autoAlpha: 0, y: -14, duration: 0.3 }, 3.3)
          .fromTo(".ship-video", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 }, 3.95)
          .to({}, { duration: 0.6 });

        ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          animation: tl,
          onToggle: (self) => {
            pinned = self.isActive;
            playVideo(pinned && el.dataset.step === "3");
          },
        });

        return () => {
          scrubbed.current = false;
          video?.pause();
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
            {p.video && (
              <video className="ship-video" data-src={p.video} poster={p.shot} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} />
            )}
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
            {p.excerpt && (
              <div className="code" aria-hidden="true">
                <p className="code__file">{p.excerpt.file}</p>
                <pre>
                  <code>
                    {p.excerpt.lines.map((l, i) => (
                      <span className="code__line" key={i}>
                        <span className="code__ln">{i + 1}</span>
                        <span className="code__src">{l ? highlight(l) : " "}</span>
                      </span>
                    ))}
                  </code>
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="build__body">
          <div className="steps-wrap">
          <span className="steps__dot" aria-hidden="true" />
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
          </div>

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
