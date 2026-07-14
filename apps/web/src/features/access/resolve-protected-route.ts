export function resolveProtectedRoute(
  accessStatus: 'invited' | 'active' | 'blocked' | null,
): '/login' | '/access' | null {
  if (accessStatus === null) return '/login';
  return accessStatus === 'active' ? null : '/access';
}
