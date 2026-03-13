import { useEffect, useState } from 'react';
import { Users, Clock, CheckCircle2, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { supabase } from '../../lib/supabase';

interface AdminStats {
  totalUsers: number;
  pendingRequests: number;
  approvedTotal: number;
  trialUsers: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, pendingRequests: 0, approvedTotal: 0, trialUsers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [usersRes, pendingRes, approvedRes, trialRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('activation_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('activation_requests').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('license_type', 'trial'),
    ]);

    setStats({
      totalUsers: usersRes.count || 0,
      pendingRequests: pendingRes.count || 0,
      approvedTotal: approvedRes.count || 0,
      trialUsers: trialRes.count || 0,
    });
    setLoading(false);
  };

  const cards = [
    { label: 'মোট ইউজার', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'পেন্ডিং রিকোয়েস্ট', value: stats.pendingRequests, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'মোট অ্যাপ্রুভড', value: stats.approvedTotal, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'ট্রায়াল ইউজার', value: stats.trialUsers, icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div>
      <Header title="অ্যাডমিন প্যানেল" showBack />
      <div className="px-4 py-3 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white rounded-xl p-5 shadow-xs border border-gray-100/60">
                <div className={`p-2 rounded-lg ${card.bg} w-fit mb-2`}>
                  <Icon size={18} className={card.color} />
                </div>
                <p className="text-2xl font-bold text-gray-800">{loading ? '—' : card.value}</p>
                <p className="text-[11px] text-gray-500 font-medium">{card.label}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-gray-100/60 space-y-2.5">
          <h3 className="text-[13px] font-bold text-gray-800 mb-1">দ্রুত অ্যাকশন</h3>
          <button
            onClick={() => navigate('/admin/requests')}
            className="w-full h-11 flex items-center justify-center gap-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-semibold active:bg-amber-100 border border-amber-200/60 transition-colors"
          >
            <Clock size={16} />
            অ্যাক্টিভেশন রিকোয়েস্ট দেখুন
            {stats.pendingRequests > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {stats.pendingRequests}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="w-full h-11 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold active:bg-blue-100 border border-blue-200/60 transition-colors"
          >
            <Users size={16} />
            সব ইউজার দেখুন
          </button>
        </section>
      </div>
    </div>
  );
}
