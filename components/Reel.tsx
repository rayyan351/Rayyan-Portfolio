"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { reel, projects } from "./data";
import { openBuild } from "./Theater";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SLIDE_SECONDS = 8;

/*
 * Performance notes: the tunnel is a single pre-rendered image. Everything that moves here
 * animates only transform and opacity, so the browser composites it on the GPU without
 * repainting. Only the active clip (and the next one) ever load.
 */
export default function Reel() {
  const root = useRef<HTMLElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const layers = useRef<(HTMLImageElement | null)[]>([]);
  const front = useRef(0);
  const progress = useRef<gsap.core.Tween | null>(null);
  const motionOK = useRef(true);
  const inView = useRef(false);
  const hovering = useRef(false);
  const first = useRef(true);

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [autoplay, setAutoplay] = useState(true);

  const count = reel.length;
  const item = reel[active];

  const go = useCallback((next: number) => setActive((next + count) % count), [count]);

  // One-time setup: reduced motion, slow idle drift of the tunnel, and the scroll-in zoom.
  useGSAP(
    () => {
      motionOK.current = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!motionOK.current) {
        setAutoplay(false);
        setPaused(true);
        return;
      }
      gsap.to(".reel__depth", { scale: 1.045, duration: 14, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.fromTo(
        ".reel__zoom",
        { scale: 1.35 },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "top top", scrub: 0.5 },
        }
      );
    },
    { scope: root }
  );

  const syncPlayback = useCallback(() => {
    const running = inView.current && !paused;
    const v = videos.current[active];
    if (v) running ? v.play().catch(() => {}) : v.pause();
    if (progress.current) {
      running && autoplay && !hovering.current ? progress.current.play() : progress.current.pause();
    }
    root.current?.classList.toggle("is-idle", !running);
  }, [active, paused, autoplay]);

  const syncRef = useRef(syncPlayback);
  syncRef.current = syncPlayback;

  // Pause video and timer while the reel is off screen.
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        inView.current = e.isIntersecting;
        syncRef.current();
      },
      { threshold: 0.3 }
    );
    io.observe(root.current!);
    return () => io.disconnect();
  }, []);

  // Slide change.
  useEffect(() => {
    const el = root.current!;
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === active) {
        if (!v.src) v.src = v.dataset.src!;
        v.currentTime = 0;
      } else v.pause();
    });
    const nextV = videos.current[(active + 1) % count];
    if (nextV && !nextV.src) {
      nextV.preload = "auto";
      nextV.src = nextV.dataset.src!;
    }

    const media = el.querySelectorAll<HTMLElement>(".reel__media");
    media.forEach((m, i) => { if (i !== active) gsap.set(m, { autoAlpha: 0 }); });

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

    if (!motionOK.current || first.current) {
      gsap.set(media[active], { autoAlpha: 1, scale: 1 });
      first.current = false;
    } else {
      // Fly forward through the tunnel: the current layer rushes past, the next one arrives from depth.
      const out = layers.current[front.current];
      const inn = layers.current[1 - front.current];
      front.current = 1 - front.current;
      gsap.to(out, { scale: 1.22, autoAlpha: 0, duration: 1.1, ease: "power2.in" });
      gsap.fromTo(inn, { scale: 0.86, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.3, ease: "expo.out", delay: 0.15 });

      gsap.fromTo(".reel__frame", { scale: 0.97, y: 12 }, { scale: 1, y: 0, duration: 0.9, ease: "expo.out" });
      gsap.fromTo(media[active], { autoAlpha: 0, scale: 1.05 }, { autoAlpha: 1, scale: 1, duration: 0.8, ease: "power2.out" });
      gsap.fromTo(".reel__label > *", { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.06, ease: "power2.out" });
    }

    syncRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, autoplay]);

  useEffect(() => { syncPlayback(); }, [paused, syncPlayback]);

  const choose = (i: number) => {
    setAutoplay(false);
    go(i);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); choose(active + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); choose(active - 1); }
  };

  const startX = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => { if (e.pointerType !== "mouse") startX.current = e.clientX; };
  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 45) choose(active + (dx < 0 ? 1 : -1));
  };

  const setHover = (h: boolean) => { hovering.current = h; syncRef.current(); };

  const featured = projects.some((x) => x.id === item.id);
  const external = !item.href.startsWith("#");
  const frameRef = useRef<HTMLDivElement>(null);
  const watch = () => openBuild(item.id, frameRef.current);

  // Hold the reel still while the build window is open, then pick up where it was.
  const wasPaused = useRef(false);
  useEffect(() => {
    const on = (e: Event) => {
      const open = (e as CustomEvent).detail as boolean;
      if (open) {
        setPaused((cur) => {
          wasPaused.current = cur;
          return true;
        });
      } else setPaused(wasPaused.current);
    };
    window.addEventListener("theater", on);
    return () => window.removeEventListener("theater", on);
  }, []);

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
        <div className="reel__zoom">
          <div className="reel__depth">
            {[0, 1].map((i) => (
              <img
                key={i}
                ref={(el) => { layers.current[i] = el; }}
                className="reel__bg"
                src="/reel/tunnel.webp"
                srcSet="/reel/tunnel-sm.webp 1200w, /reel/tunnel.webp 2400w"
                sizes="100vw"
                alt=""
                style={i === 1 ? { opacity: 0, visibility: "hidden" } : undefined}
              />
            ))}
          </div>
        </div>
        {reel.map((r, i) => (
          <div
            key={r.id}
            className={`reel__halo${i === active ? " is-on" : ""}`}
            style={{ ["--accent" as string]: r.accent }}
          />
        ))}
        <div className="reel__fog" />
      </div>

      <div className="wrap reel__ui">
        <div className="reel__head">
          <h2 id="reel-title" className="reel__title">Selected work</h2>
          <p className="reel__count" aria-hidden="true">{active + 1} / {count}</p>
        </div>

        <div
          ref={frameRef}
          className={`reel__frame${featured ? " is-featured" : ""}`}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {reel.map((r, i) => (
            <video
              key={r.id}
              ref={(el) => { videos.current[i] = el; }}
              className="reel__media"
              data-src={r.video}
              poster={r.poster}
              muted
              loop
              playsInline
              preload="none"
              aria-hidden="true"
              tabIndex={-1}
              style={i === 0 ? undefined : { opacity: 0, visibility: "hidden" }}
            />
          ))}

          {featured && (
            <button type="button" className="reel__watch" onClick={watch} tabIndex={-1} aria-hidden="true">
              <span className="reel__watch-icon"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg></span>
              Watch the build
            </button>
          )}

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
          {featured ? (
            <button type="button" className="textlink reel__action reel__action--btn" onClick={watch}>
              Watch the build
            </button>
          ) : (
            <a className="textlink reel__action" href={item.href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
              {item.action}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
