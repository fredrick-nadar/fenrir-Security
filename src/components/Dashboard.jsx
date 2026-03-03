import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orgSummary, severityStats, scans, totalScans } from '../data/mockData';
import { LayoutGrid, ClipboardCheck, BarChart3, Calendar, Bell, Settings, Info, Ban, AlertTriangle, Search, Filter, Columns, Plus, RefreshCw, List } from 'lucide-react';
import NewScanModal from './NewScanModal';
import Toast from './Toast';

// ─── Sidebar nav items ────────────────────────────────────────────────────────
const NAV_TOP = [
  {
    key: 'dashboard', label: 'Dashboard', path: '/dashboard',
    icon: <LayoutGrid size={18} strokeWidth={1.5} />,
  },
  {
    key: 'projects', label: 'Projects', path: '/projects',
    icon: <ClipboardCheck size={18} strokeWidth={1.5} />,
  },
  {
    key: 'scans', label: 'Scans', path: '/scans',
    icon: (
      <div className="relative">
        <BarChart3 size={18} strokeWidth={1.5} />
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full" />
      </div>
    ),
  },
  {
    key: 'schedule', label: 'Schedule', path: '/schedule',
    icon: <Calendar size={18} strokeWidth={1.5} />,
  },
];

const NAV_BOTTOM = [
  {
    key: 'notifications', label: 'Notifications', path: '/notifications',
    icon: (
      <div className="relative">
        <Bell size={18} strokeWidth={1.5} />
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full" />
      </div>
    ),
  },
  {
    key: 'settings', label: 'Settings', path: '/settings',
    icon: <Settings size={18} strokeWidth={1.5} />,
  },
  {
    key: 'support', label: 'Support', path: '/support',
    icon: <Info size={18} strokeWidth={1.5} />,
  },
];

// ─── Severity card config ─────────────────────────────────────────────────────
const severityConfig = {
  critical: {
    color: '#ef4444', bg: '#fef2f2',
    icon: <Ban size={22} strokeWidth={1.8} color="#ef4444" />,
  },
  high: {
    color: '#f97316', bg: '#fff7ed',
    icon: <AlertTriangle size={22} strokeWidth={1.8} color="#f97316" />,
  },
  medium: {
    color: '#eab308', bg: '#fefce8',
    icon: <AlertTriangle size={22} strokeWidth={1.8} color="#eab308" />,
  },
  low: {
    color: '#6366f1', bg: '#eef2ff',
    icon: <Search size={22} strokeWidth={1.8} color="#6366f1" />,
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

// ─── Scan Detail constants ──────────────────────────────────────────────────
const STEPS = ['Spidering', 'Mapping', 'Testing', 'Validating', 'Reporting'];

const ACTIVITY_LOG = [
  { time: '09:00:00', text: "I'll begin a systematic penetration test on ", link: 'helpdesk.democorp.com', after: ". Let me start with reconnaissance and enumeration." },
  { time: '09:01:00', text: 'Good! target is online. Now let me perform port scanning to identify running services.', link: null },
  { time: '09:02:00', text: 'Excellent reconnaissance results:', sub: '- helpdesk.democorp.com: Apache httpd 2.4.65 on port 80 (web server)\nLet me probe the web server on target first to understand its structure.', link: null },
  { time: '09:03:00', text: 'Great! I found a login page for a Help Desk Platform. I can see a useful comment: "TODO: Delete the testing account (test:test)". Let me test this credential. The login redirects to ', link: '/password/test', after: '. Let me follow that path and explore it.' },
  { time: '09:04:00', text: 'The POST method is not allowed on /password/test. Let me check what the JavaScript does - it posts to ', link: '#', after: ' which means the current page. Let me try a different approach.' },
  { time: '09:05:00', text: "It redirects back to /password/test. Let me check if there's an /api endpoint or look for other paths. Let me also try exploring with the ", link: 'test:test', after: ' password directly on other endpoints.' },
  { time: '09:06:00', text: "Great! I can access the dashboard using the ", highlight: "'X-UserId: 10032'", after: " header. The dashboard shows \"Welcome, John Doe\". This suggests an **IDOR vulnerability** - I can access any user's dashboard by just changing the X-UserId header.", link: null },
];

const FINDINGS = [
  { severity: 'Critical', color: '#ef4444', bg: '#fef2f2', title: 'SQL Injection in Authentication Endpoint', path: '/api/users/profile', desc: 'Time-based blind SQL injection confirmed on user-controlled input during authentication flow.', time: '18:45:23' },
  { severity: 'High',     color: '#f97316', bg: '#fff7ed', title: 'Unauthorized Access to User Metadata',      path: '/api/auth/login',   desc: 'Authenticated low-privilege user was able to access metadata of other users.', time: '18:45:23' },
  { severity: 'Medium',   color: '#eab308', bg: '#fefce8', title: 'Broken Authentication Rate Limiting',        path: '/api/search',       desc: 'No effective rate limiting detected on login attempts. Automated brute-force attacks are possible.', time: '18:45:23' },
];

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const user = currentUser();

  const [activeNav, setActiveNav]     = useState('dashboard');
  const [search, setSearch]             = useState('');
  const [filterOpen, setFilterOpen]     = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType]     = useState('');
  const [viewMode, setViewMode]         = useState('row'); // 'row' | 'column'
  const [selectedScanId, setSelectedScanId] = useState(null);
  const [consoleTab, setConsoleTab]         = useState('activity');
  const [consoleOpen, setConsoleOpen]       = useState(true);
  const [scanList, setScanList]             = useState(scans);
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [toast, setToast]                   = useState(null);
  const filterRef = useRef(null);

  const selectedScan = selectedScanId != null ? scanList.find(s => s.id === selectedScanId) : null;

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    return scanList.filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.type.toLowerCase().includes(q);
      const matchStatus = !filterStatus || s.status === filterStatus;
      const matchType   = !filterType   || s.type   === filterType;
      return matchSearch && matchStatus && matchType;
    });
  }, [scanList, search, filterStatus, filterType]);

  const activeFilterCount = (filterStatus ? 1 : 0) + (filterType ? 1 : 0);

  const handleLogout  = () => { logout(); navigate('/login'); };
  const handleNavClick = (item) => {
    setActiveNav(item.key);
    if (item.key === 'scans') {
      setSelectedScanId(scanList[0].id);
      setConsoleOpen(true);
      setConsoleTab('activity');
    } else {
      setSelectedScanId(null);
    }
  };
  const handleRowClick = () => {};

  const handleNewScan = (newScan) => {
    const id = Date.now();
    setScanList(prev => [{ ...newScan, id }, ...prev]);
    setToast('Scan initiated successfully');
    // After 3 seconds, flip status to Completed
    setTimeout(() => {
      setScanList(prev => prev.map(s =>
        s.id === id ? { ...s, status: 'Completed', progress: 100 } : s
      ));
    }, 3000);
  };

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

        {/* User profile */}
        <div className="px-4 py-4 border-t border-gray-100 flex items-center gap-3 transition-colors">
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

          {/* ── PROJECTS VIEW ─────────────────────────── */}
          {activeNav === 'projects' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#1a1a1a]">Projects</h2>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0CC8A8] text-sm font-semibold text-white hover:bg-[#0ab597] transition-colors cursor-pointer border-none">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  New Project
                </button>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {/* Project Card */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3 hover:border-[#0CC8A8] hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-lg bg-[#e6faf7] flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M2 5a2 2 0 0 1 2-2h2.5l2 2H14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5z" stroke="#0CC8A8" strokeWidth="1.6"/>
                      </svg>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#16a34a] font-semibold">Active</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a1a1a] text-sm">Project X</p>
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs pt-1 border-t border-gray-100">
                    {[
                      { label: 'Org',          value: 'Project X' },
                      { label: 'Owner',        value: 'Nammagiri' },
                      { label: 'Total Scans',  value: '100' },
                      { label: 'Scheduled',    value: '1000' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between">
                        <span className="text-gray-400">{row.label}</span>
                        <span className="font-semibold text-[#1a1a1a]">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── SCHEDULE VIEW ── */}
          {activeNav === 'schedule' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#1a1a1a]">Scheduled Scans</h2>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Scan Name','Type','Status','Progress','Vulnerability','Last Scan'].map(col => (
                          <th key={col} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {scans.filter(s => s.status === 'Scheduled').map(scan => (
                        <tr key={scan.id} className="border-b border-gray-50 last:border-0">
                          <td className="px-5 py-3.5 font-medium text-[#1a1a1a]">{scan.name}</td>
                          <td className="px-5 py-3.5 text-gray-500">{scan.type}</td>
                          <td className="px-5 py-3.5"><StatusChip status={scan.status} /></td>
                          <td className="px-5 py-3.5"><ProgressBar value={scan.progress} /></td>
                          <td className="px-5 py-3.5 text-gray-400 text-xs font-medium">N/A</td>
                          <td className="px-5 py-3.5 text-gray-400 text-xs">{scan.lastScan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
                  {scans.filter(s => s.status === 'Scheduled').length} scheduled scan{scans.filter(s => s.status === 'Scheduled').length !== 1 ? 's' : ''}
                </div>
              </div>
            </>
          )}

          {/* ── NOTIFICATIONS / SETTINGS / SUPPORT placeholder ── */}
          {['notifications', 'settings', 'support'].includes(activeNav) && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-32 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#e6faf7] flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="11" stroke="#0CC8A8" strokeWidth="2"/>
                  <path d="M14 9v6M14 18v1" stroke="#0CC8A8" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-[#1a1a1a] capitalize">{activeNav}</p>
                <p className="text-sm text-gray-400 mt-1">This section is yet to be added</p>
              </div>
            </div>
          )}

          {/* ── SCAN DETAIL VIEW (inline, shown via Scans nav) ── */}
          {activeNav === 'scans' && selectedScan && (
            <>
              {/* Back breadcrumb */}
              <div className="flex items-center gap-1.5 text-sm">
                <button
                  onClick={() => { setActiveNav('dashboard'); setSelectedScanId(null); }}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-[#0CC8A8] transition-colors cursor-pointer bg-transparent border-none p-0 text-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Back to Scans
                </button>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 5l3 3-3 3" stroke="#d1d5db" strokeWidth="1.4" strokeLinecap="round"/></svg>
                <span className="font-semibold text-[#1a1a1a]">{selectedScan.name}</span>
              </div>

              {/* Progress card */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center gap-8">
                  <div className="flex-shrink-0 w-24 h-24 relative">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="10"/>
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#0CC8A8" strokeWidth="10"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - selectedScan.progress / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-[#1a1a1a] leading-none">{selectedScan.progress}%</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">{selectedScan.status}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-0">
                      {STEPS.map((step, i) => (
                        <div key={step} className="flex items-center flex-1">
                          <div className="flex flex-col items-center flex-1">
                            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-1.5 transition-colors
                              ${i === 0 ? 'border-[#0CC8A8] bg-[#0CC8A8]' : 'border-gray-200 bg-white'}`}>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                {i === 0 && <circle cx="8" cy="8" r="3.5" fill="white"/>}
                                {i === 1 && <><rect x="3" y="3" width="4" height="4" rx="0.8" stroke="#d1d5db" strokeWidth="1.4"/><rect x="9" y="3" width="4" height="4" rx="0.8" stroke="#d1d5db" strokeWidth="1.4"/></>}
                                {i === 2 && <path d="M4 8l2.5 2.5L12 5" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>}
                                {i === 3 && <path d="M3 8h10M8 3v10" stroke="#d1d5db" strokeWidth="1.4" strokeLinecap="round"/>}
                                {i === 4 && <rect x="3" y="2" width="10" height="12" rx="1.5" stroke="#d1d5db" strokeWidth="1.4"/>}
                              </svg>
                            </div>
                            <span className={`text-xs font-medium ${i === 0 ? 'text-[#0CC8A8]' : 'text-gray-400'}`}>{step}</span>
                          </div>
                          {i < STEPS.length - 1 && <div className="h-px flex-1 mx-1 mb-6 bg-gray-200" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-stretch mt-6 pt-5 border-t border-gray-100 text-sm">
                  {[
                    { label: 'Scan Type',   value: selectedScan.type },
                    { label: 'Status',      value: selectedScan.status },
                    { label: 'Last Scan',   value: selectedScan.lastScan },
                    { label: 'Credentials', value: '2 Active' },
                    { label: 'Checklists',  value: '40/350', accent: true },
                  ].map((item, i, arr) => (
                    <div
                      key={item.label}
                      className={`flex-1 flex flex-col items-center justify-center py-1 ${
                        i < arr.length - 1 ? 'border-r border-gray-100' : ''
                      }`}
                    >
                      <span className="text-[11px] text-gray-400 mb-0.5">{item.label}</span>
                      <span className={`font-semibold text-sm ${
                        item.accent ? 'text-[#0CC8A8]' : 'text-[#1a1a1a]'
                      }`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Scan Console */}
              {consoleOpen && (
                <div className="bg-white rounded-xl border border-gray-100 flex flex-col">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-[#0CC8A8] animate-pulse" />
                      <span className="text-sm font-semibold text-[#1a1a1a]">Live Scan Console</span>
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-gray-200 text-xs text-gray-400 ml-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#eab308]" />
                        Running...
                      </div>
                    </div>
                    <button onClick={() => setConsoleOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none p-1">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                  </div>

                  <div className="flex" style={{ height: '360px' }}>
                    {/* Activity / Verification panel */}
                    <div className="flex-1 flex flex-col border-r border-gray-100 min-w-0">
                      <div className="flex border-b border-gray-100 px-4 pt-2">
                        {['Activity Log', 'Verification Loops'].map(tab => {
                          const key = tab === 'Activity Log' ? 'activity' : 'verification';
                          return (
                            <button
                              key={tab}
                              onClick={() => setConsoleTab(key)}
                              className="px-4 py-2 text-xs font-semibold border-none cursor-pointer transition-colors bg-transparent"
                              style={{
                                color: consoleTab === key ? '#0CC8A8' : '#9ca3af',
                                borderBottom: consoleTab === key ? '2px solid #0CC8A8' : '2px solid transparent',
                                marginBottom: '-1px',
                              }}
                            >
                              {tab}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex-1 overflow-y-auto px-5 py-4 font-mono text-xs text-[#1a1a1a] leading-relaxed space-y-2.5">
                        {consoleTab === 'activity'
                          ? ACTIVITY_LOG.map((entry, i) => (
                              <div key={i}>
                                <span className="text-gray-400">[{entry.time}] </span>
                                {entry.text}
                                {entry.link && <span className="bg-[#1a1a1a] text-white px-1.5 py-0.5 rounded text-[10px] mx-0.5">{entry.link}</span>}
                                {entry.highlight && <span className="bg-[#dbeafe] text-[#1d4ed8] px-1.5 py-0.5 rounded text-[10px] mx-0.5 font-semibold">{entry.highlight}</span>}
                                {entry.after && <span>{entry.after}</span>}
                                {entry.sub && <div className="mt-1 ml-4 text-gray-500 whitespace-pre-line">{entry.sub}</div>}
                              </div>
                            ))
                          : (
                              <div className="space-y-3 pt-1">
                                {['Verify SQL Injection – /api/auth/login', 'Verify IDOR – /api/users/profile', 'Verify Rate Limit – /api/search'].map((loop, i) => (
                                  <div key={i} className="border border-gray-100 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-semibold text-[#1a1a1a]">{loop}</span>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${i === 0 ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                                        {i === 0 ? 'Confirmed' : 'Pending'}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-gray-400">Loop {i + 1} of 3 · {i === 0 ? '3/3 payloads confirmed' : '0/3 payloads tested'}</p>
                                  </div>
                                ))}
                              </div>
                            )
                        }
                        <div className="flex items-center gap-1 text-gray-400">
                          <div className="w-0.5 h-4 bg-[#0CC8A8] animate-pulse rounded-full" />
                        </div>
                      </div>
                    </div>

                    {/* Finding Log */}
                    <div className="w-72 flex-shrink-0 flex flex-col">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <span className="text-xs font-semibold text-[#1a1a1a]">Finding Log</span>
                      </div>
                      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
                        {FINDINGS.map((f, i) => (
                          <div key={i} className="border border-gray-100 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: f.bg, color: f.color }}>{f.severity}</span>
                              <span className="text-[10px] text-gray-400">{f.time}</span>
                            </div>
                            <p className="text-xs font-semibold text-[#1a1a1a] mb-0.5 leading-snug">{f.title}</p>
                            <p className="text-[10px] text-[#0CC8A8] mb-1.5">{f.path}</p>
                            <p className="text-[10px] text-gray-400 leading-snug">{f.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-2 border-t border-gray-100 flex items-center gap-6 text-[11px] text-gray-400">
                    <span>Sub-Agents: 0</span>
                    <span>Parallel Executions: 2</span>
                    <span>Operations: 1</span>
                    <div className="ml-auto flex items-center gap-4">
                      <span className="text-[#ef4444]">Critical: {selectedScan.vulnerabilities.critical}</span>
                      <span className="text-[#f97316]">High: {selectedScan.vulnerabilities.high}</span>
                      <span className="text-[#eab308]">Medium: {selectedScan.vulnerabilities.medium}</span>
                      <span className="text-[#22c55e]">Low: {selectedScan.vulnerabilities.low}</span>
                    </div>
                  </div>
                </div>
              )}

              {!consoleOpen && (
                <button
                  onClick={() => setConsoleOpen(true)}
                  className="flex items-center gap-2 self-start px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-[#0CC8A8] hover:text-[#0CC8A8] transition-colors cursor-pointer bg-white"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0CC8A8]" />
                  Open Console
                </button>
              )}
            </>
          )}

          {/* ── DASHBOARD VIEW ────────────────────────── */}
          {activeNav === 'dashboard' && <>

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
              <RefreshCw size={14} strokeWidth={1.5} />
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
                <Search size={15} strokeWidth={1.4} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search scans by name or type..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#0CC8A8] transition-colors bg-[#f8fafc]"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                />
              </div>
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setFilterOpen(o => !o)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer
                    ${filterOpen || activeFilterCount > 0
                      ? 'border-[#0CC8A8] bg-[#e6faf7] text-[#0CC8A8]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                >
                  <Filter size={14} strokeWidth={1.5} />
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#0CC8A8] text-white text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {filterOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4 flex flex-col gap-4">
                    {/* Status filter */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Status</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['', 'Completed', 'Scheduled', 'Failed'].map(s => (
                          <button
                            key={s || 'all-status'}
                            onClick={() => setFilterStatus(s)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer
                              ${ filterStatus === s
                                ? 'bg-[#0CC8A8] text-white border-[#0CC8A8]'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-[#0CC8A8] hover:text-[#0CC8A8]' }`}
                          >
                            {s || 'All'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Type filter */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Type</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['', 'Greybox', 'Blackbox', 'Whitebox'].map(t => (
                          <button
                            key={t || 'all-type'}
                            onClick={() => setFilterType(t)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer
                              ${ filterType === t
                                ? 'bg-[#0CC8A8] text-white border-[#0CC8A8]'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-[#0CC8A8] hover:text-[#0CC8A8]' }`}
                          >
                            {t || 'All'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clear */}
                    {activeFilterCount > 0 && (
                      <button
                        onClick={() => { setFilterStatus(''); setFilterType(''); }}
                        className="text-xs text-[#dc2626] font-medium hover:underline text-left cursor-pointer"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setViewMode(v => v === 'row' ? 'column' : 'row')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer
                  ${viewMode === 'column'
                    ? 'border-[#0CC8A8] bg-[#e6faf7] text-[#0CC8A8]'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
              >
                {viewMode === 'column'
                  ? <List size={14} strokeWidth={1.5} />
                  : <Columns size={14} strokeWidth={1.5} />
                }
                {viewMode === 'column' ? 'Row' : 'Column'}
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0CC8A8] text-sm font-semibold text-white hover:bg-[#0ab597] transition-colors cursor-pointer border-none">
                <Plus size={14} strokeWidth={1.8} />
                New scan
              </button>
            </div>

            {/* Table / Card view */}
            {viewMode === 'row' ? (
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
            ) : (
              <div className="p-5 grid grid-cols-2 gap-4 xl:grid-cols-3">
                {filtered.map(scan => (
                  <div
                    key={scan.id}
                    onClick={() => handleRowClick(scan.id)}
                    className="border border-gray-100 rounded-xl p-4 cursor-pointer hover:border-[#0CC8A8] hover:shadow-sm transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#1a1a1a] text-sm">{scan.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{scan.type}</p>
                      </div>
                      <StatusChip status={scan.status} />
                    </div>
                    <ProgressBar value={scan.progress} />
                    <div className="flex items-center justify-between">
                      <VulnBadges v={scan.vulnerabilities} />
                      <span className="text-[11px] text-gray-400">{scan.lastScan}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

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

          </>}{/* end dashboard view */}

        </div>
      </div>

      {/* ── NEW SCAN MODAL ── */}
      <NewScanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleNewScan}
      />

      {/* ── TOAST ── */}
      {toast && (
        <Toast
          message={toast}
          type="success"
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

