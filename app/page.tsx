import Nav from "../components/Nav";
import Hero from "../components/Hero";
import About from "../components/About";
import Finale from "../components/Finale";
import Reel from "../components/Reel";
import Theater from "../components/Theater";
import ProjectIndex from "../components/ProjectIndex";
import SmoothScroll from "../components/SmoothScroll";

export default function Home() {
  return (
    <>
      <a className="skip" href="#work">Skip to work</a>
      <SmoothScroll />
      <Nav />

      <main>
        <Hero />

        <Reel />


        <ProjectIndex />

        <About />

        <Finale />
      </main>
      <Theater />
    </>
  );
}
