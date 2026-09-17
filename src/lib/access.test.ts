import { describe, expect, it } from "vitest";
import { canEdit, canManage, canView, documentRole } from "./access";

describe("documentRole", () => {
  it("distinguishes owner, shared collaborator, and stranger", () => {
    expect(documentRole({ ownerId: "ada", userId: "ada", sharedUserIds: ["alan"] })).toBe("owner");
    expect(documentRole({ ownerId: "ada", userId: "alan", sharedUserIds: ["alan"] })).toBe("shared");
    expect(documentRole({ ownerId: "ada", userId: "grace", sharedUserIds: ["alan"] })).toBeNull();
  });
});

describe("permissions", () => {
  it("lets owners and collaborators edit, but only owners manage sharing", () => {
    expect(canView("shared")).toBe(true);
    expect(canEdit("shared")).toBe(true);
    expect(canManage("shared")).toBe(false);
    expect(canManage("owner")).toBe(true);
    expect(canEdit(null)).toBe(false);
  });
});
