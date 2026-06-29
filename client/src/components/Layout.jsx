import { NavLink } from 'react-router-dom';
import { BookOpen, Star, LayoutDashboard } from 'lucide-react';
import NotificationBell from './NotificationBell.jsx';

const navItems = [
  { to: '/', label: '대시보드', icon: LayoutDashboard },
  { to: '/holdings', label: '매수 이력', icon: BookOpen },
  { to: '/watchlist', label: '관심 종목', icon: Star },
];

export default function Layout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-800">
          <h1 className="text-lg font-bold text-white">📈 주식 일지</h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-gray-800 text-xs text-gray-600">
          모닝 리포트: 평일 09:30 KST
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-end px-6">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
