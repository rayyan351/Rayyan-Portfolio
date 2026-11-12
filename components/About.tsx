"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { history } from "./data";
import AboutArt from "./AboutArt";
import CommitGraph from "./CommitGraph";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/*
 * Large screens with motion: a pinned scene. One rail runs through the middle; each chapter's
 * branch curves into it (study from the left, work from the right), the camera glides down the
 * rail, the year rolls over in the corner and the previous card falls back.
 * Phones, short screens and reduced motion: the static commit graph instead.
 */
const SCENE_QUERY = "(min-width: 1000px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)";

function Scene() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const n = history.length;

  useGSAP(
    () => {
      const el = root.current!;
      const world = el.querySelector<HTMLElement>(".scene__world")!;
      const spacing = () => Math.round(window.innerHeight * 0.62);
      const setSpacing = () => el.style.setProperty("--S", `${spacing()}px`);
      setSpacing();

      let last = -1;
      // Follow the animation itself (not raw scroll), so the chapter changes exactly when the camera arrives.
      const sync = () => {
        const y = gsap.getProperty(world, "y") as number;
        const i = Math.max(0, Math.min(n - 1, Math.round(-y / spacing())));
        if (i !== last) {
          last = i;
          setActive(i);
        }
      };
      // Each chapter holds still for a moment, then the camera glides to the next one.
      const tl = gsap.timeline({ defaults: { ease: "none" }, onUpdate: sync });
      for (let i = 0; i < n - 1; i++) {
        tl.to({}, { duration: 0.55 });
        tl.to(world, { y: () => -(i + 1) * spacing(), duration: 1, ease: "power2.inOut" });
      }
      tl.to({}, { duration: 0.8 });

      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.7,
        animation: tl,
        invalidateOnRefresh: true,
        onRefreshInit: setSpacing,
      });
    },
    { scope: root }
  );

  const c = history[active];
  const years = history.map((h) => h.year);

  return (
    <section id="about" ref={root} className="scene" style={{ height: `${n * 78 + 100}vh` }} aria-labelledby="about-title">
      <div className="scene__stage" data-lane={c.lane}>
        <div className="scene__glow scene__glow--study" aria-hidden="true" />
        <div className="scene__glow scene__glow--work" aria-hidden="true" />

        <div className="scene__head wrap">
          <h2 className="scene__title" id="about-title">How I got here</h2>
          <p className="scene__count" key={active}>
            <span className="scene__num">{String(active + 1).padStart(2, "0")}/{String(n).padStart(2, "0")}</span>
            <span className="scene__short">{c.short}</span>
          </p>
        </div>

        <div className="scene__year" aria-hidden="true">
          <div className="scene__years" style={{ transform: `translateY(${-active * 1.08}em)` }}>
            {years.map((y, i) => <span key={i}>{y}</span>)}
          </div>
        </div>

        <span className="scene__rail scene__rail--past" aria-hidden="true" />
        <span className="scene__rail scene__rail--next" aria-hidden="true" />
        <span className={`scene__dot scene__dot--${c.lane}`} aria-hidden="true" />

        <ol className="scene__world">
          {history.map((h, i) => {
            const state = i === active ? "is-on" : i < active ? "is-past" : "is-next";
            return (
              <li key={h.title} className={`chapter chapter--${h.lane} ${state}`} style={{ ["--i" as string]: i }}>
                <span className="chapter__node" aria-hidden="true" />
                <span className="chapter__tick" aria-hidden="true">{h.year}</span>
                {h.lane !== "work" && (
                  <svg className="chapter__branch chapter__branch--l" viewBox="0 0 120 170" preserveAspectRatio="none" aria-hidden="true">
                    <path className="branch branch--study" d="M2 0 C2 100, 118 70, 118 170" pathLength={1} />
                  </svg>
                )}
                {h.lane !== "study" && (
                  <svg className="chapter__branch chapter__branch--r" viewBox="0 0 120 170" preserveAspectRatio="none" aria-hidden="true">
                    <path className="branch branch--work" d="M118 0 C118 100, 2 70, 2 170" pathLength={1} />
                  </svg>
                )}
                <article className="card">
                  <p className="card__meta">{h.year === "Now" ? "Now" : h.year}, {h.lane === "now" ? "where both branches meet" : h.lane}</p>
                  <h3 className="card__title">{h.title}</h3>
                  <p className="card__body">{h.body}</p>
                  <AboutArt art={h.art} on={i === active} />
                </article>
              </li>
            );
          })}
        </ol>

        <p className="scene__legend wrap" aria-hidden="true">
          <span className="graph__key graph__key--study">study</span>
          <span className="graph__key graph__key--work">work</span>
        </p>
      </div>
    </section>
  );
}

export default function About() {
  const [scene, setScene] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(SCENE_QUERY);
    const on = () => setScene(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    // Layout below the About section shifts when the scene swaps in.
    ScrollTrigger.refresh();
  }, [scene]);

  if (scene) return <Scene />;

  return (
    <section id="about" className="section" aria-labelledby="about-title">
      <div className="wrap">
        <div className="section__head">
          <h2 className="section__title" id="about-title">How I got here</h2>
          <p className="section__intro">
            I care about the parts most people skip: how a project is structured, how it reads on
            a phone, and whether the next developer can find their way around the code.
          </p>
        </div>
        <CommitGraph />
      </div>
    </section>
  );
}
