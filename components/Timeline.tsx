"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { timeline } from "./data";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Timeline() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>(".tl", root.current);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".timeline__fill",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top 65%", end: "bottom 65%", scrub: 0.4 },
          }
        );
        items.forEach((it) =>
          ScrollTrigger.create({ trigger: it, start: "top 65%", toggleClass: "is-on" })
        );
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        items.forEach((it) => it.classList.add("is-on"));
      });
    },
    { scope: root }
  );

  return (
    <div className="timeline" ref={root}>
      <span className="timeline__track" aria-hidden="true">
        <span className="timeline__fill" />
      </span>
      <ol className="timeline__list">
      {timeline.map((t) => (
        <li className="tl" key={t.year}>
          <span className="tl__year">{t.year}</span>
          <div>
            <h3 className="tl__title">{t.title}</h3>
            <p className="tl__body">{t.body}</p>
          </div>
        </li>
      ))}
      </ol>
    </div>
  );
}
