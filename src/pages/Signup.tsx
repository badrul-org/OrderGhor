import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../i18n';

export default function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signUp = useAuthStore((s) => s.signUp);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !businessName.trim()) return;

    if (password.length < 6) {
      setError(t.auth.passwordTooShort);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await signUp(email.trim(), password, businessName.trim(), phone.trim());
      if (result.error) {
        if (result.error.includes('already registered')) {
          setError(t.auth.emailExists);
        } else {
          setError(result.error);
        }
      } else {
        navigate('/');
      }
    } catch {
      setError(t.auth.signupError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary-dark flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 shadow-xl">
            অ
          </div>
          <h1 className="text-2xl font-bold text-white">{t.app.name}</h1>
          <p className="text-sm text-white/70 mt-1">{t.app.tagline}</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-gray-800 text-center">{t.auth.signup}</h2>

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">{t.auth.businessName}</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder={t.auth.businessNamePlaceholder}
              className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">{t.auth.phone}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">{t.auth.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">{t.auth.password}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{t.auth.passwordHint}</p>
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-50 rounded-xl">
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!email.trim() || !password.trim() || !businessName.trim() || loading}
            className="w-full h-11 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:opacity-90 disabled:opacity-50 transition-opacity shadow-md"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <UserPlus size={18} />
            )}
            {loading ? t.auth.signingUp : t.auth.signup}
          </button>

          <p className="text-center text-xs text-gray-500">
            {t.auth.hasAccount}{' '}
            <Link to="/login" className="text-primary font-semibold">
              {t.auth.loginLink}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
