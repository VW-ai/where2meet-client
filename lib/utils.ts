import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// localStorage helpers for per-participant custom centroid
export function getCustomCentroid(eventId: string, participantId: string): { lat: number; lng: number } | null {
  if (typeof window === 'undefined') return null;

  try {
    const key = `event_${eventId}_participant_${participantId}_custom_center`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
      return { lat: parsed.lat, lng: parsed.lng };
    }
    return null;
  } catch (err) {
    console.error('Failed to get custom centroid from localStorage:', err);
    return null;
  }
}

export function setCustomCentroid(eventId: string, participantId: string, centroid: { lat: number; lng: number }): void {
  if (typeof window === 'undefined') return;

  try {
    const key = `event_${eventId}_participant_${participantId}_custom_center`;
    localStorage.setItem(key, JSON.stringify(centroid));
  } catch (err) {
    console.error('Failed to save custom centroid to localStorage:', err);
  }
}

export function clearCustomCentroid(eventId: string, participantId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const key = `event_${eventId}_participant_${participantId}_custom_center`;
    localStorage.removeItem(key);
  } catch (err) {
    console.error('Failed to clear custom centroid from localStorage:', err);
  }
}
