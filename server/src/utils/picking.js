// Picking list: nearest-location-first — sort by location code
// (Zone-Rack-Bin lexicographic) so pickers walk the shortest route.
export function sortPickingList(items) {
  return [...items].sort((a, b) => String(a.location || '').localeCompare(String(b.location || '')));
}
