export const isAdminUser = (user: unknown): boolean =>
  typeof user === 'object' &&
  user !== null &&
  'role' in user &&
  user.role === 'admin'
