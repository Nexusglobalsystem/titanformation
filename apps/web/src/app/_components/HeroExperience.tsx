"use client";
import { useState } from "react";
import Link from "next/link";
const journeys = [
  {
    title: "Explorer",
    subtitle: "Ouvrez le champ des possibles.",
    detail:
      "Choisissez la compétence qui fera la différence dans votre quotidien.",
    href: "/formations",
    label: "Trouver ma formation",
    number: "01",
    color: "coral",
  },
  {
    title: "Pratiquer",
    subtitle: "Transformez le savoir en action.",
    detail:
      "Des modules, des évaluations et des échanges avec votre formateur pour avancer.",
    href: "/formations?niveau=debutant",
    label: "Découvrir les fondamentaux",
    number: "02",
    color: "sage",
  },
  {
    title: "Progresser",
    subtitle: "Donnez une direction à votre talent.",
    detail:
      "Explorez les programmes avancés et construisez la prochaine étape de votre parcours.",
    href: "/formations?niveau=avance",
    label: "Aller plus loin",
    number: "03",
    color: "gold",
  },
];
export function HeroExperience() {
  const [active, setActive] = useState(0);
  const journey = journeys[active]!;
  return (
    <div className={"kinetic-experience tone-" + journey.color}>
      <div className="orbital-scene" aria-hidden="true">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="orbit orbit-three" />
        <div className="kinetic-sphere">
          <div className="sphere-ribs" />
          <span className="sphere-letter">k.</span>
        </div>
        <span className="orbital-star star-one">✳</span>
        <span className="orbital-star star-two">+</span>
        <span className="orbital-coordinate">LE SAVOIR EN MOUVEMENT</span>
      </div>
      <div
        className="journey-tabs"
        role="tablist"
        aria-label="Les étapes de votre parcours"
        onKeyDown={(e) => {
          if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) {
            e.preventDefault();
            const next =
              e.key === "Home"
                ? 0
                : e.key === "End"
                  ? 2
                  : (active + (e.key === "ArrowRight" ? 1 : 2)) % 3;
            setActive(next);
            document.getElementById("journey-tab-" + next)?.focus();
          }
        }}
      >
        {journeys.map((item, i) => (
          <button
            key={item.number}
            id={"journey-tab-" + i}
            role="tab"
            aria-selected={active === i}
            aria-controls="journey-panel"
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
          >
            <span>{item.number}</span>
            {item.title}
          </button>
        ))}
      </div>
      <div
        id="journey-panel"
        role="tabpanel"
        aria-labelledby={"journey-tab-" + active}
        className="journey-panel"
        tabIndex={0}
      >
        <span className="journey-number" aria-hidden="true">
          {journey.number}
        </span>
        <div>
          <h2>{journey.subtitle}</h2>
          <p>{journey.detail}</p>
          <Link href={journey.href}>
            {journey.label} <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
