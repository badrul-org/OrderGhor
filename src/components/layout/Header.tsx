import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showSettings?: boolean;
  rightAction?: React.ReactNode;
}

export default function Header({ title, showBack, showSettings, rightAction }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto border-b border-white/70 bg-white/70 backdrop-blur-xl lg:rounded-b-2xl lg:border-x lg:border-slate-200/60 lg:shadow-xs">
        <div className="flex items-center justify-between h-14 px-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-[17px] font-bold text-slate-900 truncate tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-1">
          {rightAction}
          {showSettings && (
            <button
              onClick={() => navigate('/settings')}
              className="p-2 -mr-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:bg-slate-200 transition-colors"
            >
              <Settings size={20} />
            </button>
          )}
        </div>
      </div>
      </div>
    </header>
  );
}
