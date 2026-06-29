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
      {/* 데스크톱 사이드바 */}
      <aside className="hidden md:flex w-56 bg-gray-900 border-r border-gray-800 flex-col">
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
        {/* 헤더 */}
        <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 md:px-6">
          <h1 className="text-base font-bold text-white md:hidden">📈 주식 일지</h1>
          <div className="hidden md:block" />
          <NotificationBell />
        </header>

        {/* 메인 콘텐츠 - 모바일에서 하단 탭 높이만큼 패딩 */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* 모바일 하단 탭 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex items-center justify-around z-50 safe-area-bottom">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 flex-1 py-3 text-xs font-medium transition-colors ${
                isActive ? 'text-indigo-400' : 'text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
