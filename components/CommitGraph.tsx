"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { history } from "./data";

gsap.registerPlugin(ScrollTrigger);

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * My history as a git graph: a study branch and a work branch that run side by side
 * and merge into "now". Paths are measured from the rendered dots, so they follow the
 * text however it wraps.
 */
export default function CommitGraph() {
  const root = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<{ study: string; work: string } | null>(null);

  // Measure dot centres and build the two branch paths.
  useIsoLayoutEffect(() => {
    const el = root.current!;
    const measure = () => {
      const box = el.getBoundingClientRect();
      const pts = Array.from(el.querySelectorAll<HTMLElement>(".commit")).map((li) => {
        const d = li.querySelector(".commit__dot")!.getBoundingClientRect();
        return { lane: li.dataset.lane!, x: d.left + d.width / 2 - box.left, y: d.top + d.height / 2 - box.top };
      });
      const study = pts.filter((p) => p.lane !== "work");
      const work = pts.filter((p) => p.lane === "work");
      if (!study.length || !work.length) return;

      const s = study.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");

      // Work branches off the study commit just before it, and merges into "now".
      const fork = [...study].reverse().find((p) => p.y < work[0].y) ?? study[0];
      const now = study[study.length - 1];
      const wx = work[0].x;
      const first = work[0];
      const last = work[work.length - 1];
      const bend = Math.min(48, (first.y - fork.y) / 2);
      const merge = Math.min(56, (now.y - last.y) / 2);
      const w = [
        `M${fork.x} ${fork.y}`,
        `C${fork.x} ${fork.y + bend}, ${wx} ${first.y - bend}, ${wx} ${first.y}`,
        `L${last.x} ${last.y}`,
        `C${wx} ${last.y + merge}, ${now.x} ${now.y - merge}, ${now.x} ${now.y}`,
      ].join(" ");
      setPaths({ study: s, work: w });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Desktop with motion: branches draw as you scroll. Phones and reduced motion: shown complete.
  useEffect(() => {
    if (!paths) return;
    const el = root.current!;
    const lines = el.querySelectorAll(".graph__path--draw");
    const commits = Array.from(el.querySelectorAll<HTMLElement>(".commit"));
    const mm = gsap.matchMedia();

    mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        lines,
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 72%", end: "bottom 72%", scrub: 0.5 },
        }
      );
      const ts = commits.map((c) =>
        ScrollTrigger.create({ trigger: c, start: "top 72%", toggleClass: { targets: c, className: "is-on" } })
      );
      return () => ts.forEach((t) => t.kill());
    });
    mm.add("(max-width: 899px), (prefers-reduced-motion: reduce)", () => {
      gsap.set(lines, { strokeDashoffset: 0 });
      commits.forEach((c) => c.classList.add("is-on"));
    });
    ScrollTrigger.refresh();
    return () => mm.revert();
  }, [paths]);

  return (
    <div className="graph" ref={root}>
      <p className="graph__legend">
        <span className="graph__key graph__key--study">study</span>
        <span className="graph__key graph__key--work">work</span>
      </p>

      <svg className="graph__svg" aria-hidden="true">
        {paths && (
          <>
            <path className="graph__path graph__path--track" d={paths.study} />
            <path className="graph__path graph__path--track" d={paths.work} />
            <path className="graph__path graph__path--study graph__path--draw" d={paths.study} pathLength={1} />
            <path className="graph__path graph__path--work graph__path--draw" d={paths.work} pathLength={1} />
          </>
        )}
      </svg>

      <ol className="graph__list">
        {history.map((h) => (
          <li key={h.title} className={`commit commit--${h.lane}`} data-lane={h.lane}>
            <span className="commit__dot" aria-hidden="true" />
            <span className="commit__year">{h.year}</span>
            <div className="commit__main">
              <h3 className="commit__title">{h.title}</h3>
              <p className="commit__body">{h.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
