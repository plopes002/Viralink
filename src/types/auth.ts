// src/types/auth.ts
export type UserRole =
  | "master_admin"
  | "admin"
  | "manager"
  | "professional"
  | "partner"
  | "receptionist"
  | "commercial"
  | "client";

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
