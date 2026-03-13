import { useEffect, useState } from 'react';
import { Send, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Header from '../components/layout/Header';
import { showToast } from '../components/shared/Toast';
import { useTranslation } from '../i18n';
import { useAuthStore } from '../store/useAuthStore';
import { supabase, type ActivationRequest } from '../lib/supabase';

const planOptions = [
  { id: 'starter' as const, name: 'স্টার্টার', price: '৳299' },
  { id: 'pro' as const, name: 'প্রো', price: '৳499' },
  { id: 'business' as const, name: 'বিজনেস', price: '৳799' },
];

const paymentMethods = [
  { id: 'bkash' as const, name: 'বিকাশ' },
  { id: 'nagad' as const, name: 'নগদ' },
  { id: 'rocket' as const, name: 'রকেট' },
];

export default function RequestActivation() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [plan, setPlan] = useState<'starter' | 'pro' | 'business'>('pro');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<ActivationRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    loadRequests();
  }, [user]);

  const loadRequests = async () => {
    if (!user) return;
    setLoadingRequests(true);
    const { data } = await supabase
      .from('activation_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setRequests((data as ActivationRequest[]) || []);
    setLoadingRequests(false);
  };

  const handleSubmit = async () => {
    if (!user || !transactionId.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('activation_requests').insert({
        user_id: user.id,
        plan,
        transaction_id: transactionId.trim(),
        payment_method: paymentMethod,
        amount: parseFloat(amount) || 0,
      });

      if (error) {
        showToast('error', t.requestActivation.submitError);
      } else {
        showToast('success', t.requestActivation.submitted);
        setTransactionId('');
        setAmount('');
        await loadRequests();
      }
    } catch {
      showToast('error', t.requestActivation.submitError);
    } finally {
      setLoading(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle2 size={16} className="text-emerald-500" />;
    if (status === 'rejected') return <XCircle size={16} className="text-red-500" />;
    return <Clock size={16} className="text-amber-500" />;
  };

  const statusLabel = (status: string) => {
    if (status === 'approved') return t.requestActivation.approved;
    if (status === 'rejected') return t.requestActivation.rejected;
    return t.requestActivation.pending;
  };

  const statusBg = (status: string) => {
    if (status === 'approved') return 'bg-emerald-50 text-emerald-700';
    if (status === 'rejected') return 'bg-red-50 text-red-700';
    return 'bg-amber-50 text-amber-700';
  };

  return (
    <div>
      <Header title={t.requestActivation.title} showBack />
      <div className="px-4 py-3 space-y-3">
        {/* New Request Form */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-gray-100/60 space-y-4">
          <h3 className="text-[13px] font-bold text-gray-800">{t.requestActivation.newRequest}</h3>

          {/* Plan Selector */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-2 block">{t.requestActivation.selectPlan}</label>
            <div className="grid grid-cols-3 gap-2">
              {planOptions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    plan === p.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <p className="text-sm font-bold text-gray-800">{p.name}</p>
                  <p className="text-lg font-bold text-primary">{p.price}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-2 block">{t.requestActivation.paymentMethod}</label>
            <div className="flex gap-2">
              {paymentMethods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                    paymentMethod === m.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-100 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction ID */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">{t.requestActivation.transactionId}</label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder={t.requestActivation.transactionIdPlaceholder}
              className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">{t.requestActivation.amount}</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!transactionId.trim() || loading}
            className="w-full h-11 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:opacity-90 disabled:opacity-50 transition-opacity shadow-md"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {loading ? t.requestActivation.submitting : t.requestActivation.submit}
          </button>
        </section>

        {/* Past Requests */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-gray-100/60 space-y-3">
          <h3 className="text-[13px] font-bold text-gray-800">{t.requestActivation.pastRequests}</h3>

          {loadingRequests ? (
            <div className="py-6 text-center">
              <Loader2 size={24} className="animate-spin text-gray-300 mx-auto" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">{t.requestActivation.noRequests}</p>
          ) : (
            <div className="space-y-2">
              {requests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  {statusIcon(req.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">
                      {req.plan === 'starter' ? 'স্টার্টার' : req.plan === 'pro' ? 'প্রো' : 'বিজনেস'} — {req.payment_method}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">TrxID: {req.transaction_id}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBg(req.status)}`}>
                    {statusLabel(req.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
