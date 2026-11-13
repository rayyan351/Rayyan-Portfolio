"use client";

import { useEffect, useRef, useState } from "react";
import type { Lofi } from "./lofi";

/*
 * Background music control for the top bar. Silent until someone presses it: the audio engine is
 * only loaded and started on that click. Live bars show the music; the slider sets the volume,
 * which is remembered for the next visit.
 */

const BARS = 7;
const WEIGHT = [1.35, 1.25, 1, 1.4, 3.2, 4.4, 5.4]; // evens out a warm mix across the bars
const KEY = "sound-volume";

type Engine = {
  ctx: AudioContext;
  master: GainNode;
  analyser: AnalyserNode;
  lofi: Lofi;
  bar: number;
  next: number;
  timer: number;
};

const level = (v: number) => Math.pow(v / 100, 1.6);

export default function Sound() {
  const [on, setOn] = useState(false);
  const [volume, setVolume] = useState(45);
  const engine = useRef<Engine | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const still = useRef(false);

  useEffect(() => {
    still.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      const saved = Number(localStorage.getItem(KEY));
      if (saved > 0 && saved <= 100) setVolume(saved);
    } catch {}
    draw(null);
    return () => {
      cancelAnimationFrame(raf.current);
      const e = engine.current;
      if (e) {
        clearInterval(e.timer);
        e.ctx.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The bars: live from the analyser while playing, a quiet resting shape otherwise.
  const draw = (data: Uint8Array | null) => {
    const c = canvas.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = 22;
    const h = 16;
    if (c.width !== w * dpr) {
      c.width = w * dpr;
      c.height = h * dpr;
    }
    const g = c.getContext("2d")!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const bw = 2;
    const gap = (w - BARS * bw) / (BARS - 1);
    for (let i = 0; i < BARS; i++) {
      let v = [0.25, 0.4, 0.3, 0.5, 0.35, 0.28, 0.2][i];
      if (data) {
        // Bars spread over the range the music lives in (about 60 Hz to 3 kHz, 43 Hz a bin),
        // the higher ones boosted because a warm mix has less energy up there.
        const lo = Math.round(1.4 * Math.pow(48, i / BARS));
        const hi = Math.max(lo + 1, Math.round(1.4 * Math.pow(48, (i + 1) / BARS)));
        let sum = 0;
        for (let k = lo; k < hi; k++) sum += data[k];
        const avg = sum / (hi - lo) / 255;
        v = Math.max(0.14, Math.min(1, Math.pow(avg, 1.4) * WEIGHT[i]));
      }
      const bh = Math.max(2, v * h);
      g.fillStyle = data ? "#c8a46a" : "rgba(231,228,221,0.45)";
      g.beginPath();
      g.roundRect(i * (bw + gap), (h - bh) / 2, bw, bh, 1);
      g.fill();
    }
  };

  const loop = () => {
    const e = engine.current;
    if (!e) return;
    const data = new Uint8Array(e.analyser.frequencyBinCount);
    e.analyser.getByteFrequencyData(data);
    draw(data);
    raf.current = requestAnimationFrame(loop);
  };

  const schedule = () => {
    const e = engine.current!;
    // Whole bars are queued about a second and a half ahead, so a throttled background tab keeps time.
    while (e.next < e.ctx.currentTime + 1.6) {
      e.lofi.scheduleBar(e.bar, e.next);
      e.bar += 1;
      e.next += BAR_SECONDS;
    }
  };

  const start = async () => {
    if (!engine.current) {
      const { createLofi } = await import("./lofi");
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx({ latencyHint: "playback" });
      const master = ctx.createGain();
      master.gain.value = 0;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.78;
      master.connect(analyser).connect(ctx.destination);
      const lofi = createLofi(ctx, master);
      engine.current = { ctx, master, analyser, lofi, bar: 0, next: 0, timer: 0 };
    }
    const e = engine.current;
    await e.ctx.resume();
    const now = e.ctx.currentTime;
    e.next = now + 0.08;
    e.lofi.startBed(now);
    e.master.gain.cancelScheduledValues(now);
    e.master.gain.setValueAtTime(e.master.gain.value, now);
    e.master.gain.linearRampToValueAtTime(level(volume), now + 2.5);
    schedule();
    e.timer = window.setInterval(schedule, 200);
    if (!still.current) raf.current = requestAnimationFrame(loop);
    else draw(new Uint8Array(512).fill(170));
  };

  const stop = () => {
    const e = engine.current;
    if (!e) return;
    const now = e.ctx.currentTime;
    clearInterval(e.timer);
    e.master.gain.cancelScheduledValues(now);
    e.master.gain.setValueAtTime(e.master.gain.value, now);
    e.master.gain.linearRampToValueAtTime(0, now + 0.6);
    e.lofi.stopBed(now + 0.65);
    cancelAnimationFrame(raf.current);
    draw(null);
    window.setTimeout(() => {
      if (!engine.current || engine.current.timer !== e.timer) return;
      e.ctx.suspend();
    }, 700);
  };

  const toggle = () => {
    if (on) {
      stop();
      setOn(false);
    } else {
      setOn(true);
      start();
    }
  };

  const changeVolume = (v: number) => {
    setVolume(v);
    try { localStorage.setItem(KEY, String(v)); } catch {}
    const e = engine.current;
    if (e && on) e.master.gain.setTargetAtTime(level(v), e.ctx.currentTime, 0.08);
  };

  return (
    <div className={`sound${on ? " is-on" : ""}`}>
      <button
        type="button"
        className="sound__btn"
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? "Turn the background music off" : "Turn on background music"}
        title={on ? "Music on" : "Play some calm background music"}
      >
        <canvas ref={canvas} className="sound__viz" aria-hidden="true" />
        <span className="sound__label">{on ? "Sound on" : "Sound"}</span>
      </button>
      <label className="sound__vol">
        <span className="sr-only">Volume</span>
        <input
          type="range"
          min={1}
          max={100}
          value={volume}
          onChange={(e) => changeVolume(Number(e.target.value))}
          tabIndex={on ? 0 : -1}
          style={{ ["--v" as string]: `${volume}%` }}
        />
      </label>
    </div>
  );
}

const BAR_SECONDS = (60 / 74) * 4;
