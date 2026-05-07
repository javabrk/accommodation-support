'use client';
import { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { Plus, Eye, ClipboardCheck, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

// ─── Checklist template ───────────────────────────────────────────────────────
const CHECKLIST = [
  {
    category: '🔥 Fire Safety',
    items: [
      'Smoke alarms present and tested',
      'Carbon monoxide detectors present',
      'Fire extinguisher accessible and in date',
      'Fire doors close properly and are not wedged open',
      'Fire escape routes clear and unobstructed',
      'Emergency exit signs visible and lit',
    ],
  },
  {
    category: '⚡ Electrical',
    items: [
      'Consumer unit (fuse box) accessible and labelled',
      'No exposed or damaged wiring visible',
      'Sockets and switches in good condition',
      'No overloaded extension leads',
      'Electrical appliances in safe condition',
      'Emergency lighting functional',
    ],
  },
  {
    category: '🚿 Plumbing & Gas',
    items: [
      'No visible leaks under sinks or around toilets',
      'Hot water working (min 60°C at tap)',
      'Gas appliances have valid safety certificate',
      'No smell of gas detected',
      'Boiler serviced within last 12 months',
    ],
  },
  {
    category: '🧹 Cleanliness & Condition',
    items: [
      'Property clean and free from pests',
      'No significant mould or damp patches',
      'Walls and ceilings in acceptable condition',
      'Flooring safe and in good condition',
      'Windows and doors open/close properly',
      'Kitchen clean and appliances working',
      'Bathroom clean and facilities working',
    ],
  },
  {
    category: '🔒 Security',
    items: [
      'Front door locks secure (deadbolt or multi-point)',
      'Windows lockable on ground floor',
      'Back/side door locks secure',
      'No signs of forced entry or damage',
    ],
  },
  {
    category: '🏗️ Structural & General',
    items: [
      'Roof in good condition (no visible damage)',
      'Gutters clear and draining',
      'Garden/communal areas tidy and safe',
      'Communal areas clean and accessible',
      'Adequate heating in all rooms',
      'Adequate ventilation in kitchen and bathroom',
    ],
  },
];

type ItemResult = 'pass' | 'fail' | 'issues' | 'na';
interface CheckItem { category: string; item: string; result: ItemResult; note: string; }
interface Inspection {
  id: string; property_id: string; property_address: string; town_city: string;
  postcode: string; inspector_name: string; inspection_date: string;
  overall_result: string; notes: string; items: CheckItem[]; created_at: string;
}

const resultBadge = (r: string) => {
  if (r === 'pass')   return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3"/>Pass</span>;
  if (r === 'fail')   return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3"/>Fail</span>;
  if (r === 'issues') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><AlertTriangle className="w-3 h-3"/>Issues</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">N/A</span>;
};

export default function ChecklistsPage() {
  const [inspections, setInspections]   = useState<Inspection[]>([]);
  const [properties, setProperties]     = useState<{ id: string; address: string; town_city: string }[]>([]);
  const [loading, setLoading]           = useState(true);
  const [startOpen, setStartOpen]       = useState(false);
  const [viewOpen, setViewOpen]         = useState(false);
  const [viewing, setViewing]           = useState<Inspection | null>(null);
  const [saving, setSaving]             = useState(false);

  // Form state
  const [propertyId, setPropertyId]     = useState('');
  const [inspDate, setInspDate]         = useState(new Date().toISOString().slice(0, 10));
  const [generalNotes, setGeneralNotes] = useState('');
  const [items, setItems]               = useState<CheckItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [insp, props] = await Promise.all([
        adminAPI.getInspections(),
        adminAPI.getProperties(),
      ]);
      setInspections(insp.data);
      setProperties(props.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openStart = () => {
    setPropertyId('');
    setInspDate(new Date().toISOString().slice(0, 10));
    setGeneralNotes('');
    // Build flat items list
    const flat: CheckItem[] = [];
    CHECKLIST.forEach(cat => cat.items.forEach(item => flat.push({ category: cat.category, item, result: 'pass', note: '' })));
    setItems(flat);
    setStartOpen(true);
  };

  const setItemResult = (idx: number, result: ItemResult) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, result } : it));
  const setItemNote = (idx: number, note: string) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, note } : it));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) { toast.error('Please select a property'); return; }
    setSaving(true);
    try {
      await adminAPI.createInspection({ propertyId, inspectionDate: inspDate, items, notes: generalNotes });
      toast.success('Inspection saved');
      setStartOpen(false);
      load();
    } catch { toast.error('Failed to save inspection'); }
    finally { setSaving(false); }
  };

  // Stats
  const total  = inspections.length;
  const passes = inspections.filter(i => i.overall_result === 'pass').length;
  const issues = inspections.filter(i => i.overall_result === 'issues').length;
  const fails  = inspections.filter(i => i.overall_result === 'fail').length;

  // Group items by category for the view modal
  const groupedItems = (its: CheckItem[]) => {
    const map: Record<string, CheckItem[]> = {};
    its.forEach(it => { if (!map[it.category]) map[it.category] = []; map[it.category].push(it); });
    return map;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Checklists</h1>
          <p className="text-gray-500 text-sm mt-1">Housing officer property inspections</p>
        </div>
        <button onClick={openStart} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Start Inspection
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',  value: total,  color: 'text-gray-700',  bg: 'bg-gray-50' },
          { label: 'Pass',   value: passes, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Issues', value: issues, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Fail',   value: fails,  color: 'text-red-700',   bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`card p-4 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Property', 'Town / City', 'Date', 'Inspector', 'Result', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading…</td></tr>}
              {!loading && inspections.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                  <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  No inspections yet — click "Start Inspection" to begin
                </td></tr>
              )}
              {inspections.map(ins => (
                <tr key={ins.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{ins.property_address}</td>
                  <td className="px-4 py-3 text-gray-600">{ins.town_city} · {ins.postcode}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(ins.inspection_date).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3 text-gray-600">{ins.inspector_name}</td>
                  <td className="px-4 py-3">{resultBadge(ins.overall_result)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setViewing(ins); setViewOpen(true); }}
                      className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 font-medium"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Start Inspection Modal ── */}
      <Modal open={startOpen} onClose={() => setStartOpen(false)} title="Start Property Inspection" size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
              <select className="input-field" value={propertyId} onChange={e => setPropertyId(e.target.value)} required>
                <option value="">Select property…</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.address} — {p.town_city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Date</label>
              <input type="date" className="input-field" value={inspDate} onChange={e => setInspDate(e.target.value)} />
            </div>
          </div>

          {/* Checklist items grouped by category */}
          {CHECKLIST.map(cat => (
            <div key={cat.category}>
              <h3 className="font-semibold text-gray-800 mb-2">{cat.category}</h3>
              <div className="space-y-2">
                {cat.items.map(item => {
                  const idx = items.findIndex(it => it.category === cat.category && it.item === item);
                  if (idx === -1) return null;
                  const cur = items[idx];
                  return (
                    <div key={item} className="border border-gray-200 rounded-lg p-3">
                      <p className="text-sm text-gray-700 mb-2">{item}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(['pass','fail','issues','na'] as ItemResult[]).map(r => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setItemResult(idx, r)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                              cur.result === r
                                ? r === 'pass'   ? 'bg-green-600 text-white border-green-600'
                                : r === 'fail'   ? 'bg-red-600 text-white border-red-600'
                                : r === 'issues' ? 'bg-amber-500 text-white border-amber-500'
                                :                  'bg-gray-500 text-white border-gray-500'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {r === 'na' ? 'N/A' : r.charAt(0).toUpperCase() + r.slice(1)}
                          </button>
                        ))}
                      </div>
                      {(cur.result === 'fail' || cur.result === 'issues') && (
                        <input
                          type="text"
                          className="input-field text-sm"
                          placeholder="Add note about this issue…"
                          value={cur.note}
                          onChange={e => setItemNote(idx, e.target.value)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Overall Notes</label>
            <textarea className="input-field" rows={3} value={generalNotes} onChange={e => setGeneralNotes(e.target.value)} placeholder="Any general observations…" />
          </div>

          <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-white pb-1">
            <button type="button" className="btn-secondary" onClick={() => setStartOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Inspection'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── View Inspection Modal ── */}
      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Inspection Report" size="lg">
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{viewing.property_address}</p>
                <p className="text-sm text-gray-500">{viewing.town_city} · {viewing.postcode}</p>
              </div>
              {resultBadge(viewing.overall_result)}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Inspector:</span> <span className="font-medium">{viewing.inspector_name}</span></div>
              <div><span className="text-gray-500">Date:</span> <span className="font-medium">{new Date(viewing.inspection_date).toLocaleDateString('en-GB')}</span></div>
            </div>
            {viewing.notes && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                <p className="font-medium mb-1">Notes:</p>
                <p>{viewing.notes}</p>
              </div>
            )}
            {Object.entries(groupedItems(viewing.items)).map(([cat, catItems]) => (
              <div key={cat}>
                <h3 className="font-semibold text-gray-800 mb-2">{cat}</h3>
                <div className="space-y-1">
                  {catItems.map((it, i) => (
                    <div key={i} className="flex items-start gap-3 py-1.5 border-b border-gray-100 last:border-0">
                      <div className="mt-0.5 flex-shrink-0">{resultBadge(it.result)}</div>
                      <div>
                        <p className="text-sm text-gray-700">{it.item}</p>
                        {it.note && <p className="text-xs text-red-600 mt-0.5">{it.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <button className="btn-secondary" onClick={() => setViewOpen(false)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
