"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { openBuild } from "./Theater";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/*
 * About, told as one paragraph in large type. The words light up as you read down the page,
 * and small live pieces sit inside the sentences where the story mentions them.
 */

type Inline =
  | { kind: "thumbs" }
  | { kind: "score" }
  | { kind: "wave" }
  | { kind: "semester" }
  | { kind: "video"; src: string; poster: string; label: string; href?: string; watch?: string }
  | { kind: "clock" };

const story: (string | Inline)[] = [
  "I taught myself HTML and CSS from YouTube in 2022, and the first thing I built was YouTube",
  { kind: "thumbs" },
  ". In 2023 I finished my Aptech diploma with Distinction",
  { kind: "score" },
  ", scoring 96 out of 100 in practicals, and ran the websites for my college's science society. Then I spent five months on calls with American customers at ibex",
  { kind: "wave" },
  ". Now I'm studying AI at Bahria University",
  { kind: "semester" },
  ". Along the way I designed and built a website for a company in London",
  { kind: "video", src: "/reel/nexus.mp4", poster: "/reel/nexus.webp", label: "Open the archived Nexus site", href: "https://nexus-frontend-ashen-kappa.vercel.app" },
  " and spent a month building Burger O'Clock's ordering platform and admin system at CodeLabs",
  { kind: "video", src: "/reel/boc.mp4", poster: "/reel/boc.webp", label: "Watch how Burger O'Clock was built", watch: "boc" },
  ". It's",
  { kind: "clock" },
  "in Karachi right now. My evenings overlap the American morning, and that's when I build.",
];

function Clock() {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setT(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Karachi" }).format(new Date()));
    tick();
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
  }, []);
  const [h, m] = (t ?? "--:--").split(":");
  return (
    <span className="tell__clock" aria-label={t ? `${t} in Karachi` : undefined}>
      {h}<span className="tell__colon">:</span>{m}
    </span>
  );
}

function Piece({ item }: { item: Inline }) {
  const v = useRef<HTMLVideoElement>(null);

  // Clips load and play only while they are on screen.
  useEffect(() => {
    const el = v.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!el.src) el.src = el.dataset.src!;
        el.play().catch(() => {});
      } else el.pause();
    }, { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  switch (item.kind) {
    case "thumbs":
      return (
        <span className="tell__piece tell__thumbs" aria-hidden="true">
          <svg viewBox="0 0 40 22">
            <rect x="0" y="0" width="40" height="4" className="yt-bar" />
            <rect x="3" y="1.2" width="4" height="1.6" rx=".5" className="yt-logo" />
            <rect x="14" y="1.1" width="13" height="1.8" rx=".9" className="yt-search" />
            {[0, 1, 2].map((c) => [0, 1].map((r) => (
              <rect key={`${c}${r}`} x={3 + c * 12} y={6.5 + r * 7.5} width="10" height="5.6" rx=".8" className={c === 0 && r === 0 ? "yt-thumb is-play" : "yt-thumb"} />
            )))}
          </svg>
        </span>
      );
    case "score":
      return (
        <span className="tell__piece tell__seal" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path className="seal__edge" d={Array.from({ length: 24 }).map((_, i) => {
              const a = (i / 24) * Math.PI * 2;
              const rr = i % 2 ? 10.2 : 11.8;
              return `${i ? "L" : "M"}${(12 + Math.cos(a) * rr).toFixed(2)} ${(12 + Math.sin(a) * rr).toFixed(2)}`;
            }).join(" ") + "Z"} />
            <circle cx="12" cy="12" r="7.4" className="seal__ring" />
            <path d="M8.6 12.3l2.3 2.3 4.6-5" className="seal__tick" />
          </svg>
        </span>
      );
    case "wave":
      return (
        <span className="tell__piece tell__wave" aria-hidden="true">
          {Array.from({ length: 11 }).map((_, i) => (
            <span key={i} style={{ ["--h" as string]: (0.3 + Math.abs(Math.sin(i * 1.9)) * 0.7).toFixed(2), ["--d" as string]: `${(i % 5) * 120}ms` }} />
          ))}
        </span>
      );
    case "semester":
      return (
        <span className="tell__piece tell__sem" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => <span key={i} className={i < 3 ? "is-done" : ""} />)}
        </span>
      );
    case "clock":
      return <Clock />;
    case "video": {
      const media = <video ref={v} data-src={item.src} poster={item.poster} muted loop playsInline preload="none" tabIndex={-1} aria-hidden="true" />;
      if (item.watch) {
        const id = item.watch;
        return (
          <button type="button" className="tell__piece tell__clip" aria-label={item.label} onClick={(e) => openBuild(id, e.currentTarget)}>
            {media}
          </button>
        );
      }
      return (
        <a className="tell__piece tell__clip" href={item.href} target="_blank" rel="noreferrer" aria-label={item.label}>
          {media}
        </a>
      );
    }
  }
}

export default function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const text = root.current!.querySelector(".tell__text")!;
        const parts = gsap.utils.toArray<HTMLElement>(".tell__w, .tell__piece, .tell__clock", text);
        const tl = gsap.timeline({
          scrollTrigger: { trigger: text, start: "top 78%", end: "bottom 62%", scrub: 0.5 },
        });
        parts.forEach((el, i) => {
          const at = i * 0.12;
          if (el.classList.contains("tell__w")) tl.fromTo(el, { opacity: 0.13 }, { opacity: 1, duration: 0.3, ease: "none" }, at);
          else tl.fromTo(el, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }, at);
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  // Flatten the story into words, spaces and pieces. Each piece is kept on the same line as the
  // word before it and any punctuation after it, so a line never starts with a comma or a clip.
  type Tok = { w: string } | { s: true } | { p: Inline };
  const toks: Tok[] = [];
  story.forEach((part) => {
    if (typeof part !== "string") return toks.push({ p: part });
    part.split(/(\s+)/).forEach((w) => {
      if (!w) return;
      toks.push(/^\s+$/.test(w) ? { s: true } : { w });
    });
  });
  const out: React.ReactNode[] = [];
  const word = (w: string, key: string) => <span className="tell__w" key={key}>{w}</span>;
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    const nx = toks[i + 1];
    const piece = nx && "p" in nx ? nx.p : null;
    if ("w" in t && piece) {
      const after = toks[i + 2];
      const punct = after && "w" in after && /^[.,;:]/.test(after.w) ? after.w : null;
      out.push(
        <span className="tell__keep" key={`k${i}`}>
          {word(t.w, `w${i}`)}
          <Piece item={piece} />
          {punct && word(punct, `w${i + 2}`)}
        </span>
      );
      i += punct ? 2 : 1;
    } else if ("w" in t) out.push(word(t.w, `w${i}`));
    else if ("s" in t) out.push(" ");
    else out.push(<Piece key={`p${i}`} item={t.p} />);
  }

  return (
    <section id="about" ref={root} className="tell" aria-labelledby="about-title">
      <div className="wrap">
        <h2 className="sr-only" id="about-title">How I got here</h2>
        <p className="tell__text">{out}</p>
      </div>
    </section>
  );
}
