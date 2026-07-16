export const STAGES = [
  {
    key: "NEW",
    label: "New",
    color: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    key: "CONTACTED",
    label: "Contacted",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    key: "QUALIFIED",
    label: "Qualified",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    key: "PROPOSAL_SENT",
    label: "Proposal Sent",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    key: "WON",
    label: "Won",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "LOST",
    label: "Lost",
    color: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];
