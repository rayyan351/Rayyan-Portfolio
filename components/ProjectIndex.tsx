"use client";

import { projects, moreWork } from "./data";
import { openBuild } from "./Theater";

/* Every project in one scannable list. Featured ones open the build window. */
export default function ProjectIndex() {
  return (
    <section className="section index" aria-labelledby="index-title">
      <div className="wrap">
        <div className="section__head">
          <h2 className="section__title" id="index-title">Every project</h2>
          <p className="section__intro">
            Four of them can be watched from idea to ship: the sketch, the design, the real code and
            the site that went live.
          </p>
        </div>
        <ul className="more">
          {projects.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="more__row more__row--watch"
                onClick={(e) => openBuild(p.id, e.currentTarget)}
                style={{ ["--accent" as string]: p.accent }}
              >
                <span className="more__name">{p.name}</span>
                <span className="more__kind">{p.kind}</span>
                <span className="more__stack">{p.stack.join(", ")}</span>
                <span className="more__go more__go--watch">
                  <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>
                  Watch the build
                </span>
              </button>
            </li>
          ))}
          {moreWork.map((m) => (
            <li key={m.name}>
              <a className="more__row" href={m.live} target="_blank" rel="noreferrer">
                <span className="more__name">{m.name}</span>
                <span className="more__kind">{m.kind}</span>
                <span className="more__stack">{m.stack}</span>
                <span className="more__go">{"go" in m && m.go ? m.go : "Visit"}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
