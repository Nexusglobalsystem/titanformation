// Porté tel quel depuis apps/web/src/app/apprenant/reservations/page.tsx
// (fonction pure, extraite du composant serveur) — même algorithme de
// génération de créneaux à partir des règles de disponibilité récurrentes
// (trainer_availabilities) moins les exceptions (availability_exceptions)
// et les créneaux déjà pris (rpc taken_slots).
export const DAYS_AHEAD = 21;

export interface TimeSlot {
  start_time: string;
  end_time: string;
}

export interface DayAvailability {
  key: string;
  date: Date;
  hasSlots: boolean;
}

export interface AvailabilityRule {
  weekday: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

export interface AvailabilityException {
  exception_date: string;
  start_time: string | null;
  end_time: string | null;
}

export function toMondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7; // JS : 0 = dimanche → aligné sur 0 = lundi
}

export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function computeAvailableSlots({
  availabilities,
  exceptions,
  takenSet,
  now = new Date(),
}: {
  availabilities: AvailabilityRule[];
  exceptions: AvailabilityException[];
  takenSet: Set<string>;
  now?: Date;
}): { calendarDays: DayAvailability[]; slotsByDate: Record<string, TimeSlot[]> } {
  const calendarDays: DayAvailability[] = [];
  const slotsByDate: Record<string, TimeSlot[]> = {};
  const nowHm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const dateKey = formatDateKey(date);
    const weekday = toMondayIndex(date);

    const dayExceptions = exceptions.filter((e) => e.exception_date === dateKey);
    const fullyBlocked = dayExceptions.some((e) => !e.start_time);

    const daySlots: TimeSlot[] = [];
    if (!fullyBlocked) {
      const rulesForDay = availabilities.filter((a) => a.weekday === weekday);
      for (const rule of rulesForDay) {
        let cursor = rule.start_time.slice(0, 5);
        const end = rule.end_time.slice(0, 5);
        while (addMinutes(cursor, rule.slot_duration_minutes) <= end) {
          const slotStart = cursor;
          const slotEnd = addMinutes(cursor, rule.slot_duration_minutes);
          cursor = slotEnd;

          const blockedByException = dayExceptions.some(
            (e) =>
              e.start_time &&
              e.end_time &&
              slotStart < e.end_time.slice(0, 5) &&
              slotEnd > e.start_time.slice(0, 5),
          );
          const isTaken = takenSet.has(`${dateKey}T${slotStart}`);
          const isPast = i === 0 && slotStart <= nowHm;

          if (!blockedByException && !isTaken && !isPast) {
            daySlots.push({ start_time: slotStart, end_time: slotEnd });
          }
        }
      }
    }

    calendarDays.push({ key: dateKey, date, hasSlots: daySlots.length > 0 });
    if (daySlots.length > 0) slotsByDate[dateKey] = daySlots;
  }

  return { calendarDays, slotsByDate };
}
