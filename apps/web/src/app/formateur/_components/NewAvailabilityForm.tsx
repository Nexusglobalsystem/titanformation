"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@titan-kinetic/ui";
import { createAvailabilityAction, type AvailabilityFormState } from "../_actions/availability";

const WEEKDAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="sm" loading={pending}>
      Ajouter
    </Button>
  );
}

export function NewAvailabilityForm() {
  const [state, formAction] = useActionState<AvailabilityFormState, FormData>(
    createAvailabilityAction,
    undefined,
  );
  const [weekday, setWeekday] = useState("0");

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-DEFAULT border border-dashed border-border p-4">
      <input type="hidden" name="weekday" value={weekday} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-foreground">Jour</label>
          <Select value={weekday} onValueChange={setWeekday}>
            <SelectTrigger aria-label="Jour">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAY_LABELS.map((label, index) => (
                <SelectItem key={index} value={String(index)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input label="Début" name="start_time" type="time" defaultValue="09:00" required />
        <Input label="Fin" name="end_time" type="time" defaultValue="17:00" required />
        <Input
          label="Durée créneau (min)"
          name="slot_duration_minutes"
          type="number"
          min="5"
          step="5"
          defaultValue={30}
        />
      </div>
      {state?.error && (
        <p role="alert" className="font-body text-xs text-error">
          {state.error}
        </p>
      )}
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
