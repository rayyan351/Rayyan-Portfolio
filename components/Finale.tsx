"use client";

import { useCallback, useEffect, useRef } from "react";
import { contact } from "./data";
import FinaleField from "./FinaleField";

/*
 * The footer name is drawn with hatching: the diagonal strokes a draftsman uses to fill a cut
 * section on a blueprint. Strokes plot in from the left when the footer appears, and the ones
 * near the cursor turn brass and lean towards it. One canvas, redrawn only while something moves.
 */

type Mark = { x: number; y: number; bright: boolean; t: number };

const BRASS = [200, 164, 106];
const INK = [231, 228, 221];

export default function Finale() {
  const section = useRef<HTMLElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef({
    marks: [] as Mark[],
    cell: 8,
    w: 0,
    h: 0,
    dpr: 1,
    dot: { x: 0, y: 0, r: 0 },
    start: 0,
    pointer: null as null | { x: number; y: number },
    raf: 0,
    played: false,
    still: false,
  });

  const draw = useCallback((now: number) => {
    const s = state.current;
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    ctx.clearRect(0, 0, s.w, s.h);

    const DUR = 1700;
    const elapsed = s.still ? Infinity : s.start ? now - s.start : -1;
    const half = s.cell * 0.42;
    const R = Math.max(70, s.w * 0.07);
    let animating = false;

    for (const m of s.marks) {
      // Each stroke appears at its own moment as the "plotter" sweeps left to right.
      let k = elapsed < 0 ? 0 : (elapsed - m.t * DUR) / 260;
      if (k < 1) animating = true;
      k = Math.max(0, Math.min(1, k));
      if (k === 0) continue;
      const settle = 1 - Math.pow(1 - k, 3);

      let angle = -Math.PI / 4 + (1 - settle) * (Math.PI / 4); // flat, then settles to a 45° hatch
      let near = 0;
      if (s.pointer) {
        const dx = m.x - s.pointer.x;
        const dy = m.y - s.pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < R) {
          near = 1 - d / R;
          angle = angle * (1 - near) + Math.atan2(dy, dx) * near;
        }
      }
      const base = m.bright ? 0.92 : 0.34;
      const a = base * settle;
      const col = near > 0 ? INK.map((v, i) => Math.round(v + (BRASS[i] - v) * near)) : INK;
      ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${Math.min(1, a + near * 0.5)})`;
      ctx.lineWidth = m.bright ? 1.6 : 1.3;
      const len = half * (1 + near * 0.45);
      const cx = Math.cos(angle) * len;
      const cy = Math.sin(angle) * len;
      ctx.beginPath();
      ctx.moveTo(m.x - cx, m.y - cy);
      ctx.lineTo(m.x + cx, m.y + cy);
      ctx.stroke();
    }

    // The brass full stop lands last.
    const dk = elapsed < 0 ? 0 : Math.max(0, Math.min(1, (elapsed - DUR) / 400));
    if (dk > 0) {
      const { x, y, r } = s.dot;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2);
      g.addColorStop(0, `rgba(200,164,106,${0.45 * dk})`);
      g.addColorStop(1, "rgba(200,164,106,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(200,164,106,${dk})`;
      ctx.beginPath();
      ctx.arc(x, y, r * (0.6 + 0.4 * dk), 0, Math.PI * 2);
      ctx.fill();
    }
    if (dk < 1 && elapsed >= 0) animating = true;

    s.raf = animating ? requestAnimationFrame(draw) : 0;
  }, []);

  const kick = useCallback(() => {
    const s = state.current;
    if (!s.raf) s.raf = requestAnimationFrame(draw);
  }, [draw]);

  // Sample the name into a grid of hatch marks.
  const build = useCallback(() => {
    const s = state.current;
    const el = wrap.current;
    const c = canvas.current;
    if (!el || !c) return;
    const w = el.clientWidth;
    const twoLines = w < 720;
    const cell = w < 480 ? 5 : w < 900 ? 6 : 7;
    const words = ["Muhammad", "Rayyan"];

    const probe = document.createElement("canvas").getContext("2d")!;
    const family = getComputedStyle(document.body).fontFamily;
    const setFont = (px: number) => (probe.font = `900 ${px}px ${family}`);

    // Fit the type to the width, leaving room for the full stop.
    setFont(100);
    const gap = 0.28 * 100;
    const lineW = twoLines
      ? Math.max(probe.measureText(words[0]).width, probe.measureText(words[1]).width) + 40
      : probe.measureText(words[0]).width + gap + probe.measureText(words[1]).width + 40;
    const size = Math.floor((100 * w) / lineW);
    const lineH = size * 1.02;
    const h = Math.ceil(twoLines ? lineH * 2 + size * 0.1 : lineH + size * 0.12);

    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const o = off.getContext("2d")!;
    o.font = `900 ${size}px ${family}`;
    o.textBaseline = "alphabetic";
    o.fillStyle = "#fff";
    const asc = size * 0.8;
    const pos: { x: number; y: number; word: number }[] = [];
    if (twoLines) {
      pos.push({ x: 0, y: asc, word: 0 }, { x: 0, y: asc + lineH, word: 1 });
    } else {
      pos.push({ x: 0, y: asc, word: 0 }, { x: o.measureText(words[0]).width + gap * (size / 100), y: asc, word: 1 });
    }
    const brightFrom = pos[1];
    for (const p of pos) o.fillText(words[p.word], p.x, p.y);

    const data = o.getImageData(0, 0, w, h).data;
    const marks: Mark[] = [];
    for (let y = cell / 2; y < h; y += cell) {
      for (let x = cell / 2; x < w; x += cell) {
        const i = (Math.floor(y) * w + Math.floor(x)) * 4 + 3;
        if (data[i] > 140) {
          const bright = twoLines ? y > asc + size * 0.15 : x >= brightFrom.x - 2;
          // Sweep timing: left to right, with a little jitter so it reads hand-plotted.
          const t = Math.min(0.98, (x / w) * 0.85 + ((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1 + 1) % 1 * 0.12);
          marks.push({ x, y, bright, t });
        }
      }
    }

    const endW = o.measureText(words[1]).width;
    const last = pos[1];
    s.dot = { x: Math.min(w - size * 0.12, last.x + endW + size * 0.16), y: last.y - size * 0.06, r: Math.max(5, size * 0.07) };
    s.marks = marks;
    s.cell = cell;
    s.w = w;
    s.h = h;
    s.dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(w * s.dpr);
    c.height = Math.round(h * s.dpr);
    c.style.height = `${h}px`;
    kick();
  }, [kick]);

  const play = useCallback(() => {
    const s = state.current;
    s.still = false;
    s.start = performance.now();
    s.played = true;
    kick();
  }, [kick]);

  useEffect(() => {
    const s = state.current;
    s.still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    document.fonts.ready.then(() => {
      build();
      ro = new ResizeObserver(() => build());
      ro.observe(wrap.current!);
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting && !s.played && !s.still) play();
        },
        { threshold: 0.4 }
      );
      io.observe(wrap.current!);
    });
    return () => {
      ro?.disconnect();
      io?.disconnect();
      cancelAnimationFrame(s.raf);
    };
  }, [build, play]);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = canvas.current!.getBoundingClientRect();
    state.current.pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    kick();
  };
  const onLeave = () => {
    state.current.pointer = null;
    kick();
  };

  return (
    <section id="contact" ref={section} className="finale" aria-labelledby="contact-title">
      <FinaleField host={section} />
      <div className="wrap finale__inner">
        <h2 className="sr-only" id="contact-title">Contact Muhammad Rayyan</h2>
        <div className="finale__name" ref={wrap} onPointerMove={onMove} onPointerLeave={onLeave}>
          <canvas ref={canvas} aria-hidden="true" />
        </div>

        <p className="finale__lede">
          You get the whole build from one person: the idea, the design, the front end, the back end
          and the admin panel your team uses every day. Then I put it live.
        </p>

        <dl className="finale__facts">
          <div><dt>Based in</dt><dd>Karachi, Pakistan</dd></div>
          <div><dt>Works</dt><dd>Remotely, evenings Pakistan time</dd></div>
          <div><dt>Studying</dt><dd>BS AI, Bahria University</dd></div>
        </dl>

        <div className="finale__actions">
          <a className="finale__cta" href={`mailto:${contact.email}`}>
            <span className="finale__cta-dot" aria-hidden="true" />
            Email me
          </a>
          <a className="finale__link" href={`mailto:${contact.email}`}>{contact.email}</a>
          <a className="finale__link" href={contact.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          <a className="finale__link" href={contact.github} target="_blank" rel="noreferrer">GitHub</a>
        </div>

        <div className="finale__meta">
          <span>Drawn like a section on a blueprint, one hatch at a time.</span>
          <button type="button" className="finale__replay" onClick={play}>
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.3h4.3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Draw it again
          </button>
          <a className="finale__top" href="#top">Back to top</a>
        </div>

        <footer className="finale__foot">
          <span>Designed and built by Muhammad Rayyan, 2026</span>
          <span>Next.js and GSAP</span>
        </footer>
      </div>
    </section>
  );
}
