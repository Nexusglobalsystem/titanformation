import Link from "next/link";
import { Badge, Button, Card, CardContent } from "@titan-kinetic/ui";
import { IconArrowRight, IconCalendar, IconShieldCheck } from "@/components/icons";
import type { Tables } from "@titan-kinetic/core/database.types";

const CATEGORY_LABELS: Record<string, string> = {
  management: "Management",
  conformite: "Conformité",
  technologies: "Technologies",
};

const LEVEL_LABELS: Record<string, string> = {
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
  const showPopularBadgeOnImage = training.isPopular && training.imageUrl;
  const showPopularBadgeInline = training.isPopular && !training.imageUrl;

  return (
    <Card className="flex flex-col overflow-hidden">
      {training.imageUrl && (
        <div className="relative h-36 w-full overflow-hidden bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={training.imageUrl} alt="" className="h-full w-full object-cover" />
          {showPopularBadgeOnImage && (
            <Badge variant="warning" className="absolute left-3 top-3">
              Populaire
            </Badge>
          )}
        </div>
      )}
      <CardContent className="flex flex-1 flex-col gap-4 p-6 pt-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-foreground">{training.title}</h3>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            {showPopularBadgeInline && <Badge variant="warning">Populaire</Badge>}
            {training.category && (
              <Badge variant="featured">{CATEGORY_LABELS[training.category] ?? training.category}</Badge>
            )}
          </div>
        </div>
        <p className="line-clamp-2 font-body text-sm text-foreground-muted">{training.summary}</p>
        {(training.level || training.is_certifying) && (
          <div className="flex flex-wrap gap-2">
            {training.level && (
              <Badge variant="neutral">{LEVEL_LABELS[training.level] ?? training.level}</Badge>
            )}
            {training.is_certifying && (
              <Badge variant="success" className="gap-1">
                <IconShieldCheck size={12} />
                Certifiante
              </Badge>
            )}
          </div>
        )}
        <div className="mt-auto flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2 font-body text-sm text-foreground-muted">
            <span>{training.duration_hours}h</span>
            <span className="font-display text-base font-semibold text-foreground">
              {training.price_ht.toLocaleString("fr-FR")} € HT
            </span>
          </div>
          {training.nextSessionStartsOn && (
            <p className="flex items-center gap-1.5 font-body text-xs text-accent-text">
              <IconCalendar size={14} />
              Prochaine session : {new Date(training.nextSessionStartsOn).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
        <Link href={`/formations/${training.slug}`}>
          <Button variant="outline" className="w-full gap-2">
            Découvrir
            <span className="inline-flex transition-transform duration-200 group-hover:translate-x-1">
              <IconArrowRight />
            </span>
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
