import type { Role } from "./schema";

export function formatRole(role: Role): string {
  if (role === "god") return "God";
  return role.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatRoles(roles: Role[]): string {
  return roles.map(formatRole).join(", ");
}
