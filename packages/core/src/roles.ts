export const APP_ROLES = [
  "admin",
  "gestionnaire",
  "formateur",
  "responsable_entreprise",
  "apprenant",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_HOME_PATH: Record<AppRole, string> = {
  admin: "/admin",
  gestionnaire: "/admin",
  formateur: "/formateur",
  responsable_entreprise: "/entreprise",
  apprenant: "/apprenant",
};

const SPACE_ROLES: Record<"admin" | "formateur" | "entreprise" | "apprenant", AppRole[]> = {
  admin: ["admin", "gestionnaire"],
  formateur: ["formateur"],
  entreprise: ["responsable_entreprise"],
  apprenant: ["apprenant"],
};

export function canAccessSpace(
  roles: AppRole[],
  space: keyof typeof SPACE_ROLES,
): boolean {
  return roles.some((role) => SPACE_ROLES[space].includes(role));
}

export function homePathForRoles(roles: AppRole[]): string {
  for (const role of APP_ROLES) {
    if (roles.includes(role)) return ROLE_HOME_PATH[role];
  }
  return "/";
}
