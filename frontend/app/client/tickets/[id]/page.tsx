'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { clientAPI } from '@/lib/api';
import { Ticket } from '@/types';
import { statusBadge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { ArrowLeft, Send } from 'lucide-react';
import { format } from 'date-fns';
import { getUser } from '@/lib/auth';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const user = getUser();

  const loadTicket = async () => {
    try {
      const { data } = await clientAPI.getTicket(id);
      setTicket(data);
    } catch { toast.error('Failed to load ticket'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTicket(); }, [id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await clientAPI.addMessage(id, { message: reply });
      setReply('');
      await loadTicket();
      toast.success('Reply sent');
    } catch { toast.error('Failed to send reply'); }
    finally { setSending(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!ticket) return <div className="text-center py-20 text-gray-500">Ticket not found</div>;

  const isClosed = ticket.status === 'resolved' || ticket.status === 'closed';

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{ticket.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{ticket.category} · Opened {format(new Date(ticket.createdAt), 'dd MMM yyyy')}</p>
        </div>
      </div>

      {/* Status bar */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Status</span>
          {statusBadge(ticket.status)}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Priority</span>
          {statusBadge(ticket.priority)}
        </div>
        {ticket.resolvedAt && (
          <div className="ml-auto text-xs text-gray-400">
            Resolved {format(new Date(ticket.resolvedAt), 'dd MMM yyyy')}
          </div>
        )}
      </div>

      {/* Original message */}
      <div className="card p-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-sm font-medium">
            {user?.firstName?.[0]}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName} <span className="text-gray-400 font-normal">(You)</span></p>
            <p className="text-xs text-gray-400">{format(new Date(ticket.createdAt), 'dd MMM yyyy HH:mm')}</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-line pl-10">{ticket.description}</p>
      </div>

      {/* Conversation */}
      {ticket.messages && ticket.messages.length > 0 && (
        <div className="space-y-4 mb-5">
          {ticket.messages.map((m) => {
            const isMe = m.senderRole === 'client';
            return (
              <div key={m.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                  isMe ? 'bg-teal-100 text-teal-700' : 'bg-primary-100 text-primary-700'
                }`}>
                  {m.senderName?.[0]}
                </div>
                <div className={`max-w-[80%] rounded-xl p-3.5 text-sm ${
                  isMe ? 'bg-teal-50 text-gray-800' : 'bg-white border border-gray-200 text-gray-800'
                }`}>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    {m.senderName} {isMe ? '(You)' : '· Support Staff'}
                  </p>
                  <p className="whitespace-pre-line">{m.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{format(new Date(m.createdAt), 'dd MMM HH:mm')}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply box */}
      {!isClosed ? (
        <form onSubmit={handleReply} className="card p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Add a reply</label>
          <textarea
            className="input-field mb-3"
            rows={4}
            placeholder="Type your message here…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <div className="flex justify-end">
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={sending || !reply.trim()}>
              <Send className="w-4 h-4" /> {sending ? 'Sending…' : 'Send Reply'}
            </button>
          </div>
        </form>
      ) : (
        <div className="card p-5 text-center text-sm text-gray-500 bg-gray-50">
          This ticket is {ticket.status}. Contact support to reopen if needed.
        </div>
      )}
    </div>
  );
}
