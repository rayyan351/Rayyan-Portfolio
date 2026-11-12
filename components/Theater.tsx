"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { projects, type Project } from "./data";
import { highlight } from "./highlight";

/*
 * "Watch the build": a full-screen cinematic window that plays a project from idea to ship.
 * Open it from anywhere with openBuild(id, originElement). The frame grows out of whatever
 * was clicked, then a timed sequence plays: sketch, blueprint, real code, the live site.
 */

const STAGES = ["Idea", "Design", "Code", "Ship"] as const;
const AT = [0, 3.4, 6.2, 10]; // when each chapter starts (seconds)
const END = 15.3;

export function openBuild(id: string, origin?: Element | null) {
  window.dispatchEvent(new CustomEvent("watch-build", { detail: { id, origin } }));
}

function jitter(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x) - 0.5;
}

type Lenis = { stop: () => void; start: () => void };

export default function Theater() {
  const [p, setP] = useState<Project | null>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [done, setDone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const origin = useRef<Element | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const reduced = useRef(false);
  const isOpen = useRef(false);

  const index = p ? projects.findIndex((x) => x.id === p.id) : -1;

  // Open requests from the reel and the project index.
  useEffect(() => {
    const on = (e: Event) => {
      const { id, origin: o } = (e as CustomEvent).detail;
      const next = projects.find((x) => x.id === id);
      if (!next) return;
      origin.current = o ?? null;
      opener.current = document.activeElement as HTMLElement;
      setStep(0);
      setDone(false);
      setPlaying(true);
      setP(next);
    };
    window.addEventListener("watch-build", on);
    return () => window.removeEventListener("watch-build", on);
  }, []);

  const close = useCallback(() => {
    const el = root.current;
    tl.current?.kill();
    el?.querySelector<HTMLVideoElement>(".ship-video")?.pause();
    const finish = () => {
      setP(null);
      isOpen.current = false;
      (window as unknown as { __lenis?: Lenis }).__lenis?.start();
      document.documentElement.classList.remove("theater-open");
      window.dispatchEvent(new CustomEvent("theater", { detail: false }));
      opener.current?.focus?.();
    };
    if (!el || reduced.current) return finish();
    gsap.to(el, { autoAlpha: 0, duration: 0.45, ease: "power2.inOut", onComplete: finish });
    gsap.to(el.querySelector(".th__frame"), { scale: 0.94, y: 20, duration: 0.45, ease: "power2.in" });
  }, []);

  // Build and run the sequence whenever a project opens.
  useEffect(() => {
    if (!p) return;
    const el = root.current!;
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isOpen.current) {
      // Only on the first open; "Next project" swaps the film without reopening the window.
      isOpen.current = true;
      (window as unknown as { __lenis?: Lenis }).__lenis?.stop();
      document.documentElement.classList.add("theater-open");
      window.dispatchEvent(new CustomEvent("theater", { detail: true }));
    }
    el.querySelector<HTMLButtonElement>(".th__close")?.focus({ preventScroll: true });

    const q = gsap.utils.selector(el);
    const frame = q(".th__frame")[0];
    const video = q(".ship-video")[0] as HTMLVideoElement | undefined;
    const fills = q(".th__chapter-fill") as HTMLElement[];
    const crisp = Array.from(el.querySelectorAll<SVGRectElement>(".wire__crisp rect"));
    crisp.forEach((r) => {
      const len = 2 * (r.width.baseVal.value + r.height.baseVal.value);
      gsap.set(r, { strokeDasharray: len, strokeDashoffset: len, fillOpacity: 0 });
    });

    let last = -1;
    const t = gsap.timeline({
      paused: true,
      onUpdate: () => {
        const time = t.time();
        const s = time < AT[1] ? 0 : time < AT[2] ? 1 : time < AT[3] ? 2 : 3;
        if (s !== last) {
          last = s;
          setStep(s);
        }
        fills.forEach((f, i) => {
          const end = i < 3 ? AT[i + 1] : END;
          const k = Math.max(0, Math.min(1, (time - AT[i]) / (end - AT[i])));
          f.style.transform = `scaleX(${k})`;
        });
      },
      onComplete: () => setDone(true),
    });

    t.addLabel("Idea", AT[0]).addLabel("Design", AT[1]).addLabel("Code", AT[2]).addLabel("Ship", AT[3]);

    // A slow camera move across the whole film.
    t.fromTo(frame, { rotateX: 12, rotateY: -10, scale: 0.92, transformPerspective: 1800, transformOrigin: "50% 60%" },
      { rotateX: 0, rotateY: 0, scale: 1, duration: AT[3] + 0.6, ease: "power1.inOut" }, 0)
      // Idea: the brief is written out word by word, then a rough sketch appears behind it
      .fromTo(q(".brief__label"), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.15)
      .fromTo(q(".brief__w"), { autoAlpha: 0.06, y: 6 }, { autoAlpha: 1, y: 0, stagger: 0.045, duration: 0.35, ease: "power2.out" }, 0.3)
      .fromTo(q(".brief__rule"), { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: "expo.out" }, 1.2)
      .to(q(".brief"), { autoAlpha: 0.14, scale: 0.97, duration: 0.8, ease: "power2.inOut" }, 2.0)
      .fromTo(q(".wire__sketch rect"), { autoAlpha: 0, scale: 0.96, transformOrigin: "50% 50%" }, { autoAlpha: 1, scale: 1, stagger: 0.09, duration: 0.45, ease: "power2.out" }, 2.1)
      // Design: precise lines take over
      .to(q(".brief"), { autoAlpha: 0, duration: 0.4 }, AT[1])
      .to(q(".wire__sketch"), { autoAlpha: 0, duration: 0.6 }, AT[1])
      .to(crisp, { strokeDashoffset: 0, stagger: 0.12, duration: 0.9, ease: "power2.inOut" }, AT[1] + 0.1)
      .to(crisp, { fillOpacity: 1, duration: 0.6 }, AT[1] + 1.6)
      .fromTo(q(".wire__dim"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, AT[1] + 1.6)
      // Code: folder structure, then real code typing in
      .fromTo(q(".tree"), { xPercent: 10, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, AT[2])
      .from(q(".tree li"), { autoAlpha: 0, x: -8, stagger: 0.06, duration: 0.25 }, AT[2] + 0.2)
      .fromTo(q(".code"), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, AT[2] + 0.5)
      .fromTo(q(".code__src"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", stagger: 0.22, duration: 0.3, ease: "none" }, AT[2] + 0.8)
      // Ship: the site wipes in, then the real footage takes over
      .to([q(".tree"), q(".code")], { autoAlpha: 0, y: -16, duration: 0.5, ease: "power2.in" }, AT[3])
      .fromTo(q(".shot"), { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power2.inOut" }, AT[3] + 0.1)
      .call(() => {
        if (!video) return;
        if (!video.src) video.src = video.dataset.src!;
        video.currentTime = 0;
        video.play().catch(() => {});
      }, [], AT[3] + 0.9)
      .fromTo(q(".ship-video"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, AT[3] + 1.1)
      .to({}, { duration: END - (AT[3] + 1.7) });

    tl.current = t;

    if (reduced.current) {
      t.progress(1).pause();
      setPlaying(false);
      setDone(true);
      return () => { t.kill(); };
    }

    // The window grows out of whatever opened it.
    gsap.set(el, { autoAlpha: 1 });
    const o = origin.current?.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    const intro = gsap.timeline({ onComplete: () => { t.play(0); } });
    intro.fromTo(q(".th__backdrop"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "power2.out" }, 0);
    if (o && o.width > 40) {
      intro.from(q(".th__shell"), {
        x: o.left + o.width / 2 - (f.left + f.width / 2),
        y: o.top + o.height / 2 - (f.top + f.height / 2),
        scale: o.width / f.width,
        duration: 0.9,
        ease: "expo.inOut",
      }, 0);
    } else {
      intro.from(q(".th__shell"), { scale: 0.9, autoAlpha: 0, duration: 0.7, ease: "expo.out" }, 0);
    }
    intro.from(q(".th__top > *, .th__bottom > *"), { y: 14, autoAlpha: 0, stagger: 0.06, duration: 0.5, ease: "power2.out" }, 0.5);

    return () => {
      intro.kill();
      t.kill();
    };
  }, [p]);

  // Keyboard: Esc closes, Space pauses, arrows move between chapters.
  useEffect(() => {
    if (!p) return;
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === " " && (e.target as HTMLElement).tagName !== "BUTTON") { e.preventDefault(); toggle(); }
      if (e.key === "ArrowRight") seek(Math.min(3, step + 1));
      if (e.key === "ArrowLeft") seek(Math.max(0, step - 1));
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  });

  const seek = (i: number) => {
    const t = tl.current;
    if (!t) return;
    t.seek(STAGES[i]);
    if (i < 3) root.current?.querySelector<HTMLVideoElement>(".ship-video")?.pause();
    setDone(false);
    if (playing) t.play();
  };
  const toggle = () => {
    const t = tl.current;
    if (!t) return;
    const v = root.current?.querySelector<HTMLVideoElement>(".ship-video");
    if (done) {
      setDone(false);
      setPlaying(true);
      v?.pause();
      t.restart();
      return;
    }
    if (playing) {
      t.pause();
      v?.pause();
    } else {
      t.play();
      if (step === 3 && v?.src) v.play().catch(() => {});
    }
    setPlaying(!playing);
  };
  const next = () => {
    const n = projects[(index + 1) % projects.length];
    tl.current?.kill();
    root.current?.querySelector<HTMLVideoElement>(".ship-video")?.pause();
    origin.current = null;
    setStep(0);
    setDone(false);
    setPlaying(true);
    setP(n);
  };

  if (!p) return null;
  const host = p.live ? new URL(p.live).host : p.name;

  return createPortal(
    <div
      ref={root}
      className="th"
      role="dialog"
      aria-modal="true"
      aria-label={`How ${p.name} was built`}
      style={{ ["--accent" as string]: p.accent }}
    >
      <div className="th__backdrop" aria-hidden="true" />

      <div className="th__top wrap">
        <div className="th__title">
          <p className="th__count">Project {index + 1} of {projects.length}</p>
          <h2 className="th__name">{p.name}</h2>
          <p className="th__kind">{p.kind}</p>
        </div>
        <button type="button" className="th__close" onClick={close} aria-label="Close">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          <span className="th__esc">Esc</span>
        </button>
      </div>

      <div className="th__stage">
        <div className="th__shell">
          <div className="frame th__frame" key={p.id}>
            <div className="frame__bar">
              <span className="frame__stage-label" aria-hidden="true">{STAGES[step]}</span>
              <span className="frame__url">{host}</span>
              <span className="frame__stage-label" aria-hidden="true">{p.year}</span>
            </div>
            <div className="canvas">
              <svg className="wire wire__sketch" viewBox="0 0 1440 900" aria-hidden="true">
                {p.wireframe.map(([x, y, w, h], i) => (
                  <rect key={i} x={x + jitter(i) * 18} y={y + jitter(i + 7) * 14} width={w + jitter(i + 3) * 24} height={h + jitter(i + 5) * 18} rx={8}
                    transform={`rotate(${jitter(i + 11) * 1.4} ${x + w / 2} ${y + h / 2})`} />
                ))}
              </svg>
              <svg className="wire wire__crisp" viewBox="0 0 1440 900" aria-hidden="true">
                {p.wireframe.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} rx={4} />)}
                <text className="wire__dim" x="1420" y="884" textAnchor="end">1440 × 900</text>
              </svg>
              <div className="brief" aria-hidden="true">
                <p className="brief__label">The brief</p>
                <p className="brief__text">
                  {p.steps[0].split(" ").map((w, i) => <span className="brief__w" key={i}>{w} </span>)}
                </p>
                <span className="brief__rule" />
              </div>
              <img className="shot" src={p.shot} alt={p.shotAlt} decoding="async" />
              {p.video && <video className="ship-video" data-src={p.video} poster={p.shot} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} />}
              <div className="tree" aria-hidden="true">
                <p className="tree__title">Project structure</p>
                <ul>
                  {p.tree.map((t, i) => (
                    <li key={i} style={{ paddingLeft: `${t.depth * 1.4}em` }}>
                      <span className={t.dir ? "tree__dir" : "tree__file"}>{t.name}{t.dir && !t.name.endsWith("/") ? "/" : ""}</span>
                      {t.note && <span className="tree__note">{`  // ${t.note}`}</span>}
                    </li>
                  ))}
                </ul>
              </div>
              {p.excerpt && (
                <div className="code" aria-hidden="true">
                  <p className="code__file">{p.excerpt.file}</p>
                  <pre><code>
                    {p.excerpt.lines.map((l, i) => (
                      <span className="code__line" key={i}>
                        <span className="code__ln">{i + 1}</span>
                        <span className="code__src">{l ? highlight(l) : " "}</span>
                      </span>
                    ))}
                  </code></pre>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="th__caption" aria-live="polite">
          <p className="th__step" key={`l${p.id}${step}`}>{String(step + 1).padStart(2, "0")} {STAGES[step]}</p>
          <p className="th__text" key={`t${p.id}${step}`}>{step === 0 && !done ? "Every build starts as one sentence about the problem. Then a rough sketch." : p.steps[step]}</p>
        </div>
      </div>

      <div className="th__bottom wrap">
        <button type="button" className="th__play" onClick={toggle} aria-label={done ? "Watch again" : playing ? "Pause" : "Play"}>
          {done ? (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.3h4.3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          ) : playing ? (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>
          )}
        </button>
        <ol className="th__chapters">
          {STAGES.map((s, i) => (
            <li key={s}>
              <button type="button" className={`th__chapter${i === step ? " is-on" : ""}${i < step ? " is-past" : ""}`} onClick={() => seek(i)}>
                <span className="th__chapter-track"><span className="th__chapter-fill" /></span>
                <span className="th__chapter-label">{s}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="th__links">
          {p.live && <a className="textlink" href={p.live} target="_blank" rel="noreferrer">Visit the live site</a>}
          {p.code && <a className="textlink textlink--muted" href={p.code} target="_blank" rel="noreferrer">Read the code</a>}
          <button type="button" className="th__next" onClick={next}>Next project</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
