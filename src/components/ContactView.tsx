import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  admin_reply: string | null;
  user_name: string;
  user_email: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  userEmail: string;
  userName: string;
  onBack: () => void;
}

const gold = '#f2c377';

const STATUS_COLORS: Record<string, string> = {
  Open: 'rgba(242,195,119,0.15)',
  'In Progress': 'rgba(100,160,255,0.15)',
  Resolved: 'rgba(100,220,130,0.15)',
  Closed: 'rgba(150,150,150,0.15)',
};
const STATUS_TEXT: Record<string, string> = {
  Open: '#f2c377',
  'In Progress': '#64a0ff',
  Resolved: '#64dc82',
  Closed: '#999',
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export const ContactView: React.FC<Props> = ({ userEmail, userName, onBack }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // View popup
  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const fetchTickets = async () => {
    if (!userEmail) return;
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });
    setTickets((data as Ticket[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
    const sub = supabase
      .channel('tickets-user')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, fetchTickets)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [userEmail]);

  // Keep viewTicket in sync with live data
  useEffect(() => {
    if (viewTicket) {
      const updated = tickets.find(t => t.id === viewTicket.id);
      if (updated) setViewTicket(updated);
    }
  }, [tickets]);

  const handleSubmit = async () => {
    if (!title.trim()) { setFormError('Please enter a title.'); return; }
    if (!description.trim()) { setFormError('Please describe your issue.'); return; }
    setFormError('');
    setSubmitting(true);
    const { error } = await supabase.from('support_tickets').insert({
      title: title.trim(),
      description: description.trim(),
      user_email: userEmail,
      user_name: userName,
    });
    setSubmitting(false);
    if (error) { setFormError(error.message); return; }
    setTitle('');
    setDescription('');
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 3000);
    fetchTickets();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('support_tickets').delete().eq('id', id);
    setViewTicket(null);
    fetchTickets();
  };

  const handleEditSave = async () => {
    if (!viewTicket) return;
    setEditSaving(true);
    await supabase.from('support_tickets')
      .update({ title: editTitle.trim(), description: editDesc.trim() })
      .eq('id', viewTicket.id);
    setEditSaving(false);
    setEditing(false);
    fetchTickets();
  };

  const openView = (ticket: Ticket) => {
    setViewTicket(ticket);
    setEditing(false);
    setEditTitle(ticket.title);
    setEditDesc(ticket.description);
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col max-w-lg mx-auto bg-[#0A0A0A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 shrink-0 border-b border-[#f2c377]/10">
        <button onClick={onBack}
          className="flex items-center justify-center rounded-full active:scale-90 transition-transform"
          style={{ width: 38, height: 38, background: 'rgba(242,195,119,0.08)', border: '1px solid rgba(242,195,119,0.2)' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M12 3L6 9l6 6" stroke={gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="font-cinzel text-lg font-bold" style={{ color: gold }}>Contact Us</h1>
          <p className="text-xs text-[#d2c4b3]/50">Raise a support ticket</p>
        </div>
        <svg className="w-6 h-6" style={{ color: gold }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 pb-10 space-y-6">
        {/* New Ticket Form */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(242,195,119,0.04)', border: '1px solid rgba(242,195,119,0.12)' }}>
          <p className="font-cinzel text-sm font-bold" style={{ color: gold }}>New Ticket</p>

          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-widest text-[#d2c4b3]/50">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Brief summary of your issue"
              className="w-full rounded-xl px-4 py-3 text-sm text-[#e5e2e1] placeholder-[#d2c4b3]/30 outline-none focus:ring-1"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(242,195,119,0.15)', focusRingColor: gold }}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-widest text-[#d2c4b3]/50">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe your issue in detail…"
              rows={4}
              className="w-full rounded-xl px-4 py-3 text-sm text-[#e5e2e1] placeholder-[#d2c4b3]/30 outline-none resize-none focus:ring-1"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(242,195,119,0.15)' }}
            />
          </div>

          {formError && <p className="text-xs text-red-400">{formError}</p>}
          {formSuccess && <p className="text-xs" style={{ color: '#64dc82' }}>✓ Ticket submitted successfully!</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 rounded-xl font-cinzel text-sm font-bold uppercase tracking-widest transition-opacity disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${gold}, #b8960c)`, color: '#0A0A0A' }}
          >
            {submitting ? 'Sending…' : 'Send Ticket'}
          </button>
        </div>

        {/* My Tickets */}
        <div>
          <p className="font-cinzel text-sm font-bold mb-3" style={{ color: gold }}>My Tickets</p>

          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: `${gold}30`, borderTopColor: gold }} />
            </div>
          )}

          {!loading && tickets.length === 0 && (
            <p className="text-xs text-center py-8 text-[#d2c4b3]/40">No tickets raised yet.</p>
          )}

          <div className="space-y-3">
            {tickets.map(ticket => (
              <div key={ticket.id} className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(242,195,119,0.1)' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-[#e5e2e1] leading-tight flex-1">{ticket.title}</p>
                  <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest"
                    style={{ background: STATUS_COLORS[ticket.status], color: STATUS_TEXT[ticket.status] }}>
                    {ticket.status}
                  </span>
                </div>
                <p className="text-xs text-[#d2c4b3]/50 line-clamp-2 mb-3">{ticket.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#d2c4b3]/35">{fmtDate(ticket.created_at)}</span>
                  <button onClick={() => openView(ticket)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-opacity active:opacity-70"
                    style={{ background: 'rgba(242,195,119,0.1)', color: gold, border: '1px solid rgba(242,195,119,0.2)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    View
                  </button>
                </div>
                {ticket.admin_reply && (
                  <div className="mt-2 px-3 py-2 rounded-xl text-xs text-[#64dc82]"
                    style={{ background: 'rgba(100,220,130,0.06)', border: '1px solid rgba(100,220,130,0.15)' }}>
                    💬 Admin replied — tap View to read
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* View / Edit Popup */}
      {viewTicket && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) { setViewTicket(null); setEditing(false); } }}>
          <div className="w-full max-w-lg rounded-t-3xl overflow-hidden flex flex-col max-h-[85vh]"
            style={{ background: '#111318', border: '1px solid rgba(242,195,119,0.15)', borderBottom: 'none' }}>

            {/* Popup header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0 border-b border-[#f2c377]/10">
              <p className="font-cinzel text-sm font-bold" style={{ color: gold }}>Ticket Details</p>
              <div className="flex items-center gap-2">
                {/* Edit toggle — only for Open tickets */}
                {viewTicket.status === 'Open' && !editing && (
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest"
                    style={{ background: 'rgba(242,195,119,0.1)', color: gold, border: '1px solid rgba(242,195,119,0.2)' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                )}
                {/* Delete */}
                {viewTicket.status === 'Open' && (
                  <button onClick={() => handleDelete(viewTicket.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest"
                    style={{ background: 'rgba(255,100,100,0.1)', color: '#ff6464', border: '1px solid rgba(255,100,100,0.2)' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                    Delete
                  </button>
                )}
                <button onClick={() => { setViewTicket(null); setEditing(false); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="#d2c4b3" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Status badge */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest"
                  style={{ background: STATUS_COLORS[viewTicket.status], color: STATUS_TEXT[viewTicket.status] }}>
                  {viewTicket.status}
                </span>
              </div>

              {/* Customer details */}
              <div className="rounded-xl px-4 py-3 space-y-1" style={{ background: 'rgba(242,195,119,0.04)', border: '1px solid rgba(242,195,119,0.1)' }}>
                <p className="text-[10px] uppercase tracking-widest text-[#d2c4b3]/40 mb-2">Raised By</p>
                <p className="text-sm text-[#e5e2e1]">{viewTicket.user_name}</p>
                <p className="text-xs text-[#d2c4b3]/50">{viewTicket.user_email}</p>
                <p className="text-[10px] text-[#d2c4b3]/35 mt-1">{fmtDate(viewTicket.created_at)}</p>
              </div>

              {/* Title & Description — editable or read-only */}
              {editing ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-widest text-[#d2c4b3]/50">Title</label>
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm text-[#e5e2e1] outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(242,195,119,0.2)' }} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-widest text-[#d2c4b3]/50">Description</label>
                    <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4}
                      className="w-full rounded-xl px-4 py-3 text-sm text-[#e5e2e1] outline-none resize-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(242,195,119,0.2)' }} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#d2c4b3' }}>
                      Cancel
                    </button>
                    <button onClick={handleEditSave} disabled={editSaving}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                      style={{ background: `linear-gradient(135deg, ${gold}, #b8960c)`, color: '#0A0A0A' }}>
                      {editSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#d2c4b3]/40 mb-1">Title</p>
                    <p className="text-sm font-medium text-[#e5e2e1]">{viewTicket.title}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#d2c4b3]/40 mb-1">Description</p>
                    <p className="text-sm text-[#d2c4b3]/80 leading-relaxed">{viewTicket.description}</p>
                  </div>
                </div>
              )}

              {/* Admin Reply */}
              {viewTicket.admin_reply && (
                <div className="rounded-xl px-4 py-3 space-y-1" style={{ background: 'rgba(100,220,130,0.06)', border: '1px solid rgba(100,220,130,0.2)' }}>
                  <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#64dc82' }}>Admin Response</p>
                  <p className="text-sm text-[#e5e2e1] leading-relaxed">{viewTicket.admin_reply}</p>
                  <p className="text-[10px] text-[#d2c4b3]/35 mt-1">Updated {fmtDate(viewTicket.updated_at)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
