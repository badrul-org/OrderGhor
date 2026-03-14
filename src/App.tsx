import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import AppShell from './components/layout/AppShell';
import AuthGuard from './components/auth/AuthGuard';
import AdminGuard from './components/auth/AdminGuard';
import ToastContainer from './components/shared/Toast';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import NewOrder from './pages/NewOrder';
import OrderDetail from './pages/OrderDetail';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Payments from './pages/Payments';
import Settings from './pages/Settings';
import Activation from './pages/Activation';
import MoreMenu from './pages/MoreMenu';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RequestActivation from './pages/RequestActivation';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRequests from './pages/admin/AdminRequests';
import AdminUsers from './pages/admin/AdminUsers';
import { useSettingsStore } from './store/useSettingsStore';
import { useAuthStore } from './store/useAuthStore';
import { useSyncStore } from './store/useSyncStore';
import { syncService } from './sync/SyncService';
import { seedDemoData } from './db/seed';

export default function App() {
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const syncLicense = useSettingsStore((s) => s.syncLicenseFromProfile);
  const initializeAuth = useAuthStore((s) => s.initialize);
  const setSyncStatus = useSyncStore((s) => s.setStatus);
  const setSyncPending = useSyncStore((s) => s.setPendingCount);

  useEffect(() => {
    // Wire up sync service callbacks to UI store
    syncService.onStatusChange = setSyncStatus;
    syncService.onPendingChange = setSyncPending;

    const init = async () => {
      await initializeAuth();
      await loadSettings();
      await syncLicense();
      await seedDemoData();

      // Initialize sync for logged-in user
      const user = useAuthStore.getState().user;
      if (user) {
        await syncService.initialize(user.id);
      }
    };
    init();
  }, [initializeAuth, loadSettings, syncLicense, setSyncStatus, setSyncPending]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        <Route element={<AuthGuard />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/new-order" element={<NewOrder />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/products" element={<Products />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/more" element={<MoreMenu />} />
            <Route path="/request-activation" element={<RequestActivation />} />

            {/* Admin routes */}
            <Route element={<AdminGuard />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/requests" element={<AdminRequests />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>
          </Route>
          <Route path="/activation" element={<Activation />} />
        </Route>
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}
