import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div
      className="min-h-screen bg-[#f9f2ef] flex flex-col"
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {/* Navbar */}
      <header className="flex items-center justify-between px-10 py-4 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#0CC8A8] flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white" />
          </div>
          <span className="text-xl font-medium text-[#342d2d] tracking-tight">aps</span>
        </div>
        <button
          onClick={handleLogout}
          className="px-5 py-2 rounded-full border border-[#dddddd] text-sm font-medium text-[#342d2d] bg-white hover:border-[#0e9e9e] hover:text-[#0e9e9e] transition-colors cursor-pointer"
        >
          Log out
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-16 h-16 rounded-full bg-[#0e9e9e]/10 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 4a6 6 0 1 1 0 12A6 6 0 0 1 16 4zm0 14c6.627 0 12 2.686 12 6v2H4v-2c0-3.314 5.373-6 12-6z" fill="#0e9e9e" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-[#342d2d] tracking-tight">
          Welcome to your Dashboard
        </h1>
        <p className="text-base text-[#9e9e9e] text-center max-w-md">
          You're successfully authenticated. Your cybersecurity workspace is ready.
        </p>

        {/* Placeholder cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-4 w-full max-w-3xl">
          {[
            { label: 'Active Scans', value: '0', color: '#0e9e9e' },
            { label: 'Reports Generated', value: '0', color: '#187544' },
            { label: 'Vulnerabilities Found', value: '0', color: '#e05a2b' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl px-7 py-6 shadow-sm flex flex-col gap-1">
              <span className="text-3xl font-bold" style={{ color }}>{value}</span>
              <span className="text-sm text-[#9e9e9e]">{label}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
