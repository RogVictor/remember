import type { Access } from 'payload'

export const isAdminUser = (user: unknown): boolean =>
  typeof user === 'object' &&
  user !== null &&
  'role' in user &&
  user.role === 'admin'

export const isAuthenticatedUser = (user: unknown): boolean =>
  typeof user === 'object' && user !== null

export const leadAccess = {
  create: (() => false) satisfies Access,
  read: (({ req }) => isAuthenticatedUser(req.user)) satisfies Access,
  update: (({ req }) => isAdminUser(req.user)) satisfies Access,
  delete: (({ req }) => isAdminUser(req.user)) satisfies Access,
}
