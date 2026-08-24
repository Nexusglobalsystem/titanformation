"use client";

import { useEffect, useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge, EmptyState } from "@titan-kinetic/ui";
import { IconLayers } from "@/components/icons";
import { reorderTrainingStepsAction, deleteTrainingStepAction } from "../_actions/trainingSteps";

export type TrainingStep = {
  id: string;
  type: string;
  title: string;
  duration_minutes: number | null;
  modules: { title: string } | null;
};

const TYPE_LABELS: Record<string, string> = {
  presentiel: "Présentiel",
  livekit: "Classe virtuelle (LiveKit)",
  autoapprentissage: "Auto-apprentissage",
  evaluation: "Évaluation",
  certification: "Certification",
};

const TYPE_VARIANTS: Record<string, "neutral" | "success" | "warning" | "featured"> = {
  presentiel: "neutral",
  livekit: "featured",
  autoapprentissage: "success",
  evaluation: "warning",
  certification: "featured",
};

function SortableStepRow({ step, trainingId }: { step: TrainingStep; trainingId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between gap-3 rounded-DEFAULT border border-border bg-surface-elevated p-3"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded px-1.5 py-1 font-body text-foreground-muted hover:text-foreground active:cursor-grabbing"
          aria-label="Réordonner cette étape"
        >
          ⠿
        </button>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-body text-sm font-medium text-foreground">{step.title}</p>
            <Badge variant={TYPE_VARIANTS[step.type] ?? "neutral"}>{TYPE_LABELS[step.type] ?? step.type}</Badge>
          </div>
          {(step.duration_minutes || step.modules?.title) && (
            <p className="font-body text-xs text-foreground-muted">
              {step.duration_minutes ? `${step.duration_minutes} min` : ""}
              {step.duration_minutes && step.modules?.title ? " · " : ""}
              {step.modules?.title ?? ""}
            </p>
          )}
        </div>
      </div>
      <form action={deleteTrainingStepAction}>
        <input type="hidden" name="trainingId" value={trainingId} />
        <input type="hidden" name="stepId" value={step.id} />
        <button type="submit" className="font-body text-xs text-error hover:underline">
          Retirer
        </button>
      </form>
    </div>
  );
}

export function TrainingStepsBoard({
  trainingId,
  steps: initialSteps,
}: {
  trainingId: string;
  steps: TrainingStep[];
}) {
  const [steps, setSteps] = useState(initialSteps);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // initialSteps vient du Server Component et se rafraîchit après chaque
  // ajout/suppression d'étape (formulaire séparé) via revalidatePath — sans
  // cette resynchronisation, useState ne reprendrait sa valeur qu'au premier
  // montage et ignorerait silencieusement les nouvelles étapes ajoutées.
  useEffect(() => {
    setSteps(initialSteps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialSteps.map((s) => s.id))]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(steps, oldIndex, newIndex);
    const previous = steps;
    setSteps(reordered);
    setError(null);

    startTransition(async () => {
      const result = await reorderTrainingStepsAction(
        trainingId,
        reordered.map((s) => s.id),
      );
      if (result.error) {
        setSteps(previous);
        setError(result.error);
      }
    });
  }

  if (steps.length === 0) {
    return <EmptyState icon={<IconLayers />} title="Aucune étape définie pour ce parcours." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* id fixe : sans lui, dnd-kit dérive un id depuis un compteur global qui
          persiste côté serveur entre les requêtes mais repart de zéro côté
          client à chaque chargement de page, provoquant un mismatch
          d'hydratation dès qu'un autre DndContext a déjà été rendu ailleurs
          sur le serveur depuis son démarrage. */}
      <DndContext id={`training-steps-${trainingId}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {steps.map((step) => (
              <SortableStepRow key={step.id} step={step} trainingId={trainingId} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {error && (
        <p role="alert" className="font-body text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
