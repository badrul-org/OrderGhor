import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../i18n';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setError('');
    setLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      if (result.error) {
        if (result.error.includes('Invalid login')) {
          setError(t.auth.wrongCredentials);
        } else if (result.error.includes('Email not confirmed')) {
          setError(t.auth.emailNotConfirmed);
        } else {
          setError(result.error);
        }
      } else {
        navigate('/');
      }
    } catch {
      setError(t.auth.loginError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary-dark flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 shadow-xl">
            অ
          </div>
          <h1 className="text-2xl font-bold text-white">{t.app.name}</h1>
          <p className="text-sm text-white/70 mt-1">{t.app.tagline}</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-gray-800 text-center">{t.auth.login}</h2>

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
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-50 rounded-xl">
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!email.trim() || !password.trim() || loading}
            className="w-full h-11 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:opacity-90 disabled:opacity-50 transition-opacity shadow-md"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <LogIn size={18} />
            )}
            {loading ? t.auth.loggingIn : t.auth.login}
          </button>

          <p className="text-center text-xs text-gray-500">
            {t.auth.noAccount}{' '}
            <Link to="/signup" className="text-primary font-semibold">
              {t.auth.signupLink}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
