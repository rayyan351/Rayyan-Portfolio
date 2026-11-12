"use client";

import { useEffect, useRef, useState } from "react";
import type { Art } from "./data";
import { openBuild } from "./Theater";

/* Small hand-built visuals, one per chapter of the About scene. */

function FirstHtml() {
  const lines = [
    ["t", '<header class="yt-header">'],
    ["a", '  <input placeholder="Search">'],
    ["t", "</header>"],
    ["t", '<main class="video-grid">'],
    ["a", '  <article class="video-card">'],
  ];
  return (
    <div className="art art--html">
      <pre className="art__code">
        {lines.map(([k, l], i) => (
          <span key={i} className={k === "t" ? "hl-t" : "hl-s"}>{l + "\n"}</span>
        ))}
      </pre>
      <div className="art__thumbs" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} style={{ ["--d" as string]: `${i * 70}ms` }} />
        ))}
      </div>
    </div>
  );
}

function Grades() {
  const rows: [string, number][] = [
    ["Objective exam", 76],
    ["Practicals", 96],
    ["e-Project", 78],
  ];
  return (
    <div className="art art--grades">
      {rows.map(([k, v]) => (
        <div className="grade" key={k}>
          <span className="grade__k">{k}</span>
          <span className="grade__bar"><span style={{ ["--v" as string]: v / 100 }} /></span>
          <span className="grade__v">{v}</span>
        </div>
      ))}
      <div className="grade grade--total">
        <span className="grade__k">Overall</span>
        <span className="grade__badge">Distinction</span>
        <span className="grade__v">82</span>
      </div>
    </div>
  );
}

function Society() {
  return (
    <div className="art art--site">
      <div className="mini-bar"><span /><span /><span /></div>
      <div className="mini-page">
        <p className="mini-title">Science &amp; Technology Society</p>
        <div className="mini-row">
          <span className="mini-card">Events</span>
          <span className="mini-card mini-card--hi">Sceptre Sonic II</span>
          <span className="mini-card">Members</span>
        </div>
        <p className="mini-tag">WordPress</p>
      </div>
    </div>
  );
}

function Calls() {
  return (
    <div className="art art--calls">
      <div className="wave" aria-hidden="true">
        {Array.from({ length: 34 }).map((_, i) => (
          <span key={i} style={{ ["--h" as string]: (0.25 + Math.abs(Math.sin(i * 1.7)) * 0.75).toFixed(2), ["--d" as string]: `${(i % 7) * 90}ms` }} />
        ))}
      </div>
      <div className="chips">
        <span className="chip">DM Clinical Research</span>
        <span className="chip chip--arrow" aria-hidden="true">then</span>
        <span className="chip">Walmart</span>
      </div>
      <p className="art__note">US customers, by phone, in English</p>
    </div>
  );
}

function Semester() {
  return (
    <div className="art art--sem">
      <div className="sem" aria-label="Semester 3 of 8">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className={i < 3 ? "is-done" : ""} style={{ ["--d" as string]: `${i * 60}ms` }} />
        ))}
      </div>
      <p className="art__note">Semester 3 of 8</p>
      <div className="chips">
        <span className="chip">SQL and PostgreSQL program</span>
        <span className="chip">Teknofest &apos;25 design team</span>
      </div>
    </div>
  );
}

function Clip({ src, poster, on, href, label, external, watch }: { src: string; poster: string; on: boolean; href?: string; label: string; external?: boolean; watch?: string }) {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = v.current;
    if (!el) return;
    if (on) {
      if (!el.src) el.src = src;
      el.play().catch(() => {});
    } else el.pause();
  }, [on, src]);
  return (
    <div className="art art--clip">
      <video ref={v} poster={poster} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} />
      {watch ? (
        <button type="button" className="art__link art__link--btn" onClick={(e) => openBuild(watch, e.currentTarget.closest(".art"))}>{label}</button>
      ) : (
        <a className="art__link" href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>{label}</a>
      )}
    </div>
  );
}

function Now() {
  const [t, setT] = useState<{ pk: string; ny: string; diff: number } | null>(null);
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const f = (tz: string) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }).format(d);
      const h = (tz: string) => Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: tz }).format(d)) % 24;
      setT({ pk: f("Asia/Karachi"), ny: f("America/New_York"), diff: (h("Asia/Karachi") - h("America/New_York") + 24) % 24 });
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  // My evenings: 18:00 to 24:00 Karachi. US Eastern workday 09:00 to 17:00, shown in Karachi hours.
  const diff = t?.diff ?? 10;
  const usStart = 9 + diff;
  const overlap = Math.max(0, Math.min(24, usStart + 8) - Math.max(18, usStart));
  const pct = (h: number) => `${(Math.min(h, 24) / 24) * 100}%`;

  return (
    <div className="art art--now">
      <div className="clocks">
        <div><span className="clock__t">{t?.pk ?? "--:--"}</span><span className="clock__z">Karachi</span></div>
        <div><span className="clock__t">{t?.ny ?? "--:--"}</span><span className="clock__z">New York</span></div>
      </div>
      <div className="day" aria-hidden="true">
        <span className="day__me" style={{ left: pct(18), width: pct(6) }} />
        <span className="day__us" style={{ left: pct(usStart), width: `calc(${pct(24)} - ${pct(usStart)})` }} />
      </div>
      <p className="art__note">
        My evenings overlap the US Eastern workday by {overlap} hours.
      </p>
      <a className="art__link" href="#contact">Email me</a>
    </div>
  );
}

export default function AboutArt({ art, on }: { art: Art; on: boolean }) {
  switch (art) {
    case "first-html": return <FirstHtml />;
    case "grades": return <Grades />;
    case "society": return <Society />;
    case "calls": return <Calls />;
    case "semester": return <Semester />;
    case "nexus":
      return <Clip src="/reel/nexus.mp4" poster="/reel/nexus.webp" on={on} href="https://nexus-frontend-ashen-kappa.vercel.app" label="See the archived build" external />;
    case "boc":
      return <Clip src="/reel/boc.mp4" poster="/reel/boc.webp" on={on} watch="boc" label="Watch the build" />;
    case "now": return <Now />;
  }
}
