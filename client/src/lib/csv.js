export function downloadCsv(filename, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function parseCsv(text) {
  // Minimal CSV parser (quotes-aware) → array of objects using header row.
  const lines = text.trim().split(/\r?\n/);
  const cells = (line) => {
    const out = [];
    let cur = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q && c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = !q;
      else if (c === ',' && !q) { out.push(cur); cur = ''; }
      else cur += c;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const head = cells(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).filter(Boolean).map((l) => {
    const v = cells(l);
    const o = {};
    head.forEach((h, i) => { o[h] = v[i] ?? ''; });
    return { sku: o.sku, name: o.name || o.product, category: o.category, unit: o.unit, costPrice: Number(o.costprice || o.cost) || 0, sellingPrice: Number(o.sellingprice || o.price) || 0, reorderLevel: Number(o.reorderlevel || o.reorder) || 10 };
  });
}
