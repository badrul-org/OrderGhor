import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import AppShell from './components/layout/AppShell';
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
import { useSettingsStore } from './store/useSettingsStore';
import { seedDemoData } from './db/seed';

export default function App() {
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  useEffect(() => {
    loadSettings();
    seedDemoData();
  }, [loadSettings]);

  return (
    <BrowserRouter>
      <Routes>
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
        </Route>
        <Route path="/activation" element={<Activation />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}
