import { asyncHandler } from './errors.js';

// Express 4 does not catch async handler rejections — one throw kills the
// whole process. Wrap every route-layer handler once at boot.
export function wrapRouter(router) {
  for (const layer of router.stack || []) {
    if (layer.route) {
      for (const s of layer.route.stack) s.handle = asyncHandler(s.handle);
    } else if (layer.handle && layer.handle.stack) {
      wrapRouter(layer.handle);
    } else if (typeof layer.handle === 'function' && layer.handle.length === 3) {
      const orig = layer.handle;
      layer.handle = (req, res, next) => {
        try {
          const r = orig(req, res, next);
          if (r && typeof r.catch === 'function') r.catch(next);
        } catch (e) {
          next(e);
        }
      };
    }
  }
  return router;
}
