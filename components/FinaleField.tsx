"use client";

import { useEffect, useRef } from "react";

/*
 * The footer's ruled lines, drawn as a field of tiny marks. Around the cursor they light up
 * brass and tilt into hatch strokes, and a glowing brass dot stands in for the pointer.
 * Only the patch around the cursor is redrawn each frame. Mouse and trackpad only.
 */

const GX = 10; // column spacing
const GY = 8; // row spacing (matches the old ruled lines)
const R = 120; // light radius
const INK = [231, 228, 221];
const BRASS = [232, 168, 88];

export default function FinaleField({ host }: { host: React.RefObject<HTMLElement | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    const c = canvas.current;
    const d = dot.current;
    if (!el || !c || !d) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const ctx = c.getContext("2d")!;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let power = 0; // 0 when the pointer is away, eases to 1 when it is in the footer
    let inside = false;
    let raf = 0;
    let prev: [number, number, number, number] | null = null;

    const paint = (x0: number, y0: number, x1: number, y1: number) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y0, x1 - x0, y1 - y0);
      ctx.clip();
      ctx.clearRect(x0, y0, x1 - x0, y1 - y0);

      if (power > 0.01) {
        const g = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, R * 1.1);
        g.addColorStop(0, `rgba(232,168,88,${0.2 * power})`);
        g.addColorStop(1, "rgba(214,160,92,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      }

      const c0 = Math.max(0, Math.floor(x0 / GX));
      const c1 = Math.ceil(x1 / GX);
      const r0 = Math.max(0, Math.floor(y0 / GY));
      const r1 = Math.ceil(y1 / GY);
      for (let r = r0; r <= r1; r++) {
        const y = r * GY + GY / 2;
        for (let col = c0; col <= c1; col++) {
          const x = col * GX + GX / 2;
          let k = 0;
          if (power > 0.01) {
            const dd = Math.hypot(x - pos.x, y - pos.y);
            if (dd < R) {
              k = 1 - dd / R;
              k = k * k * (3 - 2 * k) * power; // smoothstep falloff
            }
          }
          if (k < 0.02) {
            // Resting state: a short horizontal dash, like ruled drafting film.
            ctx.strokeStyle = "rgba(231,228,221,0.07)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - 2.5, y);
            ctx.lineTo(x + 2.5, y);
            ctx.stroke();
            continue;
          }
          // Lit: the dash tilts into a 45° hatch, grows and warms to brass.
          const ang = -Math.PI / 4 * Math.min(1, k * 1.6);
          const len = 2.5 + k * 3;
          const col3 = INK.map((v, i) => Math.round(v + (BRASS[i] - v) * Math.min(1, k * 2)));
          ctx.strokeStyle = `rgba(${col3[0]},${col3[1]},${col3[2]},${Math.min(1, 0.1 + k * 1.15)})`;
          ctx.lineWidth = 1 + k * 1.1;
          const dx = Math.cos(ang) * len;
          const dy = Math.sin(ang) * len;
          ctx.beginPath();
          ctx.moveTo(x - dx, y - dy);
          ctx.lineTo(x + dx, y + dy);
          ctx.stroke();
        }
      }
      ctx.restore();
    };

    const resize = () => {
      w = el.clientWidth;
      h = el.clientHeight;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      prev = null;
      paint(0, 0, w, h);
    };

    const box = (): [number, number, number, number] => [pos.x - R - GX, pos.y - R - GY, pos.x + R + GX, pos.y + R + GY];

    const frame = () => {
      pos.x += (target.x - pos.x) * 0.22;
      pos.y += (target.y - pos.y) * 0.22;
      power += ((inside ? 1 : 0) - power) * 0.14;

      d.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${0.4 + 0.6 * power})`;
      d.style.opacity = String(power);

      const now = box();
      const r = prev
        ? [Math.min(prev[0], now[0]), Math.min(prev[1], now[1]), Math.max(prev[2], now[2]), Math.max(prev[3], now[3])]
        : now;
      paint(Math.max(0, r[0]), Math.max(0, r[1]), Math.min(w, r[2]), Math.min(h, r[3]));
      prev = now;

      const settled = Math.abs(target.x - pos.x) < 0.3 && Math.abs(target.y - pos.y) < 0.3 && Math.abs((inside ? 1 : 0) - power) < 0.01;
      if (settled) {
        if (!inside) {
          power = 0;
          paint(Math.max(0, now[0]), Math.max(0, now[1]), Math.min(w, now[2]), Math.min(h, now[3]));
        }
        raf = 0;
      } else raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const local = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      return { x: e.clientX - b.left, y: e.clientY - b.top };
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const p = local(e);
      if (!inside && power < 0.05) {
        pos.x = p.x;
        pos.y = p.y;
      }
      target.x = p.x;
      target.y = p.y;
      inside = true;
      el.classList.add("has-field-cursor");
      kick();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!inside) return onEnter(e);
      const p = local(e);
      target.x = p.x;
      target.y = p.y;
      // Grow the dot over anything clickable.
      const hot = (e.target as HTMLElement).closest("a, button");
      d.classList.toggle("is-hot", !!hot);
      kick();
    };
    const onLeave = () => {
      inside = false;
      el.classList.remove("has-field-cursor");
      d.classList.remove("is-hot");
      kick();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      ro.disconnect();
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [host]);

  return (
    <>
      <canvas ref={canvas} className="field" aria-hidden="true" />
      <div ref={dot} className="field__dot" aria-hidden="true" />
    </>
  );
}
