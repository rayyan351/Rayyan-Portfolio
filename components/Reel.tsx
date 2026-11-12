"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { reel } from "./data";

gsap.registerPlugin(useGSAP);

const SLIDE_SECONDS = 8;

export default function Reel() {
  const root = useRef<HTMLElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const progress = useRef<gsap.core.Tween | null>(null);
  const drift = useRef<gsap.core.Tween | null>(null);
  const motionOK = useRef(true);
  const inView = useRef(false);
  const hovering = useRef(false);

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [autoplay, setAutoplay] = useState(true);

  const count = reel.length;
  const item = reel[active];

  // Fit the fixed 1600x1000 tunnel stage to cover the section.
  useEffect(() => {
    const el = root.current!;
    const fit = () => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--s", String(Math.max(r.width / 1600, r.height / 1000) * 1.02));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = useCallback(
    (next: number) => {
      const n = (next + count) % count;
      setActive(n);
    },
    [count]
  );

  // Continuous tunnel drift + one-time setup.
  useGSAP(
    () => {
      motionOK.current = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!motionOK.current) {
        // Nothing moves until the visitor presses play.
        setAutoplay(false);
        setPaused(true);
        return;
      }
      const state = { d: 0 };
      drift.current = gsap.to(state, {
        d: 1,
        duration: 7,
        ease: "none",
        repeat: -1,
        paused: true,
        onUpdate: () => root.current?.style.setProperty("--drift", state.d.toFixed(4)),
      });
    },
    { scope: root }
  );

  const syncPlayback = useCallback(() => {
    const running = inView.current && !paused;
    const v = videos.current[active];
    if (v) {
      if (running) v.play().catch(() => {});
      else v.pause();
    }
    if (drift.current) running ? drift.current.play() : drift.current.pause();
    if (progress.current) {
      running && autoplay && !hovering.current ? progress.current.play() : progress.current.pause();
    }
  }, [active, paused, autoplay]);

  const syncRef = useRef(syncPlayback);
  syncRef.current = syncPlayback;

  // Pause everything while the reel is off screen.
  useEffect(() => {
    const el = root.current!;
    const io = new IntersectionObserver(
      ([e]) => {
        inView.current = e.isIntersecting;
        syncRef.current();
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Slide change: swap video, push the tunnel forward, restart the progress bar.
  useEffect(() => {
    const el = root.current!;
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === active) {
        if (!v.src) v.src = v.dataset.src!;
        v.currentTime = 0;
      } else {
        v.pause();
      }
    });
    // Warm the next clip so the cut is instant.
    const nextV = videos.current[(active + 1) % count];
    if (nextV && !nextV.src) {
      nextV.preload = "auto";
      nextV.src = nextV.dataset.src!;
    }

    const bars = el.querySelectorAll<HTMLElement>(".reel__dot-fill");
    bars.forEach((b, i) => gsap.set(b, { scaleX: i < active ? 1 : 0 }));

    progress.current?.kill();
    if (autoplay) {
      progress.current = gsap.fromTo(
        bars[active],
        { scaleX: 0 },
        { scaleX: 1, duration: SLIDE_SECONDS, ease: "none", paused: true, onComplete: () => go(active + 1) }
      );
    } else {
      gsap.set(bars[active], { scaleX: 1 });
    }

    const media = el.querySelectorAll<HTMLElement>(".reel__media");
    media.forEach((m, i) => { if (i !== active) gsap.set(m, { autoAlpha: 0 }); });
    if (!motionOK.current) gsap.set(media[active], { autoAlpha: 1 });

    if (motionOK.current) {
      const frame = el.querySelector(".reel__frame");
      gsap.fromTo(frame, { scale: 0.965, y: 10 }, { scale: 1, y: 0, duration: 0.9, ease: "expo.out" });
      gsap.fromTo(
        media[active],
        { autoAlpha: 0, scale: 1.04 },
        { autoAlpha: 1, scale: 1, duration: 0.8, ease: "power2.out" }
      );
      gsap.fromTo(".reel__label > *", { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.06, ease: "power2.out" });
      if (drift.current) {
        gsap.fromTo(drift.current, { timeScale: 9 }, { timeScale: 1, duration: 1.1, ease: "power3.out" });
      }
    }

    syncRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, autoplay]);

  useEffect(() => {
    syncPlayback();
  }, [paused, syncPlayback]);

  const choose = (i: number) => {
    // A deliberate pick stops the automatic advance so the visitor can look.
    setAutoplay(false);
    go(i);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); choose(active + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); choose(active - 1); }
  };

  // Swipe on touch screens.
  const startX = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => { if (e.pointerType !== "mouse") startX.current = e.clientX; };
  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 45) choose(active + (dx < 0 ? 1 : -1));
  };

  const setHover = (h: boolean) => {
    hovering.current = h;
    syncRef.current();
  };

  const external = !item.href.startsWith("#");

  return (
    <section
      id="work"
      ref={root}
      className="reel"
      aria-roledescription="carousel"
      aria-labelledby="reel-title"
      onKeyDown={onKey}
    >
      <div className="reel__tunnel" aria-hidden="true">
        <div className="reel__stage">
          <div className="reel__world">
            <div className="reel__wall reel__wall--left" />
            <div className="reel__wall reel__wall--right" />
            <div className="reel__wall reel__wall--top" />
            <div className="reel__wall reel__wall--bottom" />
          </div>
        </div>
        <div className="reel__fog" />
      </div>

      <div className="wrap reel__ui">
        <div className="reel__head">
          <h2 id="reel-title" className="reel__title">Selected work</h2>
          <p className="reel__count" aria-hidden="true">
            {active + 1} / {count}
          </p>
        </div>

        <div
          className="reel__frame"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {reel.map((r, i) => (
            <video
              key={r.id}
              ref={(el) => { videos.current[i] = el; }}
              className={`reel__media${i === active ? " is-active" : ""}`}
              data-src={r.video}
              poster={r.poster}
              muted
              loop
              playsInline
              preload="none"
              aria-hidden="true"
              tabIndex={-1}
            />
          ))}

          <div className="reel__label" aria-live={autoplay && !paused ? "off" : "polite"}>
            <span className="reel__name">{item.name}</span>
            <span className="reel__kind">{item.kind}</span>
          </div>

          <button
            type="button"
            className="reel__pause"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Play the reel" : "Pause the reel"}
          >
            {paused ? (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
            )}
          </button>
        </div>

        <div className="reel__foot">
          <div className="reel__dots" role="tablist" aria-label="Projects">
            {reel.map((r, i) => (
              <button
                key={r.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={r.name}
                className="reel__dot"
                onClick={() => choose(i)}
              >
                <span className="reel__dot-fill" />
              </button>
            ))}
          </div>
          <a
            className="textlink reel__action"
            href={item.href}
            {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            {item.action}
          </a>
        </div>
      </div>
    </section>
  );
}
