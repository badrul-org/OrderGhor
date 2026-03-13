import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Filter } from 'lucide-react';
import Header from '../../components/layout/Header';
import { showToast } from '../../components/shared/Toast';
import { supabase, type ActivationRequest } from '../../lib/supabase';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminRequests() {
  const [requests, setRequests] = useState<ActivationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    setLoading(true);
    let query = supabase
      .from('activation_requests')
      .select('*, profiles(email, business_name, phone)')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setRequests((data as ActivationRequest[]) || []);
    setLoading(false);
  };

  const handleApprove = async (request: ActivationRequest) => {
    setProcessingId(request.id);
    try {
      // Update request status
      const { error: reqError } = await supabase
        .from('activation_requests')
        .update({ status: 'approved' })
        .eq('id', request.id);

      if (reqError) throw reqError;

      // Update user's license type
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ license_type: request.plan })
        .eq('id', request.user_id);

      if (profileError) throw profileError;

      showToast('success', 'অ্যাপ্রুভ হয়েছে!');
      await loadRequests();
    } catch {
      showToast('error', 'ত্রুটি হয়েছে');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: ActivationRequest) => {
    setProcessingId(request.id);
    try {
      const { error } = await supabase
        .from('activation_requests')
        .update({ status: 'rejected', admin_note: 'Rejected by admin' })
        .eq('id', request.id);

      if (error) throw error;
      showToast('success', 'রিজেক্ট হয়েছে');
      await loadRequests();
    } catch {
      showToast('error', 'ত্রুটি হয়েছে');
    } finally {
      setProcessingId(null);
    }
  };

  const planLabel = (plan: string) => {
    if (plan === 'starter') return 'স্টার্টার';
    if (plan === 'pro') return 'প্রো';
    return 'বিজনেস';
  };

  const statusBadge = (status: string) => {
    if (status === 'approved') return 'bg-emerald-50 text-emerald-700';
    if (status === 'rejected') return 'bg-red-50 text-red-700';
    return 'bg-amber-50 text-amber-700';
  };

  const statusLabel = (status: string) => {
    if (status === 'approved') return 'অ্যাপ্রুভড';
    if (status === 'rejected') return 'রিজেক্টেড';
    return 'পেন্ডিং';
  };

  const filters: { id: FilterStatus; label: string }[] = [
    { id: 'pending', label: 'পেন্ডিং' },
    { id: 'approved', label: 'অ্যাপ্রুভড' },
    { id: 'rejected', label: 'রিজেক্টেড' },
    { id: 'all', label: 'সব' },
  ];

  return (
    <div>
      <Header title="অ্যাক্টিভেশন রিকোয়েস্ট" showBack />
      <div className="px-4 py-3 space-y-3">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <div className="flex bg-gray-100 rounded-xl p-0.5 flex-1">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === f.id ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 size={28} className="animate-spin text-gray-300 mx-auto" />
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400">কোনো রিকোয়েস্ট নেই</p>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => (
              <div key={req.id} className="bg-white rounded-xl p-4 shadow-xs border border-gray-100/60 space-y-3">
                {/* User Info */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {req.profiles?.business_name || req.profiles?.email || 'Unknown'}
                    </p>
                    <p className="text-[11px] text-gray-400">{req.profiles?.email}</p>
                    {req.profiles?.phone && (
                      <p className="text-[11px] text-gray-400">{req.profiles.phone}</p>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadge(req.status)}`}>
                    {statusLabel(req.status)}
                  </span>
                </div>

                {/* Request Details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-gray-400 text-[10px]">প্ল্যান</p>
                    <p className="font-semibold text-gray-700">{planLabel(req.plan)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-gray-400 text-[10px]">পেমেন্ট</p>
                    <p className="font-semibold text-gray-700">{req.payment_method} — ৳{req.amount}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5 col-span-2">
                    <p className="text-gray-400 text-[10px]">ট্রানজেকশন ID</p>
                    <p className="font-mono font-semibold text-gray-700">{req.transaction_id}</p>
                  </div>
                </div>

                {/* Date */}
                <p className="text-[10px] text-gray-400">
                  {new Date(req.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>

                {/* Actions */}
                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(req)}
                      disabled={processingId === req.id}
                      className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold active:bg-emerald-100 border border-emerald-200/60 disabled:opacity-50 transition-colors"
                    >
                      {processingId === req.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      অ্যাপ্রুভ
                    </button>
                    <button
                      onClick={() => handleReject(req)}
                      disabled={processingId === req.id}
                      className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold active:bg-red-100 border border-red-200/60 disabled:opacity-50 transition-colors"
                    >
                      <XCircle size={14} />
                      রিজেক্ট
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
