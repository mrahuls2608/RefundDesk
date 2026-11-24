export const Role = {
  CUSTOMER: 'CUSTOMER',
  OPS: 'OPS',
  APPROVER: 'APPROVER',
  ADMIN: 'ADMIN',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const ALL_ROLES = Object.values(Role);

/** Staff roles that may see every case (TRD §5.3 "OPS+"). */
export const STAFF_ROLES: readonly Role[] = [Role.OPS, Role.APPROVER, Role.ADMIN];
