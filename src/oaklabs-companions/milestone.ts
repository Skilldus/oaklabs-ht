import { level } from "./model.js";

export const MILESTONES = [
  { level: 35, label: "Maître de la Ligue", mark: "10", color: "#422F67" },
  { level: 25, label: "Panthéon", mark: "9", color: "#775510" },
  { level: 19, label: "Route Victoire", mark: "8", color: "#4D488A" },
  { level: 14, label: "Élite", mark: "7", color: "#4A557C" },
  { level: 10, label: "Vétéran", mark: "6", color: "#865208" },
  { level: 7, label: "As d’Arène", mark: "5", color: "#9A3449" },
  { level: 5, label: "Aventurier", mark: "4", color: "#854578" },
  { level: 4, label: "Challenger", mark: "3", color: "#8A4C17" },
  { level: 3, label: "Compagnon", mark: "2", color: "#23655E" },
  { level: 2, label: "Éclaireur", mark: "1", color: "#255D9A" },
] as const;

export function milestone(xp: number) {
  const current = level(xp);
  return MILESTONES.find(stage => current >= stage.level) ?? null;
}
