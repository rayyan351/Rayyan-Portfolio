"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { history } from "./data";
import AboutArt from "./AboutArt";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/*
 * "How I got here" as a transit map. Two lines, study and work, run side by side through the
 * years. The work line branches off at Aptech and both lines meet at Now.
 *
 * Wide screens with motion: the map is pinned and scrolling drives two trains along the lines,
 * lighting the track and each station as they arrive. Without motion, or on short screens, the
 * map is shown complete and the stations are clickable. Phones get the same map drawn vertically.
 */

const SCENE_QUERY = "(min-width: 760px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)";
const MAP_QUERY = "(min-width: 760px)";

const W = 1200;
const H = 300;
const YS = 78; // study line
const YW = 222; // work line
const YM = 150; // where they meet
const XS = [60, 190, 380, 510, 640, 770, 900, 1060]; // one per chapter, in order
const BRANCH = 334; // the work line reaches its level here
const BEND = 988; // both lines turn towards Now here
const NOW = XS[XS.length - 1];
const r = 16; // corner radius
const k = r * Math.SQRT1_2;

const STUDY_D = `M${XS[0]} ${YS} H${BEND - r} Q${BEND} ${YS} ${BEND + k} ${YS + k} L${NOW} ${YM}`;
const WORK_D = `M${XS[1]} ${YS} L${BRANCH - k} ${YW - k} Q${BRANCH} ${YW} ${BRANCH + r} ${YW} H${BEND - r} Q${BEND} ${YW} ${BEND + k} ${YW - k} L${NOW} ${YM}`;

const yOf = (lane: string) => (lane === "study" ? YS : lane === "work" ? YW : YM);
const isInterchange = (i: number) => i === 1 || history[i].lane === "now";
const lineName = (lane: string) => (lane === "study" ? "Study line" : lane === "work" ? "Work line" : "Both lines");

type Sample = { x: number; y: number; a: number }[];

function sample(path: SVGPathElement): Sample {
  const len = path.getTotalLength();
  const out: Sample = [];
  for (let l = 0; l <= len; l += 2) {
    const p = path.getPointAtLength(l);
    const q = path.getPointAtLength(Math.min(len, l + 2));
    const p0 = path.getPointAtLength(Math.max(0, l - 2));
    out.push({ x: p.x, y: p.y, a: (Math.atan2(q.y - p0.y, q.x - p0.x) * 180) / Math.PI });
  }
  return out;
}
function at(s: Sample, x: number) {
  let lo = 0;
  let hi = s.length - 1;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (s[m].x < x) lo = m + 1;
    else hi = m;
  }
  return s[lo];
}

function Train({ lane, refEl }: { lane: "study" | "work"; refEl: React.Ref<SVGGElement> }) {
  return (
    <g ref={refEl} className={`metro__train metro__train--${lane}`} aria-hidden="true">
      <circle className="metro__train-glow" r="30" fill={`url(#metro-glow-${lane})`} />
      <rect x="-19" y="-8" width="38" height="16" rx="8" className="metro__train-body" />
      <rect x="-12" y="-3.5" width="7" height="7" rx="2" className="metro__train-win" />
      <rect x="-3" y="-3.5" width="7" height="7" rx="2" className="metro__train-win" />
      <rect x="6" y="-3.5" width="9" height="7" rx="3" className="metro__train-win metro__train-win--front" />
    </g>
  );
}

type Ride = {
  study: React.RefObject<SVGGElement | null>;
  work: React.RefObject<SVGGElement | null>;
  clip: React.RefObject<SVGRectElement | null>;
  place: (x: number) => void;
};

/* The horizontal map, shared by the scrolling scene and the static version. */
function Map({ active, onPick, lit, ride }: { active: number; onPick: (i: number) => void; lit: number; ride: Ride }) {
  return (
    <div className="metro__map">
      <svg viewBox={`0 0 ${W} ${H}`} className="metro__svg">
        <defs>
          <pattern id="metro-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" className="metro__grid" />
          </pattern>
          <clipPath id="metro-lit">
            <rect ref={ride.clip} x="0" y="0" width={W} height={H} />
          </clipPath>
          <radialGradient id="metro-glow-study"><stop offset="0" stopColor="#8fb0c6" stopOpacity=".5" /><stop offset="1" stopColor="#8fb0c6" stopOpacity="0" /></radialGradient>
          <radialGradient id="metro-glow-work"><stop offset="0" stopColor="#e8a858" stopOpacity=".55" /><stop offset="1" stopColor="#e8a858" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#metro-grid)" aria-hidden="true" />

        <g aria-hidden="true">
          <path d={STUDY_D} className="metro__track metro__track--study is-base" />
          <path d={WORK_D} className="metro__track metro__track--work is-base" />
          <path d={`M${NOW} ${YM} H${W - 20}`} className="metro__track metro__track--next" />
          <g clipPath="url(#metro-lit)">
            <path d={STUDY_D} className="metro__track metro__track--study is-lit" />
            <path d={WORK_D} className="metro__track metro__track--work is-lit" />
          </g>
        </g>

        <Train lane="study" refEl={ride.study} />
        <Train lane="work" refEl={ride.work} />

        {history.map((h, i) => {
          const x = XS[i];
          const y = yOf(h.lane);
          const below = h.lane === "work";
          const now = h.lane === "now";
          const ty = now ? YM - 44 : below ? y + 38 : y - 28;
          const state = `${i <= lit ? " is-lit" : ""}${i === active ? " is-on" : ""}`;
          return (
            <g
              key={h.title}
              className={`metro__stop metro__stop--${h.lane}${isInterchange(i) ? " is-interchange" : ""}${state}`}
              role="button"
              tabIndex={0}
              aria-label={`${h.year === "Now" ? "Now" : h.year}: ${h.title}`}
              aria-pressed={i === active}
              onClick={() => onPick(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(i); }
              }}
            >
              <rect x={x - 62} y={Math.min(y, ty) - 34} width="124" height={Math.abs(ty - y) + 60} className="metro__hit" />
              <circle cx={x} cy={y} r="20" className="metro__pulse" />
              <circle cx={x} cy={y} className="metro__dot" />
              <text x={x} y={ty} className="metro__name" textAnchor="middle">{h.stop}</text>
              {!now && (
                <text x={x} y={below ? ty + 19 : ty - 20} className="metro__year" textAnchor="middle">{h.year}</text>
              )}
            </g>
          );
        })}
      </svg>
      <a className="metro__next" href="#contact" style={{ left: `${((NOW + W - 20) / 2 / W) * 100}%`, top: `${((YM + 16) / H) * 100}%` }}>
        <span>Next stop</span>
        Your project
      </a>
    </div>
  );
}

function Sign({ i }: { i: number }) {
  const h = history[i];
  return (
    <div className="metro__sign" data-lane={h.lane} aria-live="polite">
      <div className="metro__sign-text" key={`t${i}`}>
        <p className="metro__sign-meta">
          <span className={`metro__badge metro__badge--${h.lane}`}>{lineName(h.lane)}</span>
          <span>{h.year === "Now" ? "Now" : h.year}</span>
          <span className="metro__sign-count">Stop {i + 1} of {history.length}</span>
        </p>
        <h3 className="metro__sign-title">{h.title}</h3>
        <p className="metro__sign-body">{h.body}</p>
      </div>
      <div className="metro__sign-art" key={`a${i}`}>
        <AboutArt art={h.art} on />
      </div>
    </div>
  );
}

function Head() {
  return (
    <div className="metro__head wrap">
      <div>
        <h2 className="metro__title" id="about-title">How I got here</h2>
        <p className="metro__legend" aria-hidden="true">
          <span className="metro__key metro__key--study">Study line</span>
          <span className="metro__key metro__key--work">Work line</span>
        </p>
      </div>
      <p className="metro__intro">
        I care about the parts most people skip: how a project is structured, how it reads on a
        phone, and whether the next developer can find their way around the code.
      </p>
    </div>
  );
}

/* Trains and lit track for a position along the map (x in map units). */
function useRide(): Ride {
  const study = useRef<SVGGElement>(null);
  const work = useRef<SVGGElement>(null);
  const clip = useRef<SVGRectElement>(null);
  const samples = useRef<{ s: Sample; w: Sample } | null>(null);

  const place = useCallback((x: number) => {
    const svg = study.current?.ownerSVGElement;
    if (!svg || !work.current || !clip.current) return;
    if (!samples.current) {
      const paths = svg.querySelectorAll<SVGPathElement>(".metro__track.is-lit");
      samples.current = { s: sample(paths[0]), w: sample(paths[1]) };
    }
    const { s, w } = samples.current;
    const ps = at(s, x);
    study.current!.setAttribute("transform", `translate(${ps.x} ${ps.y}) rotate(${ps.a})`);
    const pw = at(w, Math.max(XS[1], x));
    work.current.setAttribute("transform", `translate(${pw.x} ${pw.y}) rotate(${pw.a})`);
    // The work train leaves Aptech once the branch opens.
    work.current.style.opacity = String(Math.max(0, Math.min(1, (x - XS[1] + 4) / 30)));
    clip.current.setAttribute("width", String(x + 1));
  }, []);

  return { study, work, clip, place };
}

const activeAt = (x: number) => {
  let a = 0;
  XS.forEach((sx, i) => { if (x >= sx - 0.5) a = i; });
  return a;
};

function Scene() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const ride = useRide();
  const jump = useRef<(i: number) => void>(() => {});
  const n = history.length;

  useGSAP(
    () => {
      const pos = { x: XS[0] };
      let last = -1;
      const update = () => {
        ride.place(pos.x);
        const a = activeAt(pos.x);
        if (a !== last) {
          last = a;
          setActive(a);
        }
      };
      const tl = gsap.timeline({ defaults: { ease: "none" }, onUpdate: update });
      tl.addLabel("s0", 0);
      for (let i = 0; i < n - 1; i++) {
        tl.to({}, { duration: 0.6 });
        tl.to(pos, { x: XS[i + 1], duration: 1, ease: "power1.inOut" });
        tl.addLabel(`s${i + 1}`);
      }
      tl.to({}, { duration: 0.7 });
      update();

      const st = ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        animation: tl,
        invalidateOnRefresh: true,
      });

      jump.current = (i: number) => {
        const y = st.start + (tl.labels[`s${i}`] / tl.duration()) * (st.end - st.start) + 2;
        const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number, o?: object) => void } }).__lenis;
        if (lenis) lenis.scrollTo(y, { duration: 1.4 });
        else window.scrollTo({ top: y, behavior: "smooth" });
      };
    },
    { scope: root }
  );

  return (
    <section id="about" ref={root} className="metro metro--scene" style={{ height: `${n * 52 + 100}vh` }} aria-labelledby="about-title">
      <div className="metro__stage" data-lane={history[active].lane}>
        <div className="metro__glow" aria-hidden="true" />
        <Head />
        <div className="wrap metro__body">
          <Map active={active} lit={active} onPick={(i) => jump.current(i)} ride={ride} />
          <Sign i={active} />
        </div>
      </div>
    </section>
  );
}

/* No scroll-driving: the whole map is lit, trains wait at Now, stations are clickable. */
function StaticMap() {
  const [active, setActive] = useState(0);
  const ride = useRide();
  const { place } = ride;
  useLayoutEffect(() => { place(NOW); }, [place]);
  return (
    <section id="about" className="metro metro--static" aria-labelledby="about-title">
      <div className="metro__stage" data-lane={history[active].lane}>
        <div className="metro__glow" aria-hidden="true" />
        <Head />
        <div className="wrap metro__body">
          <Map active={active} lit={history.length - 1} onPick={setActive} ride={ride} />
          <Sign i={active} />
          <p className="metro__hint">Select any station to read about that stop.</p>
        </div>
      </div>
    </section>
  );
}

/* Phones: the same two lines, drawn top to bottom beside the stories. */
function VerticalMap() {
  const list = useRef<HTMLOListElement>(null);
  const [geo, setGeo] = useState<{ ys: number[]; h: number } | null>(null);

  useEffect(() => {
    const el = list.current!;
    const measure = () => {
      const rows = el.querySelectorAll<HTMLElement>(".vmetro__row");
      setGeo({ ys: Array.from(rows).map((d) => d.offsetTop + 11), h: el.offsetHeight + 56 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const SX = 12;
  const WX = 42;
  const MX = 27;
  let study = "";
  let work = "";
  if (geo) {
    const y = geo.ys;
    const yn = y[y.length - 1];
    study = `M${SX} ${y[0]} V${yn - 46} C${SX} ${yn - 22} ${MX} ${yn - 26} ${MX} ${yn}`;
    work = `M${SX} ${y[1]} C${SX} ${y[1] + 34} ${WX} ${y[1] + 22} ${WX} ${y[1] + 56} V${yn - 46} C${WX} ${yn - 22} ${MX} ${yn - 26} ${MX} ${yn}`;
  }

  return (
    <section id="about" className="section vmetro" aria-labelledby="about-title">
      <Head />
      <div className="wrap">
        <div className="vmetro__wrap">
          {geo && (
            <svg className="vmetro__svg" width="56" height={geo.h} aria-hidden="true">
              <path d={study} className="metro__track metro__track--study" />
              <path d={work} className="metro__track metro__track--work" />
              <path d={`M${MX} ${geo.ys[geo.ys.length - 1]} V${geo.h - 20}`} className="metro__track metro__track--next" />
              {history.map((h, i) => (
                <circle
                  key={i}
                  cx={h.lane === "study" ? SX : h.lane === "work" ? WX : MX}
                  cy={geo.ys[i]}
                  className={`metro__dot vmetro__dot--${h.lane}${isInterchange(i) ? " is-interchange" : ""}`}
                />
              ))}
            </svg>
          )}
          <ol className="vmetro__list" ref={list}>
            {history.map((h) => (
              <li key={h.title} className={`vmetro__row vmetro__row--${h.lane}`}>
                <p className="metro__sign-meta">
                  <span className={`metro__badge metro__badge--${h.lane}`}>{lineName(h.lane)}</span>
                  <span>{h.year === "Now" ? "Now" : h.year}</span>
                </p>
                <h3 className="vmetro__title">{h.title}</h3>
                <p className="vmetro__body">{h.body}</p>
                {h.lane === "now" && <div className="vmetro__art"><AboutArt art={h.art} on /></div>}
              </li>
            ))}
          </ol>
          <a className="vmetro__next" href="#contact"><span>Next stop</span>Your project</a>
        </div>
      </div>
    </section>
  );
}

export default function About() {
  const [mode, setMode] = useState<"list" | "map" | "scene">("list");

  useEffect(() => {
    const scene = window.matchMedia(SCENE_QUERY);
    const map = window.matchMedia(MAP_QUERY);
    const on = () => setMode(scene.matches ? "scene" : map.matches ? "map" : "list");
    on();
    scene.addEventListener("change", on);
    map.addEventListener("change", on);
    return () => {
      scene.removeEventListener("change", on);
      map.removeEventListener("change", on);
    };
  }, []);

  useEffect(() => {
    // Layout below the About section shifts when the version swaps.
    ScrollTrigger.refresh();
  }, [mode]);

  if (mode === "scene") return <Scene />;
  if (mode === "map") return <StaticMap />;
  return <VerticalMap />;
}
