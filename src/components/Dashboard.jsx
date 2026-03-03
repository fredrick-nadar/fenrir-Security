import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orgSummary, severityStats, scans, totalScans } from '../data/mockData';

// ─── Sidebar nav items ────────────────────────────────────────────────────────
const NAV_TOP = [
  {
    key: 'dashboard', label: 'Dashboard', path: '/dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
        <rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
        <rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
        <rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
      </svg>
    ),
  },
  {
    key: 'projects', label: 'Projects', path: '/projects',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 5a2 2 0 0 1 2-2h2.5l2 2H14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5z" stroke="currentColor" strokeWidth="1.6"/>
      </svg>
    ),
  },
  {
    key: 'scans', label: 'Scans', path: '/scans',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'schedule', label: 'Schedule', path: '/schedule',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="3" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M6 1v4M12 1v4M2 7h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const NAV_BOTTOM = [
  {
    key: 'notifications', label: 'Notifications', path: '/notifications',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 2a5.5 5.5 0 0 0-5.5 5.5v3l-1.5 2.5h14L14.5 10.5v-3A5.5 5.5 0 0 0 9 2z" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M7 14.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6"/>
      </svg>
    ),
  },
  {
    key: 'settings', label: 'Settings', path: '/settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.42 1.42M13.36 13.36l1.42 1.42M3.22 14.78l1.42-1.42M13.36 4.64l1.42-1.42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'support', label: 'Support', path: '/support',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M9 10.5V10c0-1 .8-1.5 1.5-2a2.5 2.5 0 1 0-3-2.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="9" cy="13" r="0.75" fill="currentColor"/>
      </svg>
    ),
  },
];

// ─── Severity card config ─────────────────────────────────────────────────────
const severityConfig = {
  critical: {
    color: '#ef4444', bg: '#fef2f2',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke="#ef4444" strokeWidth="1.8"/>
        <path d="M7.5 7.5l7 7M14.5 7.5l-7 7" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  high: {
    color: '#f97316', bg: '#fff7ed',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2L20.5 19H1.5L11 2z" stroke="#f97316" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M11 9v4" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="11" cy="15.5" r="0.8" fill="#f97316"/>
      </svg>
    ),
  },
  medium: {
    color: '#eab308', bg: '#fefce8',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2L20.5 19H1.5L11 2z" stroke="#eab308" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M11 9v4" stroke="#eab308" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="11" cy="15.5" r="0.8" fill="#eab308"/>
      </svg>
    ),
  },
  low: {
    color: '#6366f1', bg: '#eef2ff',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="9.5" cy="9.5" r="6" stroke="#6366f1" strokeWidth="1.8"/>
        <path d="M14 14L19 19" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M7 9.5h5M9.5 7v5" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusChip({ status }) {
  const map = {
    Completed: 'bg-[#dcfce7] text-[#16a34a]',
    Scheduled: 'bg-[#f3f4f6] text-[#6b7280]',
    Failed:    'bg-[#fee2e2] text-[#dc2626]',
  };
  return (
    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${map[status] || map.Scheduled}`}>
      {status}
    </span>
  );
}

function VulnBadges({ v }) {
  const badges = [
    { val: v.critical, bg: '#ef4444' },
    { val: v.high,     bg: '#f97316' },
    { val: v.medium,   bg: '#eab308' },
    { val: v.low,      bg: '#22c55e' },
  ];
  return (
    <div className="flex items-center gap-1">
      {badges.filter(b => b.val > 0).map((b, i) => (
        <span
          key={i}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-white text-xs font-bold"
          style={{ backgroundColor: b.bg }}
        >
          {b.val}
        </span>
      ))}
    </div>
  );
}

function ProgressBar({ value }) {
  const color = value === 100 ? '#0CC8A8' : value <= 10 ? '#ef4444' : '#f97316';
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-gray-500 font-medium w-9">{value}%</span>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const user = currentUser();

  const [activeNav, setActiveNav] = useState('dashboard');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? scans.filter(s => s.name.toLowerCase().includes(q) || s.type.toLowerCase().includes(q))
      : scans;
  }, [search]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const handleNavClick = (item) => { setActiveNav(item.key); };
  const handleRowClick = (id) => { navigate(`/scans/${id}`); };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden" style={{ fontFamily: 'Outfit, sans-serif' }}>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside className="w-[200px] flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full">
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#0CC8A8] flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white" />
          </div>
          <span className="text-lg font-semibold text-[#1a1a1a] tracking-tight">aps</span>
        </div>

        {/* Top nav */}
        <nav className="flex-1 px-3 flex flex-col gap-0.5 mt-1">
          {NAV_TOP.map(item => {
            const active = activeNav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer border-none transition-colors w-full text-left
                  ${active ? 'bg-[#e6faf7] text-[#0CC8A8]' : 'bg-transparent text-[#6b7280] hover:bg-gray-50 hover:text-[#1a1a1a]'}`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}

          <div className="my-3 border-t border-gray-100" />

          {NAV_BOTTOM.map(item => {
            const active = activeNav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer border-none transition-colors w-full text-left
                  ${active ? 'bg-[#e6faf7] text-[#0CC8A8]' : 'bg-transparent text-[#6b7280] hover:bg-gray-50 hover:text-[#1a1a1a]'}`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User profile — click to log out */}
        <div
          className="px-4 py-4 border-t border-gray-100 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={handleLogout}
          title="Click to log out"
        >
          <div className="w-8 h-8 rounded-full bg-[#0CC8A8]/20 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2a3 3 0 1 1 0 6A3 3 0 0 1 8 2zm0 7c3.314 0 6 1.343 6 3v1H2v-1c0-1.657 2.686-3 6-3z" fill="#0CC8A8"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#1a1a1a] truncate">{user?.email || 'admin@edu.com'}</p>
            <p className="text-[11px] text-gray-400">Security Lead</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 text-gray-400">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <header className="bg-white border-b border-gray-100 px-7 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <span className="font-medium text-[#1a1a1a]">Scan</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            <span>Private Assets</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            <span className="text-[#0CC8A8] font-medium">New Scan</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-[#1a1a1a] hover:border-gray-300 transition-colors cursor-pointer">
              Export Report
            </button>
            <button className="px-4 py-2 rounded-lg bg-[#fee2e2] text-sm font-semibold text-[#dc2626] hover:bg-[#fecaca] transition-colors cursor-pointer border-none">
              Stop Scan
            </button>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-7 py-5 flex flex-col gap-5">

          {/* Org Summary Bar */}
          <div className="bg-white rounded-xl border border-gray-100 px-6 py-3.5 flex items-center text-sm">
            {[
              { label: 'Org',          value: orgSummary.orgName },
              { label: 'Owner',        value: orgSummary.owner },
              { label: 'Total Scans',  value: orgSummary.totalScans },
              { label: 'Scheduled',    value: orgSummary.scheduled },
              { label: 'Rescans',      value: orgSummary.rescans },
              { label: 'Failed Scans', value: orgSummary.failedScans },
            ].map((item, i, arr) => (
              <div
                key={item.label}
                className={`flex-1 flex items-center justify-center gap-1.5 py-0.5 ${i < arr.length - 1 ? 'border-r border-gray-200' : ''}`}
              >
                <span className="text-gray-400">{item.label}:</span>
                <span className="font-semibold text-[#1a1a1a]">{item.value}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-gray-400 pl-5 ml-4 border-l border-gray-200 whitespace-nowrap">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#0CC8A8] flex-shrink-0">
                <path d="M7 1.5A5.5 5.5 0 1 0 12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12.5 1.5v3h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs">{orgSummary.lastUpdated}</span>
            </div>
          </div>

          {/* Severity Cards */}
          <div className="grid grid-cols-4 gap-4">
            {severityStats.map(stat => {
              const cfg = severityConfig[stat.id];
              return (
                <div key={stat.id} className="bg-white rounded-xl border border-gray-100 px-5 py-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">{stat.label}</span>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: cfg.bg }}>{cfg.icon}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-3xl font-bold text-[#1a1a1a] leading-none">{stat.count}</div>
                    <div className={`flex items-center gap-1 text-xs font-semibold ${stat.trend === 'decrease' ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                      {stat.trend === 'decrease'
                        ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 7l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 10V2M2 5l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      }
                      <span>{stat.change} {stat.trend} than yesterday</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-xl border border-gray-100 flex flex-col">
            {/* Toolbar */}
            <div className="px-5 py-3.5 flex items-center gap-3 border-b border-gray-100">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M10 10L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search scans by name or type..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#0CC8A8] transition-colors bg-[#f8fafc]"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-gray-300 transition-colors cursor-pointer">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-gray-300 transition-colors cursor-pointer">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="4" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.4"/>
                  <rect x="9" y="1" width="4" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.4"/>
                  <rect x="1" y="9" width="4" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.4"/>
                  <rect x="9" y="9" width="4" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.4"/>
                </svg>
                Column
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0CC8A8] text-sm font-semibold text-white hover:bg-[#0ab597] transition-colors cursor-pointer border-none">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
                New scan
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Scan Name', 'Type', 'Status', 'Progress', 'Vulnerability', 'Last Scan'].map(col => (
                      <th key={col} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(scan => (
                    <tr
                      key={scan.id}
                      onClick={() => handleRowClick(scan.id)}
                      className="border-b border-gray-50 cursor-pointer transition-colors hover:bg-[#f0fdf9]"
                    >
                      <td className="px-5 py-3.5 font-medium text-[#1a1a1a]">{scan.name}</td>
                      <td className="px-5 py-3.5 text-gray-500">{scan.type}</td>
                      <td className="px-5 py-3.5"><StatusChip status={scan.status} /></td>
                      <td className="px-5 py-3.5"><ProgressBar value={scan.progress} /></td>
                      <td className="px-5 py-3.5"><VulnBadges v={scan.vulnerabilities} /></td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{scan.lastScan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 flex items-center justify-between text-xs text-gray-400 border-t border-gray-100">
              <span>Showing {filtered.length} of {search ? filtered.length : totalScans} Scans</span>
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 hover:border-[#0CC8A8] hover:text-[#0CC8A8] transition-colors cursor-pointer bg-white">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7 9L4 6l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 hover:border-[#0CC8A8] hover:text-[#0CC8A8] transition-colors cursor-pointer bg-white">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

