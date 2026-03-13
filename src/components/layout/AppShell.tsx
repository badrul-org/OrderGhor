import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';

export default function AppShell() {
  return (
    <div className="relative flex lg:gap-6 min-h-screen bg-[#F8FAFC] overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-indigo-200/25 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-violet-200/25 blur-3xl" />
      </div>
      <Sidebar />
      <main className="relative z-10 flex-1 min-w-0 min-h-screen pb-28 lg:pb-0 overflow-x-hidden">
        <div className="mx-auto max-w-5xl lg:px-6">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
