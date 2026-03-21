import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, User } from 'lucide-react';
import ScrollToTop from '../../components/ScrollToTop';
import { adminLogin } from '../../services/adminApi';
import useAdminStore from '../../store/adminStore';
import { Button, Field, PageShell, SurfaceCard, TextInput } from '../../components/ui/primitives';

function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAdminStore();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await adminLogin(formData.username, formData.password);
      if (response.success) {
        login(response.data.admin, response.data.token);
        navigate('/admin');
      }
    } catch (err) {
      console.error('Login hatasi:', err);
      setError(err.response?.data?.message || 'Giris yapilirken bir hata olustu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-6 sm:py-8 lg:py-10">
      <ScrollToTop />
      <PageShell width="full">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr),480px] lg:items-stretch">
          <SurfaceCard tone="hero" className="overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="space-y-6">
              <span className="gm-eyebrow border-white/20 bg-white/10 text-white">Yetkili panel</span>
              <div className="space-y-4">
                <h1 className="font-display text-5xl leading-none sm:text-6xl">Yonetim, veri ve operasyon tek panelde.</h1>
                <p className="max-w-xl text-sm leading-7 text-white/82 sm:text-base">
                  Admin shell mobile drawer, desktop kalici sidebar ve premium veri yogunlugu hedefiyle yeniden kuruldu.
                </p>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5 sm:p-6 lg:p-8">
            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Admin girisi</p>
                <h2 className="gm-display mt-2 text-4xl">Yetkili oturum</h2>
                <p className="mt-2 text-sm leading-7 text-dark-lighter">Kullanici adi ve sifre ile yonetim paneline giris yapin.</p>
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Kullanici adi">
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-lighter" />
                    <TextInput
                      name="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="admin"
                      className="pl-12"
                      required
                    />
                  </div>
                </Field>

                <Field label="Sifre">
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-lighter" />
                    <TextInput
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="pl-12"
                      required
                    />
                  </div>
                </Field>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Giris yapiliyor...' : 'Giris yap'}
                </Button>
              </form>
            </div>
          </SurfaceCard>
        </div>
      </PageShell>
    </div>
  );
}

export default AdminLogin;
