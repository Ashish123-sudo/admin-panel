export interface AppUser {
  userId?: number;
  fullName: string;
  username: string;
  password?: string;
  appRole?: { roleId: number; roleName: string };
  roleId?: number;
}