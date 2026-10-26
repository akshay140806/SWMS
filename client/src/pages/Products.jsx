import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../lib/api';
import en from '../content/en';
import { motion } from 'framer-motion';
import { Badge, Confirm, Drawer, Empty, Field, PageHeader, Skeleton, inputCls } from '../components/ui';
import { parseCsv } from '../lib/csv';
import { getSocket } from '../lib/socket';

function ProductForm({ initial, locations, groups = [], onDone }) {
  const [groupList, setGroupList] = useState(groups);
  const defaultCat = initial?.category || (groupList[0]?.name || 'General');
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: initial || { status: 'active', unit: 'pcs', category: defaultCat }
  });
  const currentCategory = watch('category');
  const [customCat, setCustomCat] = useState(
    initial?.category ? !groupList.some((g) => g.name.toLowerCase() === initial.category.toLowerCase()) : false
  );

  useEffect(() => {
    if (!groups || !groups.length) {
      api.get('/catalog/groups').then((r) => setGroupList(r.data.items || [])).catch(() => {});
    } else {
      setGroupList(groups);
    }
  }, [groups]);

  async function save(values, another) {
    try {
      const matchedGroup = groupList.find((g) => g.name.toLowerCase() === (values.category || '').toLowerCase());
      const payload = {
        ...values,
        group: matchedGroup?._id || undefined,
        costPrice: Number(values.costPrice) || 0,
        sellingPrice: Number(values.sellingPrice) || 0,
        reorderLevel: values.reorderLevel === '' ? undefined : Number(values.reorderLevel),
        openingStock: Number(values.openingStock) || 0,
        totalQuantity: values.totalQuantity !== undefined && values.totalQuantity !== '' ? Number(values.totalQuantity) : undefined,
        defaultLocationId: values.defaultLocationId || undefined
      };
      if (initial?.id) {
        await api.put(`/products/${initial.id}`, payload);
        toast.success(en.toasts.pUpdated);
      } else {
        const { data } = await api.post('/products', payload);
        const locToUse = payload.defaultLocationId || locations[0]?._id;
        if (payload.openingStock > 0 && locToUse) {
          await api.post(`/products/${data._id || data.id}/inward`, { qty: payload.openingStock, locationId: locToUse, reference: 'Opening stock' });
        }
        toast.success(en.toasts.pCreated);
      }
      onDone(another);
    } catch (e) {
      toast.error(e.response?.data?.error || en.toasts.err);
    }
  }
  return (
    <form onSubmit={handleSubmit((v) => save(v, false))} className="space-y-5">
      <section>
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">{en.products.secBasic}</h4>
        <div className="space-y-3">
          <Field label={en.products.fName} error={errors.name?.message}><input {...register('name', { required: en.valid.required })} className={inputCls} data-testid="product-name" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={en.products.fSku} tip={en.valid.skuDup} error={errors.sku?.message}><input {...register('sku', { required: en.valid.required })} className={inputCls} data-testid="product-sku" /></Field>
            <Field label={en.products.fBarcode}><input {...register('barcode')} className={inputCls} placeholder={en.stock.scanPh} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={en.products.fCategory}>
              {groupList && groupList.length > 0 && !customCat ? (
                <select
                  value={currentCategory || ''}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setCustomCat(true);
                      setValue('category', '');
                    } else {
                      setValue('category', e.target.value);
                    }
                  }}
                  className={inputCls}
                  data-testid="product-category"
                >
                  <option value="">{en.products.fCategorySelectPh || 'Select Category / Item Group...'}</option>
                  {groupList.map((g) => (
                    <option key={g._id || g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                  {initial?.category && !groupList.some((g) => g.name === initial.category) && (
                    <option value={initial.category}>{initial.category} (Current)</option>
                  )}
                  <option value="__custom__">{en.products.fCategoryCustom || '+ Other / Enter New Category...'}</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    {...register('category')}
                    className={inputCls}
                    placeholder="Enter category"
                    data-testid="product-category"
                  />
                  {groupList && groupList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomCat(false);
                        setValue('category', groupList[0]?.name || 'General');
                      }}
                      className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 whitespace-nowrap"
                    >
                      {en.products.fCategoryPickFromGroups || 'Pick from Groups'}
                    </button>
                  )}
                </div>
              )}
            </Field>
            <Field label={en.products.fUnit}><input {...register('unit')} className={inputCls} /></Field>
          </div>
          <Field label={en.products.fDesc}><textarea {...register('description')} className={inputCls} rows={2} /></Field>
        </div>
      </section>
      <section>
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">{en.products.secPricing}</h4>
        <div className="grid grid-cols-2 gap-3">
          <Field label={en.products.fCost}><input type="number" {...register('costPrice')} className={inputCls} /></Field>
          <Field label={en.products.fSell}><input type="number" {...register('sellingPrice')} className={inputCls} /></Field>
        </div>
      </section>
      <section>
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">{en.products.secStock}</h4>
        <div className="grid grid-cols-2 gap-3">
          {initial ? (
            <Field label="Total Physical Stock" tip="Edit quantity directly">
              <input type="number" min={0} {...register('totalQuantity')} className={inputCls} />
            </Field>
          ) : (
            <Field label={en.products.fOpening} tip="Initial stock on hand">
              <input type="number" min={0} {...register('openingStock')} className={inputCls} />
            </Field>
          )}
          <Field label={en.products.fReorder} tip={en.tips.reorder}><input type="number" {...register('reorderLevel')} className={inputCls} /></Field>
        </div>
        <Field label={en.products.fLoc}>
          <select {...register('defaultLocationId')} className={inputCls} defaultValue={initial?.defaultLocationId || ''}>
            <option value="">—</option>
            {locations.map((l) => <option key={l._id} value={l._id}>{l.code} ({l.occupied}/{l.capacity})</option>)}
          </select>
        </Field>
      </section>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => onDone(false)} className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-white/10">{en.products.cancel}</button>
        {!initial && <button type="button" onClick={handleSubmit((v) => save(v, true))} className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-200 dark:bg-white/15 hover:bg-slate-300 dark:hover:bg-white/20 transition">{en.products.saveAdd}</button>}
        <button data-testid="product-save" className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 transition disabled:opacity-60 shadow-sm" disabled={isSubmitting}>
          {initial ? en.products.save : en.products.save}
        </button>
      </div>
    </form>
  );
}

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [locations, setLocations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [low, setLow] = useState(params.get('low') === 'true');
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState(null); // 'new' | product | null
  const [confirmDel, setConfirmDel] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [showCols, setShowCols] = useState(false);
  const [cols, setCols] = useState({ Category: true, Location: true, Damaged: true, Reorder: true });
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canWrite = ['admin', 'warehouse_staff'].includes(user.role);

  async function load() {
    const [{ data }, { data: l }, { data: g }] = await Promise.all([
      api.get(`/products?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&low=${low}&page=${page}&limit=15`),
      locations.length ? Promise.resolve({ data: { items: locations } }) : api.get('/locations'),
      api.get('/catalog/groups').catch(() => ({ data: { items: [] } }))
    ]);
    setItems(data.items); setTotal(data.total); setPages(data.pages);
    if (!locations.length) setLocations(l.items);
    setGroups(g.items || []);
  }
  useEffect(() => { load(); }, [q, category, low, page]);
  useEffect(() => { if (params.get('action') === 'new') setDrawer('new'); }, []);

  useEffect(() => {
    const s = getSocket();
    const handleUpdate = () => { load(); };
    s.on('inventory_updated', handleUpdate);
    return () => { s.off('inventory_updated', handleUpdate); };
  }, [q, category, low, page]);

  async function del(p) {
    try {
      await api.delete(`/products/${p._id || p.id}`);
      toast.success(en.toasts.pDeleted);
      setConfirmDel(null);
      load();
    } catch (e) {
      if (e.response?.status === 404) {
        toast.success(en.toasts.pDeleted || 'Product removed.');
        setConfirmDel(null);
        load();
      } else {
        toast.error(e.response?.data?.error || en.toasts.err);
      }
    }
  }

  async function exportCsv() {
    const res = await api.get('/products/export', { responseType: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(res.data);
    a.download = 'products.csv';
    a.click();
    toast.success(en.toasts.exportReady);
  }

  async function importCsv(e) {
    const file = e.target.files[0];
    if (!file) return;
    const rows = parseCsv(await file.text());
    const { data } = await api.post('/products/import', { rows });
    toast.success(`Imported ${data.created} products.${data.errors.length ? ' ' + data.errors[0] : ''}`);
    load();
  }

  const allIds = items?.map((p) => p._id || p.id) || [];
  const toggleAll = () => setSelected(selected.size === allIds.length ? new Set() : new Set(allIds));

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title={en.products.title} sub={en.products.sub}
        action={canWrite && <button data-testid="add-product-btn" onClick={() => setDrawer('new')} className="text-sm font-bold bg-blue-600 text-white rounded-xl px-4 py-2 hover:bg-blue-500 transition shadow-sm">{en.products.add}</button>}
      />
      <div className="bg-white dark:bg-slate-900 border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-wrap gap-2 p-3 border-b border-slate-200 dark:border-white/10">
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={en.products.searchPh} data-testid="product-search"
            className="rounded-xl border border-slate-300 dark:border-white/15 bg-transparent px-3 py-2 text-sm w-64 outline-none focus:ring-2 focus:ring-blue-600" />
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-transparent px-3 py-2">
            <option value="">{en.products.filters}: {en.products.fAllCategories || 'All'}</option>
            {groups.map((g) => <option key={g._id || g.id} value={g.name}>{g.name}</option>)}
          </select>
          <button onClick={() => setLow(!low)} className={`text-sm font-semibold rounded-xl px-3 py-2 border transition ${low ? 'border-amber-500 text-amber-600' : 'border-slate-300 dark:border-white/15'}`}>Low stock</button>
          {(q || category || low) && <button onClick={() => { setQ(''); setCategory(''); setLow(false); }} className="text-sm text-slate-500">{en.common.resetFilters}</button>}
          <div className="ml-auto flex gap-2">
            <button onClick={() => setShowCols(!showCols)} className="text-sm font-semibold rounded-xl border border-slate-300 dark:border-white/15 px-3 py-2">{en.products.columns}</button>
            <button onClick={exportCsv} className="text-sm font-semibold rounded-xl border border-slate-300 dark:border-white/15 px-3 py-2">{en.products.export}</button>
            {canWrite && <label className="text-sm font-semibold rounded-xl border border-slate-300 dark:border-white/15 px-3 py-2 cursor-pointer">{en.products.import}<input type="file" accept=".csv" className="hidden" onChange={importCsv} /></label>}
          </div>
        </div>
        {showCols && (
          <div className="flex gap-4 p-3 text-sm border-b border-slate-200 dark:border-white/10">
            {Object.keys(cols).map((c) => <label key={c} className="flex items-center gap-1.5"><input type="checkbox" checked={cols[c]} onChange={() => setCols({ ...cols, [c]: !cols[c] })} />{c}</label>)}
          </div>
        )}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 text-sm bg-blue-50 dark:bg-blue-500/10 border-b">
            <span className="font-semibold">{en.products.bulkSelected(selected.size)}</span>
            <button onClick={exportCsv} className="font-semibold text-blue-600">Export</button>
            <button onClick={() => setSelected(new Set())} className="text-slate-500">{en.common.close}</button>
          </div>
        )}
        {!items ? <Skeleton rows={8} /> : items.length === 0 ? (
          <Empty title={en.products.emptyT} text={en.products.emptyD} action={canWrite && <button onClick={() => setDrawer('new')} className="text-sm font-bold bg-blue-600 text-white rounded-xl px-4 py-2">{en.products.emptyB}</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Products table</caption>
              <thead className="sticky top-0 bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="p-3"><input type="checkbox" checked={items.length > 0 && selected.size === items.length} onChange={toggleAll} aria-label="Select all" /></th>
                  {en.products.cols.map((c) => {
                    if ((c === 'Category' && !cols.Category) || (c === 'Location' && !cols.Location) || (c === 'Damaged' && !cols.Damaged) || (c === 'Reorder Level' && !cols.Reorder)) return null;
                    return <th key={c} className="p-3">{c}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {items.map((p) => {
                  const id = p._id || p.id;
                  const badge = p.status === 'inactive' ? ['grey', en.products.badges.inactive] : p.availableQuantity <= 0 ? ['red', en.products.badges.out] : p.lowStock ? ['amber', en.products.badges.low] : ['green', en.products.badges.in];
                  return (
                    <motion.tr key={id} data-testid="product-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
                      className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition group">
                        <td className="p-3"><input type="checkbox" checked={selected.has(id)} onChange={() => { const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s); }} aria-label={`Select ${p.sku}`} /></td>
                        <td className="p-3"><Link to={`/products/${id}`} className="font-semibold text-blue-600">{p.name}</Link><span className={`ml-2 badge ${badge[0]}`}>{badge[1]}</span></td>
                        <td className="p-3 font-mono">{p.sku}</td>
                        {cols.Category && <td className="p-3">{p.category}</td>}
                        {cols.Location && <td className="p-3 font-mono">{p.defaultLocationId?.code || '—'}</td>}
                        <td className="p-3 font-bold tnum">{p.availableQuantity} <span className="font-normal text-slate-400">/ {p.totalQuantity} {p.unit}</span></td>
                        {cols.Damaged && <td className="p-3 tnum">{p.damagedQuantity}</td>}
                        {cols.Reorder && <td className="p-3 tnum">{p.reorderLevel}</td>}
                        <td className="p-3"><span className={`badge ${badge[0]}`}>{p.status}</span></td>
                        <td className="p-3">
                          <span className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <Link to={`/products/${id}`} className="text-blue-600 text-xs font-semibold">View</Link>
                            {canWrite && <button onClick={() => setDrawer(p)} className="text-xs font-semibold">Edit</button>}
                            {canWrite && <button onClick={() => setConfirmDel(p)} className="text-xs font-semibold text-red-600">Delete</button>}
                          </span>
                        </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center gap-3 p-3 text-sm border-t border-slate-200 dark:border-white/10">
          <span className="text-slate-500">{total} items</span>
          <div className="ml-auto flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded-lg border disabled:opacity-40">‹</button>
            <span className="px-2 py-1.5">{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded-lg border disabled:opacity-40">›</button>
          </div>
        </div>
      </div>

      <Drawer open={!!drawer} onClose={() => { setDrawer(null); setParams({}); }} title={drawer === 'new' ? en.products.formAdd : en.products.formEdit}>
        {drawer && <ProductForm initial={drawer === 'new' ? null : { id: drawer._id || drawer.id, ...drawer, defaultLocationId: drawer.defaultLocationId?._id }} locations={locations} groups={groups} onDone={(another) => { if (!another) { setDrawer(null); setParams({}); } load(); }} />}
      </Drawer>
      <Confirm open={!!confirmDel} title={en.confirm.delT} text={confirmDel && en.confirm.delD(confirmDel.name)} confirmLabel={en.common.del} danger onConfirm={() => del(confirmDel)} onCancel={() => setConfirmDel(null)} />
    </div>
  );
}
