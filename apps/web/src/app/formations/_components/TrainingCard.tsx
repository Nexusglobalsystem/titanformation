import Link from "next/link";
import { Badge, Button, Card, CardContent } from "@titan-kinetic/ui";
import { IconArrowRight } from "@/components/icons";
import type { Tables } from "@titan-kinetic/core/database.types";

const CATEGORY_LABELS: Record<string, string> = {
  management: "Management",
  conformite: "Conformité",
  technologies: "Technologies",
};

export function TrainingCard({ training }: { training: Tables<"trainings"> }) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardContent className="flex flex-1 flex-col gap-4 p-6 pt-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-foreground">{training.title}</h3>
          {training.category && (
            <Badge variant="featured" className="shrink-0">
              {CATEGORY_LABELS[training.category] ?? training.category}
            </Badge>
          )}
        </div>
        <p className="line-clamp-2 font-body text-sm text-foreground-muted">{training.summary}</p>
        <div className="mt-auto flex flex-wrap gap-4 font-body text-sm text-foreground-muted">
          <span>{training.duration_hours}h</span>
          <span>{training.modalities}</span>
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
