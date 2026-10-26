// RBAC matrix:
// Admin: everything incl. user management.
// Warehouse Staff: products, locations, inward/outward, transfers, damage.
// Dispatch Staff: orders, picking lists, dispatch, history.
// All authenticated roles: dashboard, movements (read), notifications.
export function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have permission to perform this action." });
    }
    next();
  };
}
