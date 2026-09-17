export type AccessRole = "owner" | "shared";

export function documentRole(args: {
  ownerId: string;
  userId: string;
  sharedUserIds: string[];
}): AccessRole | null {
  if (args.ownerId === args.userId) return "owner";
  if (args.sharedUserIds.includes(args.userId)) return "shared";
  return null;
}

export function canView(role: AccessRole | null): boolean {
  return role === "owner" || role === "shared";
}

export function canEdit(role: AccessRole | null): boolean {
  return role === "owner" || role === "shared";
}

export function canManage(role: AccessRole | null): boolean {
  return role === "owner";
}
