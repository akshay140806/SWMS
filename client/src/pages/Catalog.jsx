import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Tag, BadgePercent, Trash2, Edit3, Plus, Sparkles, Check, Package, X, FolderPlus } from 'lucide-react';
import api from '../lib/api';
import retail from '../content/retail';
import en from '../content/en';
import { PageHeader, Skeleton, Drawer, Confirm, Badge, inputCls } from '../components/ui';

export default function Catalog({ initialTab = 'groups' }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isPriceRoute = location.pathname.includes('pricelists');
  const [tab, setTab] = useState(isPriceRoute ? 'prices' : initialTab);

  const [groups, setGroups] = useState(null);
  const [lists, setLists] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [gName, setGName] = useState('');
  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');

  // Assigning products to an Item Group
  const [assigningGroup, setAssigningGroup] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [savingGroupProducts, setSavingGroupProducts] = useState(false);

  // Editing price list items in Drawer
  const [editingList, setEditingList] = useState(null);
  const [priceOverrides, setPriceOverrides] = useState({});
  const [savingPrices, setSavingPrices] = useState(false);

  // Deletion confirm
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'group'|'pricelist', id, name }

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canWrite = ['admin', 'warehouse_staff'].includes(user.role);

  // Synchronize tab with route
  useEffect(() => {
    if (location.pathname.includes('pricelists')) {
      setTab('prices');
    } else if (location.pathname.includes('groups')) {
      setTab('groups');
    }
  }, [location.pathname]);

  function switchTab(newTab) {
    setTab(newTab);
    navigate(newTab === 'prices' ? '/pricelists' : '/groups');
  }

  async function load() {
    try {
      const [{ data: g }, { data: p }, { data: prodData }] = await Promise.all([
        api.get('/catalog/groups'),
        api.get('/catalog/price-lists'),
        api.get('/products?limit=200').catch(() => ({ data: { items: [] } }))
      ]);
      setGroups(g.items || []);
      setLists(p.items || []);
      setAllProducts(prodData.items || []);
    } catch (err) {
      toast.error('Failed to load catalogue data.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addGroup(e) {
    e.preventDefault();
    if (!gName.trim()) return;
    try {
      await api.post('/catalog/groups', { name: gName.trim() });
      setGName('');
      load();
      toast.success(en.common.saved || 'Changes saved.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
  }

  async function addList(e) {
    e.preventDefault();
    if (!pName.trim()) return;
    try {
      await api.post('/catalog/price-lists', { name: pName.trim(), description: pDesc.trim() });
      setPName('');
      setPDesc('');
      load();
      toast.success(en.common.saved || 'Changes saved.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
  }

  async function createStarterLists() {
    try {
      await Promise.all([
        api.post('/catalog/price-lists', { name: 'Wholesale Tier', description: 'Discounted bulk rates for verified B2B vendors' }),
        api.post('/catalog/price-lists', { name: 'Retail / Walk-in', description: 'Standard counter and walk-in rates' })
      ]);
      load();
      toast.success('Starter price lists created!');
    } catch (err) {
      toast.error('Failed to create starter price lists.');
    }
  }

  function openAssignDrawer(group) {
    setAssigningGroup(group);
    // Pre-check products currently in this group
    const initialSelected = new Set(
      (group.products || []).map((p) => String(p._id || p.id))
    );
    setSelectedProductIds(initialSelected);
  }

  async function saveGroupProducts() {
    if (!assigningGroup) return;
    setSavingGroupProducts(true);
    try {
      await api.post(`/catalog/groups/${assigningGroup._id}/products`, {
        productIds: Array.from(selectedProductIds)
      });
      toast.success('Group products updated!');
      setAssigningGroup(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update group products.');
    } finally {
      setSavingGroupProducts(false);
    }
  }

  async function removeProduct(groupId, productId) {
    try {
      await api.delete(`/catalog/groups/${groupId}/products/${productId}`);
      toast.success('Product unassigned from group.');
      load();
    } catch (err) {
      toast.error('Failed to remove product from group.');
    }
  }

  function openPriceEditor(list) {
    setEditingList(list);
    const overrides = {};
    if (list.items && Array.isArray(list.items)) {
      list.items.forEach((item) => {
        const prodId = item.product?._id || item.product;
        if (prodId) {
          overrides[prodId] = item.price;
        }
      });
    }
    setPriceOverrides(overrides);
  }

  async function savePriceOverrides() {
    if (!editingList) return;
    setSavingPrices(true);
    try {
      const itemsPayload = Object.entries(priceOverrides)
        .filter(([_, price]) => price !== '' && price !== null && !isNaN(Number(price)))
        .map(([productId, price]) => ({
          product: productId,
          price: Number(price)
        }));

      await api.put(`/catalog/price-lists/${editingList._id}`, {
        name: editingList.name,
        description: editingList.description,
        items: itemsPayload
      });

      toast.success(retail.catalog.savePrices || 'Price overrides saved.');
      setEditingList(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save price overrides.');
    } finally {
      setSavingPrices(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'group') {
        await api.delete(`/catalog/groups/${deleteTarget.id}`);
      } else {
        await api.delete(`/catalog/price-lists/${deleteTarget.id}`);
      }
      toast.success('Deleted successfully.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete item.');
    }
  }

  const isPrices = tab === 'prices';
  const pageTitle = isPrices ? retail.catalog.pricesTitle : retail.catalog.groupsTitle;
  const pageSub = isPrices ? retail.catalog.pricesSub : retail.catalog.groupsSub;

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <PageHeader title={pageTitle} sub={pageSub} />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-white/10 mb-6">
        <button
          onClick={() => switchTab('groups')}
          data-testid="catalog-tab-groups"
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 border-b-2 -mb-px transition ${
            !isPrices ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Tag className="w-4 h-4" />
          {retail.catalog.tabs[0]}
          {groups && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10">{groups.length}</span>}
        </button>

        <button
          onClick={() => switchTab('prices')}
          data-testid="catalog-tab-prices"
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 border-b-2 -mb-px transition ${
            isPrices ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BadgePercent className="w-4 h-4" />
          {retail.catalog.tabs[1]}
          {lists && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10">{lists.length}</span>}
        </button>
      </div>

      {/* Item Groups View */}
      {!isPrices && (
        <div className="space-y-6">
          {canWrite && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">{retail.catalog.gAdd}</h3>
              <form onSubmit={addGroup} className="flex gap-3">
                <input
                  value={gName}
                  onChange={(e) => setGName(e.target.value)}
                  placeholder={retail.catalog.gName}
                  className={inputCls}
                  data-testid="group-name"
                />
                <button
                  type="submit"
                  disabled={!gName.trim()}
                  className="inline-flex items-center gap-2 text-sm font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl px-5 py-2.5 whitespace-nowrap transition"
                >
                  <Plus className="w-4 h-4" />
                  {retail.catalog.gAdd}
                </button>
              </form>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Item Groups & Products</h3>
            {!groups ? (
              <Skeleton rows={3} />
            ) : groups.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">{retail.catalog.emptyG}</p>
            ) : (
              <div className="space-y-4">
                {groups.map((g) => {
                  const prods = g.products || [];
                  return (
                    <div
                      key={g._id}
                      data-testid="group-row"
                      className="border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl overflow-hidden shadow-sm"
                    >
                      {/* Group Header */}
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base shrink-0">
                            <Tag className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-base text-slate-900 dark:text-slate-100">{g.name}</span>
                              <Badge tone={prods.length > 0 ? 'blue' : 'grey'}>
                                {prods.length} product{prods.length === 1 ? '' : 's'}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {prods.length === 0
                                ? 'No products linked yet'
                                : prods.map((p) => p.name).slice(0, 3).join(', ') + (prods.length > 3 ? '...' : '')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {canWrite && (
                            <button
                              onClick={() => openAssignDrawer(g)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition"
                            >
                              <FolderPlus className="w-3.5 h-3.5" />
                              Add Products
                            </button>
                          )}
                          {canWrite && (
                            <button
                              onClick={() => setDeleteTarget({ type: 'group', id: g._id, name: g.name })}
                              className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                              title="Delete group"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Products List Inside Group */}
                      <div className="p-4">
                        {prods.length === 0 ? (
                          <div className="text-center py-5 text-xs text-slate-400">
                            <p className="mb-2">{retail.catalog.noProductsInGroup}</p>
                            {canWrite && (
                              <button
                                onClick={() => openAssignDrawer(g)}
                                className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <Plus className="w-3 h-3" />
                                {retail.catalog.addProductsToGroup}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {prods.map((p) => (
                              <div
                                key={p._id || p.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                                    <Package className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">{p.name}</p>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                      <span className="font-mono">{p.sku}</span>
                                      <span>•</span>
                                      <span className="font-semibold text-slate-700 dark:text-slate-300">₹{p.sellingPrice}</span>
                                      <span>•</span>
                                      <span>{p.available ?? p.totalQuantity} {p.unit || 'pcs'}</span>
                                    </div>
                                  </div>
                                </div>

                                {canWrite && (
                                  <button
                                    onClick={() => removeProduct(g._id, p._id || p.id)}
                                    className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition shrink-0 ml-2"
                                    title={retail.catalog.removeProductFromGroup}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Price Lists View */}
      {isPrices && (
        <div className="space-y-6">
          {canWrite && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">{retail.catalog.pAdd}</h3>
              <form onSubmit={addList} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5">
                  <input
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    placeholder={retail.catalog.pName}
                    className={inputCls}
                    data-testid="pricelist-name"
                  />
                </div>
                <div className="md:col-span-5">
                  <input
                    value={pDesc}
                    onChange={(e) => setPDesc(e.target.value)}
                    placeholder={retail.catalog.pDesc}
                    className={inputCls}
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={!pName.trim()}
                    className="w-full h-full inline-flex items-center justify-center gap-2 text-sm font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl px-4 py-2.5 whitespace-nowrap transition"
                  >
                    <Plus className="w-4 h-4" />
                    {retail.catalog.pAdd}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Active Price Lists</h3>
              {canWrite && (!lists || lists.length === 0) && (
                <button
                  onClick={createStarterLists}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {retail.catalog.quickSetup}
                </button>
              )}
            </div>

            {!lists ? (
              <Skeleton rows={3} />
            ) : lists.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500 mb-4">{retail.catalog.emptyP}</p>
                {canWrite && (
                  <button
                    onClick={createStarterLists}
                    className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-xl px-4 py-2 transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    {retail.catalog.quickSetup}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {lists.map((p) => {
                  const itemCount = p.items?.length || 0;
                  return (
                    <div
                      key={p._id}
                      data-testid="pricelist-row"
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] rounded-xl hover:border-slate-300 transition gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-base shrink-0">
                          %
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{p.name}</span>
                            <Badge tone={itemCount > 0 ? 'green' : 'grey'}>
                              {itemCount} override{itemCount === 1 ? '' : 's'}
                            </Badge>
                          </div>
                          {p.description && <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => openPriceEditor(p)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {retail.catalog.configurePrices}
                        </button>
                        {canWrite && (
                          <button
                            onClick={() => setDeleteTarget({ type: 'pricelist', id: p._id, name: p.name })}
                            className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                            title="Delete price list"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drawer: Assign Products to Item Group */}
      <Drawer
        open={Boolean(assigningGroup)}
        onClose={() => setAssigningGroup(null)}
        title={assigningGroup ? `Assign Products: ${assigningGroup.name}` : ''}
        wide
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Select products to assign to this group. Assigned products will be categorized under <b>{assigningGroup?.name}</b>.
          </p>

          <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-semibold sticky top-0">
                <tr>
                  <th className="p-3 w-10">Select</th>
                  <th className="p-3">Product</th>
                  <th className="p-3 w-28">Current Category</th>
                  <th className="p-3 w-24">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {allProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  allProducts.map((prod) => {
                    const isChecked = selectedProductIds.has(String(prod._id || prod.id));
                    return (
                      <tr
                        key={prod._id || prod.id}
                        onClick={() => {
                          const id = String(prod._id || prod.id);
                          const next = new Set(selectedProductIds);
                          if (next.has(id)) next.delete(id);
                          else next.add(id);
                          setSelectedProductIds(next);
                        }}
                        className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] cursor-pointer"
                      >
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const id = String(prod._id || prod.id);
                              const next = new Set(selectedProductIds);
                              if (e.target.checked) next.add(id);
                              else next.delete(id);
                              setSelectedProductIds(next);
                            }}
                            className="rounded text-blue-600"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{prod.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{prod.sku}</div>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-600 dark:text-slate-300 font-medium">
                            {prod.category || 'General'}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                          ₹{prod.sellingPrice}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/10">
            <span className="text-xs text-slate-500">
              {selectedProductIds.size} product{selectedProductIds.size === 1 ? '' : 's'} selected
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAssigningGroup(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 transition"
              >
                {en.common.cancel || 'Cancel'}
              </button>
              <button
                type="button"
                disabled={savingGroupProducts}
                onClick={saveGroupProducts}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition"
              >
                <Check className="w-3.5 h-3.5" />
                {savingGroupProducts ? 'Saving...' : retail.catalog.assignProducts}
              </button>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Drawer: Configure Price Overrides */}
      <Drawer
        open={Boolean(editingList)}
        onClose={() => setEditingList(null)}
        title={editingList ? `${retail.catalog.configurePrices}: ${editingList.name}` : ''}
        wide
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Set special selling prices for this price list. Leave blank to default to the standard product selling price.
          </p>

          <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-semibold sticky top-0">
                <tr>
                  <th className="p-3">{retail.catalog.productCol}</th>
                  <th className="p-3 w-32">{retail.catalog.standardPriceCol}</th>
                  <th className="p-3 w-40">{retail.catalog.customPriceCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {allProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-slate-400">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  allProducts.map((prod) => {
                    const currentVal = priceOverrides[prod._id] ?? '';
                    return (
                      <tr key={prod._id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                        <td className="p-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{prod.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{prod.sku}</div>
                        </td>
                        <td className="p-3 font-semibold text-slate-600 dark:text-slate-300">
                          ₹{Number(prod.sellingPrice || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3">
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-slate-400 text-xs">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={currentVal}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPriceOverrides((prev) => ({
                                  ...prev,
                                  [prod._id]: val
                                }));
                              }}
                              placeholder={String(prod.sellingPrice || 0)}
                              className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 text-xs outline-none focus:ring-1 focus:ring-blue-600"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setEditingList(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 transition"
            >
              {en.common.cancel || 'Cancel'}
            </button>
            <button
              type="button"
              disabled={savingPrices}
              onClick={savePriceOverrides}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition"
            >
              <Check className="w-3.5 h-3.5" />
              {savingPrices ? 'Saving...' : retail.catalog.savePrices}
            </button>
          </div>
        </div>
      </Drawer>

      {/* Confirmation Dialog */}
      <Confirm
        open={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'group' ? 'Delete Item Group' : 'Delete Price List'}
        text={
          deleteTarget?.type === 'group'
            ? `${retail.catalog.deleteGroupConfirm} (${deleteTarget?.name})`
            : `${retail.catalog.deleteListConfirm} (${deleteTarget?.name})`
        }
        confirmLabel={en.common.delete || 'Delete'}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
