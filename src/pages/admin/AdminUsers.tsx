import { useEffect, useState } from 'react';
import { Users, Loader2, Search } from 'lucide-react';
import Header from '../../components/layout/Header';
import { supabase, type Profile } from '../../lib/supabase';

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setUsers((data as Profile[]) || []);
    setLoading(false);
  };

  const licenseLabel = (type: string) => {
    if (type === 'trial') return 'ট্রায়াল';
    if (type === 'starter') return 'স্টার্টার';
    if (type === 'pro') return 'প্রো';
    return 'বিজনেস';
  };

  const licenseBadge = (type: string) => {
    if (type === 'trial') return 'bg-gray-100 text-gray-600';
    if (type === 'starter') return 'bg-blue-50 text-blue-700';
    if (type === 'pro') return 'bg-purple-50 text-purple-700';
    return 'bg-amber-50 text-amber-700';
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.business_name.toLowerCase().includes(q) ||
      u.phone.includes(q)
    );
  });

  return (
    <div>
      <Header title="ইউজার তালিকা" showBack />
      <div className="px-4 py-3 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ইউজার খুঁজুন..."
            className="w-full h-10 pl-10 pr-4 bg-white border border-gray-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 px-1">
          <Users size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">মোট {filteredUsers.length} জন ইউজার</span>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 size={28} className="animate-spin text-gray-300 mx-auto" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400">কোনো ইউজার নেই</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-white rounded-xl p-4 shadow-xs border border-gray-100/60">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {user.business_name || '(নাম নেই)'}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                    {user.phone && (
                      <p className="text-[11px] text-gray-400">{user.phone}</p>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${licenseBadge(user.license_type)}`}>
                    {licenseLabel(user.license_type)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-gray-400">
                    যোগদান: {new Date(user.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {user.is_admin && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">অ্যাডমিন</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
