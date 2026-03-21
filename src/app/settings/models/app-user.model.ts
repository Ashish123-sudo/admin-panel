export interface AppUser {
  userId?: string;  // Changed from number to string (UUID)
  fullName: string;
  username: string;
  password?: string;
  appRole?: { roleId: string; roleName: string };  // Changed roleId from number to string
  roleId?: string;  // Changed from number to string (UUID)
}