import Nav from "../components/Nav";
import Hero from "../components/Hero";
import Build from "../components/Build";
import About from "../components/About";
import Finale from "../components/Finale";
import Reel from "../components/Reel";
import SceneTint from "../components/SceneTint";
import SmoothScroll from "../components/SmoothScroll";
import { projects, moreWork } from "../components/data";

export default function Home() {
  return (
    <>
      <a className="skip" href="#work">Skip to work</a>
      <SmoothScroll />
      <SceneTint />
      <Nav />

      <main>
        <Hero />

        <Reel />

        <section className="section work-intro" aria-labelledby="builds-title" style={{ paddingBottom: 0 }}>
          <div className="wrap section__head">
            <h2 className="section__title" id="builds-title">How they were built</h2>
            <p className="section__intro">
              Four of these, taken apart the way I work: the brief, the design, the code structure,
              and the site that went live. Step through each one.
            </p>
          </div>
          {projects.map((p, i) => (
            <Build key={p.id} p={p} index={i} total={projects.length} />
          ))}
        </section>

        <section className="section" aria-labelledby="more-title">
          <div className="wrap">
            <div className="section__head">
              <h2 className="section__title" id="more-title">More builds</h2>
              <p className="section__intro">Landing pages and company sites, each designed in Figma first.</p>
            </div>
            <ul className="more">
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

        <About />

        <Finale />
      </main>
    </>
  );
}
