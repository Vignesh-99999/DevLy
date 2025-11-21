import React, { useState, useEffect, useRef } from "react";
import "../Carousel.css";

const DEFAULT_SLIDES = [
  {
    id: 1,
    title: "Master C++",
    description: "Dive into OOP, STL, and performance-focused coding.",
    url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=3840&auto=format&fit=crop",
    lang: "cpp",
  },
  {
    id: 2,
    title: "Learn Python",
    description: "Start with clean syntax, data types, and real projects.",
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=3840&auto=format&fit=crop",
    lang: "python",
  },
  {
    id: 3,
    title: "Java Foundations",
    description: "Build strong fundamentals for enterprise development.",
    url: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=3840&auto=format&fit=crop",
    lang: "java",
  },
  {
    id: 4,
    title: "C Programming",
    description: "Understand pointers, memory, and system-level concepts.",
    url: "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?q=80&w=3840&auto=format&fit=crop",
    lang: "c",
  },
  {
    id: 5,
    title: "Crystal Clear Concepts",
    description: "Learn concepts thoroughly and deeply.",
    url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=3840&auto=format&fit=crop",
    lang: "python", // default fallback
  },
];

export default function Carousel({
  slides = DEFAULT_SLIDES,
  autoPlay = false,
  autoPlayInterval = 4500,
}) {
  const [items, setItems] = useState(slides);
  const autoplayRef = useRef(null);

  useEffect(() => {
    setItems(slides);
  }, [slides]);

  useEffect(() => {
    if (!autoPlay) return;
    autoplayRef.current = setInterval(() => rotateNext(), autoPlayInterval);
    return () => clearInterval(autoplayRef.current);
  }, [autoPlay, autoPlayInterval, items]);

  const rotateNext = () => {
    setItems((prev) => (prev.length ? [...prev.slice(1), prev[0]] : prev));
  };

  const rotatePrev = () => {
    setItems((prev) =>
      prev.length ? [prev[prev.length - 1], ...prev.slice(0, prev.length - 1)] : prev
    );
  };

  const getTutorialLink = (lang) => `/tutorial/${lang}`;

  return (
    <div className="carousel-wrapper" aria-roledescription="carousel">
      <ul className="slider" aria-live="polite">
        {items.map((s, i) => (
          <li
            key={s.id}
            className="item"
            style={{ backgroundImage: `url(${s.url})` }}
            aria-hidden={i === 1 ? "false" : "true"}
          >
            <div className={`content ${i === 1 ? "visible" : ""}`}>
              <h2 className="title" style={{ color: "white" }}>{s.title}</h2>
              <p className="description">{s.description}</p>
              <a className="readmore" href={getTutorialLink(s.lang)}>Read More</a>
            </div>
          </li>
        ))}
      </ul>

      <nav className="nav" aria-label="Carousel controls">
        <button
          className="nav-btn prev"
          onClick={rotatePrev}
          aria-label="Previous"
          style={{ color: "white", backgroundColor: "transparent" }}
        >
          ‹
        </button>
        <button
          className="nav-btn next"
          onClick={rotateNext}
          aria-label="Next"
          style={{ color: "white", backgroundColor: "transparent" }}
        >
          ›
        </button>
      </nav>
    </div>
  );
}
