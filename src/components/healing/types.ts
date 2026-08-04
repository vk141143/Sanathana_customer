export type HealingStep = {
  id: number;
  title: string;
  shortTitle: string;
};

export const HEALING_STEPS: HealingStep[] = [
  { id: 1, title: "What Bhagavad Gita Says", shortTitle: "Gita" },
  { id: 2, title: "What This Means", shortTitle: "Meaning" },
  { id: 3, title: "Divine Example", shortTitle: "Example" },
  { id: 4, title: "How to Overcome", shortTitle: "Practice" },
  { id: 5, title: "Mantra for Inner Peace", shortTitle: "Peace" },
];

export const NEXT_BUTTON_LABELS: Record<number, string> = {
  1: "Continue to Meaning",
  2: "View Divine Example",
  3: "Learn How to Overcome",
  4: "Receive Inner Peace",
  5: "Complete Healing",
};
