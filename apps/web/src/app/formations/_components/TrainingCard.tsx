import Image from "next/image";
import Link from "next/link";
import { TrainingCoverArt } from "./TrainingCoverArt";
import type { Tables } from "@titan-kinetic/core/database.types";
const categories: Record<string, string> = {
  management: "Management",
  conformite: "Conformité",
  technologies: "Technologies",
};
const levels: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};
export type CatalogueTraining = Tables<"trainings"> & {
  imageUrl: string | null;
  nextSessionStartsOn: string | null;
  enrolledCount: number;
  isPopular: boolean;
};
export function TrainingCard({ training }: { training: CatalogueTraining }) {
  return (
    <article className="course-card">
      <div className="course-cover">
        {training.imageUrl ? (
          <Image
            src={training.imageUrl}
            alt=""
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 800px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <TrainingCoverArt seed={training.id} className="h-full w-full" />
        )}
        <span className="course-category">
          {training.category
            ? (categories[training.category] ?? training.category)
            : "Formation professionnelle"}
        </span>
      </div>
      <div className="course-content">
        <div className="course-meta">
          <span>{training.duration_hours} heures</span>
          {training.level && (
            <span>{levels[training.level] ?? training.level}</span>
          )}
          {training.is_certifying && <span>Certifiante</span>}
        </div>
        <h3>{training.title}</h3>
        <p className="line-clamp-2">{training.summary}</p>
        {training.nextSessionStartsOn && (
          <p className="course-date">
            Prochaine session ·{" "}
            {new Date(
              training.nextSessionStartsOn + "T12:00:00Z",
            ).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              timeZone: "UTC",
            })}
          </p>
        )}
        <div className="course-bottom">
          <div>
            <strong>{training.price_ht.toLocaleString("fr-FR")} €</strong>{" "}
            <small>HT</small>
          </div>
          <Link
            href={"/formations/" + training.slug}
            className="course-link"
            aria-label={"Découvrir la formation : " + training.title}
          >
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
