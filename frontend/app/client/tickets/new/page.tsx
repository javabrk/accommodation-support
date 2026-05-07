'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  { value: 'maintenance', label: 'Maintenance', desc: 'Repairs, damage, or property issues' },
  { value: 'financial',   label: 'Financial',   desc: 'Rent, payments, or financial assistance' },
  { value: 'support',     label: 'Support',     desc: 'Personal support or wellbeing' },
  { value: 'complaint',   label: 'Complaint',   desc: 'Formal complaint or concern' },
  { value: 'general',     label: 'General',     desc: 'General enquiry or information' },
  { value: 'emergency',   label: 'Emergency',   desc: 'Urgent safety or crisis situation' },
];

export default function NewTicketPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', category: '', priority: 'medium',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) { toast.error('Please select a category'); return; }
    setSubmitting(true);
    try {
      const { data } = await clientAPI.createTicket(form);
      toast.success('Request submitted successfully!');
      router.push(`/client/tickets/${data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to submit';
      toast.error(msg);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/client/tickets" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submit a Request</h1>
          <p className="text-gray-500 text-sm">We'll get back to you as soon as possible</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Category *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CATEGORIES.map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, category: value }))}
                className={`text-left p-3 rounded-lg border-2 transition-colors ${
                  form.category === value
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-sm text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject *
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Brief summary of your request"
            value={form.title}
            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Details *
          </label>
          <textarea
            className="input-field"
            rows={6}
            placeholder="Please describe your request in detail. Include any relevant information that might help us assist you."
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            required
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700 border-gray-200' },
              { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700 border-blue-200' },
              { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200' },
              { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-200' },
            ].map(({ value, label, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, priority: value }))}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${color} ${
                  form.priority === value ? 'ring-2 ring-offset-1 ring-teal-400' : 'opacity-60 hover:opacity-80'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {form.priority === 'urgent' && (
            <p className="text-xs text-red-600 mt-2">
              For life-threatening emergencies, call 000 immediately.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/client/tickets" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={submitting}>
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
