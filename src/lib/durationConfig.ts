import { pushKey } from "./cloudSync";

const DURATION_CONFIG_KEY = "voltron_duration_config";

export const TRIAL_DURATIONS = [1, 3, 7] as const;
export type TrialDuration = (typeof TRIAL_DURATIONS)[number];

const DEFAULT_DURATIONS: TrialDuration[] = [...TRIAL_DURATIONS];

export function getEnabledDurations(): TrialDuration[] {
  if (typeof window === "undefined") return DEFAULT_DURATIONS;

  try {
    const stored = JSON.parse(localStorage.getItem(DURATION_CONFIG_KEY) || "[]") as unknown;
    if (!Array.isArray(stored)) return DEFAULT_DURATIONS;

    const valid = TRIAL_DURATIONS.filter((duration) => stored.includes(duration));
    return valid.length > 0 ? valid : DEFAULT_DURATIONS;
  } catch {
    return DEFAULT_DURATIONS;
  }
}

export function setEnabledDurations(durations: TrialDuration[]): boolean {
  if (typeof window === "undefined") return false;

  const valid = TRIAL_DURATIONS.filter((duration) => durations.includes(duration));
  if (valid.length === 0) return false;

  localStorage.setItem(DURATION_CONFIG_KEY, JSON.stringify(valid));
  window.dispatchEvent(new Event("voltron-duration-change"));
  void pushKey("voltron_duration_config");
  return true;
}