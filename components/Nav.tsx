"use client";

import { useEffect, useState } from "react";
import Sound from "./Sound";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={`nav${scrolled ? " is-scrolled" : ""}`}>
      <div className="wrap nav__inner">
        <a className="nav__name" href="#top">
          <span className="nav__first">Muhammad </span>Rayyan
        </a>
        <div className="nav__right">
          <nav aria-label="Main">
            <ul className="nav__links">
              <li><a href="#work">Work</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </nav>
          <Sound />
        </div>
      </div>
    </header>
  );
}
