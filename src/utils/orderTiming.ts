import { isBoardStatus, type BoardStatus, type OrderStatus } from "../types/order";

export type Urgency = "ok" | "warning" | "late";

// Seuils en minutes avant l'alerte orange (warning) puis rouge (late).
// Pour tester l'alerte sans attendre, baissez temporairement ces valeurs (ex : 1 et 2).
const THRESHOLDS: Record<BoardStatus, { warning: number; late: number }> = {
  pending: { warning: 5, late: 10 },
  validated: { warning: 5, late: 10 },
  preparing: { warning: 15, late: 25 },
  ready: { warning: 10, late: 20 },
};

// Le backend peut renvoyer une date sans fuseau ("2026-10-06T10:00:00") : on la lit comme UTC.
export function parseApiDate(value: string): number {
  const hasTimezone = /(Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasTimezone ? value : `${value}Z`).getTime();
}

export function ageInMinutes(createdAt: string, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - parseApiDate(createdAt)) / 60000));
}

export function formatAge(minutes: number): string {
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

export function getUrgency(status: OrderStatus, minutes: number): Urgency {
  if (!isBoardStatus(status)) return "ok";
  const threshold = THRESHOLDS[status];
  if (minutes >= threshold.late) return "late";
  if (minutes >= threshold.warning) return "warning";
  return "ok";
}