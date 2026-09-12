import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Extracts a display message from a caught error of unknown shape (Supabase errors, native Error, etc). */
export function getErrorMessage(e: unknown, fallback = "Ocorreu um erro inesperado"): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null && "message" in e) {
    const m = (e as Record<string, unknown>).message;
    if (typeof m === "string" && m) return m;
  }
  return fallback;
}
