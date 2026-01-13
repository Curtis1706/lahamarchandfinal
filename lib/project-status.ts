export type CanonicalProjectStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED";

/**
 * Normalise un statut de projet vers le statut canonique
 * Gère la compatibilité avec ACCEPTED (legacy) -> APPROVED
 */
export function normalizeProjectStatus(status: string): CanonicalProjectStatus {
  // Compat legacy
  if (status === "ACCEPTED") return "APPROVED";
  
  // Si tu gardes UNDER_REVIEW, c'est OK
  if (
    status === "DRAFT" ||
    status === "SUBMITTED" ||
    status === "UNDER_REVIEW" ||
    status === "APPROVED" ||
    status === "REJECTED" ||
    status === "ARCHIVED"
  ) {
    return status as CanonicalProjectStatus;
  }

  // fallback sécurisé
  return "DRAFT";
}

/**
 * Vérifie si un projet peut être modifié
 */
export function canEditProject(status: string): boolean {
  const s = normalizeProjectStatus(status);
  return s === "DRAFT" || s === "REJECTED";
}

/**
 * Vérifie si un projet peut être soumis
 */
export function canSubmitProject(status: string): boolean {
  const s = normalizeProjectStatus(status);
  return s === "DRAFT" || s === "REJECTED";
}

/**
 * Vérifie si un projet peut être archivé
 */
export function canArchiveProject(status: string): boolean {
  const s = normalizeProjectStatus(status);
  return s === "APPROVED" || s === "REJECTED";
}

