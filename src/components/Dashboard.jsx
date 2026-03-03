import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { orgSummary, severityStats, scans, totalScans } from '../data/mockData';
import { LayoutGrid, ClipboardCheck, BarChart3, Calendar, Bell, Settings, Info, Ban, AlertTriangle, Search, SearchAlert, Filter, Columns, Plus, RefreshCw, List, Network, FlaskConical, FileText, Timer, Moon, Sun, Menu, X } from 'lucide-react';
import spideringPng from '../assets/Spidering.png';
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
    icon: <SearchAlert size={22} strokeWidth={1.8} color="#6366f1" />,
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusChip({ status }) {
  const map = {
    Completed:     'bg-[#dcfce7] dark:bg-[#0c2d1a] text-[#16a34a] dark:text-[#4ade80]',
    'In Progress': 'bg-[#e0f2fe] dark:bg-[#0c1f2d] text-[#0369a1] dark:text-[#38bdf8]',
    Scheduled:     'bg-[#f3f4f6] dark:bg-[#1e2435] text-[#6b7280] dark:text-[#9ca3af]',
    Failed:        'bg-[#fee2e2] dark:bg-[#2d1010] text-[#dc2626] dark:text-[#f87171]',
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
      <div className="w-24 h-2 rounded-full bg-gray-100 dark:bg-[#252b3a] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-gray-500 dark:text-[#8891a8] font-medium w-9">{value}%</span>
    </div>
  );
}

// ─── Scan Detail constants ──────────────────────────────────────────────────
const STEPS = ['Spidering', 'Mapping', 'Testing', 'Validating', 'Reporting'];
const STEP_ICONS = [null, Network, FlaskConical, ClipboardCheck, FileText];

const ACTIVITY_LOG = [
  { parts: [
    { t: 'text', v: "I'll begin a systematic penetration test on " },
    { t: 'teal', v: 'helpdesk.democorp.com' },
    { t: 'text', v: '. Let me start with reconnaissance and enumeration.' },
  ]},
  { parts: [
    { t: 'text', v: 'Good! target is online. Now let me perform port scanning to identify running services.' },
  ]},
  { parts: [
    { t: 'text', v: 'Excellent reconnaissance results:' },
  ], sub: '- helpdesk.democorp.com: Apache httpd 2.4.65 on port 80 (web server)\nLet me probe the web server on target first to understand its structure.' },
  { parts: [
    { t: 'text', v: 'Great! I found a login page for a Help Desk Platform. I can see a useful comment: ' },
    { t: 'red',  v: '"TODO: Delete the testing account (test:test)"' },
    { t: 'text', v: '. Let me test this credential. The login redirects to ' },
    { t: 'pill', v: '/password/test' },
    { t: 'text', v: '. Let me follow that path and explore it.' },
  ]},
  { parts: [
    { t: 'text', v: 'The POST method is not allowed on /password/test. Let me check what the JavaScript does - it posts to ' },
    { t: 'teal', v: "'#'" },
    { t: 'text', v: ' which means the current page. Let me try a different approach.' },
  ]},
  { parts: [
    { t: 'text', v: "It redirects back to /password/test. Let me check if there's an /api endpoint or look for other paths. Let me also try exploring with the " },
    { t: 'teal', v: 'test:test' },
    { t: 'text', v: ' password directly on other endpoints.' },
  ]},
  { parts: [
    { t: 'text',     v: 'Great! I can access the dashboard using the ' },
    { t: 'chip',     v: "'X-UserId: 10032'" },
    { t: 'text',     v: ' header. The dashboard shows "Welcome, John Doe". This suggests an ' },
    { t: 'bold-red', v: '**IDOR vulnerability**' },
    { t: 'text',     v: " - I can access any user's dashboard by just changing the X-UserId header." },
  ]},
];

const FINDINGS = [
  { severity: 'Critical', color: '#ef4444', bg: '#fef2f2', title: 'SQL Injection in Authentication Endpoint', path: '/api/users/profile', desc: 'Time-based blind SQL injection confirmed on user-controlled input during authentication flow.', time: '18:45:23' },
  { severity: 'High',     color: '#f97316', bg: '#fff7ed', title: 'Unauthorized Access to User Metadata',      path: '/api/auth/login',   desc: 'Authenticated low-privilege user was able to access metadata of other users.', time: '18:45:23' },
  { severity: 'Medium',   color: '#eab308', bg: '#fefce8', title: 'Broken Authentication Rate Limiting',        path: '/api/search',       desc: 'No effective rate limiting detected on login attempts. Automated brute-force attacks are possible.', time: '18:45:23' },
];


export default function Dashboard() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const user = currentUser();

  const [activeNav, setActiveNav]     = useState('dashboard');
  const [search, setSearch]             = useState('');
  const [filterOpen, setFilterOpen]     = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType]     = useState('');
  const [viewMode, setViewMode]         = useState('row'); 
  const [selectedScanId, setSelectedScanId] = useState(null);
  const [consoleTab, setConsoleTab]         = useState('activity');
  const [consoleOpen, setConsoleOpen]       = useState(true);
  const [scanList, setScanList]             = useState(scans);
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [toast, setToast]                   = useState(null);
  const [page, setPage]                     = useState(0);
  const [scanStartTime, setScanStartTime]   = useState(() => new Date());
  const [lastScanTime, setLastScanTime]     = useState(() => new Date(Date.now() - 4 * 24 * 60 * 60 * 1000));
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState('4 days ago');
  const PAGE_SIZE = 15;
  const filterRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const [activeScanId, setActiveScanId] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tick the "X mins/secs ago" label every second
  useEffect(() => {
    const fmt = () => {
      const diff = Math.floor((Date.now() - lastScanTime.getTime()) / 1000);
      if (diff < 60)  return `${diff}s ago`;
      const m = Math.floor(diff / 60);
      if (m < 60)     return `${m} min${m !== 1 ? 's' : ''} ago`;
      const h = Math.floor(m / 60);
      if (h < 24)     return `${h} hr${h !== 1 ? 's' : ''} ago`;
      const d = Math.floor(h / 24);
      return `${d} day${d !== 1 ? 's' : ''} ago`;
    };
    setLastUpdatedLabel(fmt());
    const id = setInterval(() => setLastUpdatedLabel(fmt()), 1000);
    return () => clearInterval(id);
  }, [lastScanTime]);

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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Reset to page 0 whenever filters/search change
  useEffect(() => { setPage(0); }, [search, filterStatus, filterType]);

  const filtered = useMemo(() => {
    return scanList.filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.type.toLowerCase().includes(q);
      const matchStatus = !filterStatus || s.status === filterStatus;
      const matchType   = !filterType   || s.type   === filterType;
      return matchSearch && matchStatus && matchType;
    });
  }, [scanList, search, filterStatus, filterType]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const activeFilterCount = (filterStatus ? 1 : 0) + (filterType ? 1 : 0);

  const handleLogout  = () => { logout(); navigate('/login'); };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    // ── Header ──────────────────────────────────────────────────────────
    doc.setFillColor(12, 200, 168);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 48, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('fenrir Security — Scan Report', 40, 31);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const now = new Date().toLocaleString();
    doc.text(`Generated: ${now}`, doc.internal.pageSize.getWidth() - 40, 31, { align: 'right' });

    // ── Summary row ──────────────────────────────────────────────────────
    const completed  = scanList.filter(s => s.status === 'Completed').length;
    const scheduled  = scanList.filter(s => s.status === 'Scheduled').length;
    const failed     = scanList.filter(s => s.status === 'Failed').length;
    const inProgress = scanList.filter(s => s.status === 'In Progress').length;

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.text(
      `Total: ${scanList.length}   Completed: ${completed}   In Progress: ${inProgress}   Scheduled: ${scheduled}   Failed: ${failed}`,
      40, 68
    );

    // ── Table ────────────────────────────────────────────────────────────
    const rows = scanList.map(s => [
      s.name,
      s.type,
      s.status,
      `${s.progress}%`,
      s.vulnerabilities.critical,
      s.vulnerabilities.high,
      s.vulnerabilities.medium,
      s.vulnerabilities.low,
      s.lastScan,
    ]);

    autoTable(doc, {
      startY: 80,
      head: [['Scan Name', 'Type', 'Status', 'Progress', 'Critical', 'High', 'Medium', 'Low', 'Last Scan']],
      body: rows,
      styles: { fontSize: 8, cellPadding: 5, font: 'helvetica' },
      headStyles: {
        fillColor: [12, 200, 168],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 160 },
        1: { cellWidth: 70,  halign: 'center' },
        2: { cellWidth: 80,  halign: 'center' },
        3: { cellWidth: 55,  halign: 'center' },
        4: { cellWidth: 48,  halign: 'center', textColor: [239, 68, 68] },
        5: { cellWidth: 42,  halign: 'center', textColor: [249, 115, 22] },
        6: { cellWidth: 52,  halign: 'center', textColor: [234, 179, 8] },
        7: { cellWidth: 36,  halign: 'center', textColor: [34, 197, 94] },
        8: { cellWidth: 'auto' },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didDrawCell: (data) => {
        // colour the Status cell background
        if (data.section === 'body' && data.column.index === 2) {
          const status = data.cell.raw;
          const colours = {
            Completed:    [220, 252, 231],
            'In Progress':[224, 242, 254],
            Scheduled:    [243, 244, 246],
            Failed:       [254, 226, 226],
          };
          const fill = colours[status];
          if (fill) {
            doc.setFillColor(...fill);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            const textColours = {
              Completed:    [22, 163, 74],
              'In Progress':[3, 105, 161],
              Scheduled:    [107, 114, 128],
              Failed:       [220, 38, 38],
            };
            doc.setTextColor(...(textColours[status] || [0,0,0]));
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(
              status,
              data.cell.x + data.cell.width / 2,
              data.cell.y + data.cell.height / 2 + 3,
              { align: 'center' }
            );
          }
        }
      },
      // page numbers
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 16,
          { align: 'center' }
        );
      },
    });

    doc.save(`fenrir-scan-report-${Date.now()}.pdf`);
  };

  // Format a timestamp as HH:MM:SS offset by `offsetMinutes` from scanStartTime
  const logTime = (offsetMinutes) => {
    const d = new Date(scanStartTime.getTime() + offsetMinutes * 60 * 1000);
    return d.toTimeString().slice(0, 8);
  };

  const handleNavClick = (item) => {
    setActiveNav(item.key);
    setSidebarOpen(false);
    if (item.key === 'scans') {
      setScanStartTime(new Date());
      setSelectedScanId(scanList[0].id);
      setConsoleOpen(true);
      setConsoleTab('activity');
    } else {
      setSelectedScanId(null);
    }
  };
  const handleRowClick = (id) => {
    setScanStartTime(new Date());
    setSelectedScanId(id);
    setConsoleOpen(true);
    setConsoleTab('activity');
  };

  const handleNewScan = (newScan) => {
    const id = Date.now();
    setScanStartTime(new Date());
    setLastScanTime(new Date());
    setScanList(prev => [{ ...newScan, id, status: 'In Progress', progress: 0 }, ...prev]);
    setToast({ message: 'Scan initiated successfully', type: 'success', duration: 1000 });

    // Clear any previous interval
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setActiveScanId(id);

    // Gradually increase progress over 10 seconds (tick every 1s, +10% each)
    let tick = 0;
    scanIntervalRef.current = setInterval(() => {
      tick++;
      const newProgress = Math.min(tick * 10, 100);
      setScanList(prev => prev.map(s =>
        s.id === id ? { ...s, progress: newProgress, ...(newProgress === 100 ? { status: 'Completed' } : {}) } : s
      ));
      if (newProgress >= 100) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
        setActiveScanId(null);
      }
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-[#0d1117] overflow-hidden" style={{ fontFamily: 'Outfit, sans-serif' }}>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[220px] md:w-[200px] flex-shrink-0 bg-white dark:bg-[#161922] border-r border-gray-100 dark:border-[#212637] flex flex-col h-full transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#0CC8A8] flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white" />
          </div>
          <span className="text-lg font-semibold text-[#1a1a1a] dark:text-[#e8ecf5] tracking-tight">aps</span>
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
                  ${active ? 'bg-[#e6faf7] dark:bg-[#0c2620] text-[#0CC8A8]' : 'bg-transparent text-[#6b7280] dark:text-[#8891a8] hover:bg-gray-50 dark:hover:bg-[#1b2030] hover:text-[#1a1a1a] dark:hover:text-[#e8ecf5]'}`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}

          <div className="my-3 border-t border-gray-100 dark:border-[#212637]" />

          {NAV_BOTTOM.map(item => {
            const active = activeNav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer border-none transition-colors w-full text-left
                  ${active ? 'bg-[#e6faf7] dark:bg-[#0c2620] text-[#0CC8A8]' : 'bg-transparent text-[#6b7280] dark:text-[#8891a8] hover:bg-gray-50 dark:hover:bg-[#1b2030] hover:text-[#1a1a1a] dark:hover:text-[#e8ecf5]'}`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}

          {/* Logout */}
          <button
            onClick={() => { handleLogout(); setSidebarOpen(false); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer border-none transition-colors w-full text-left bg-transparent text-[#ef4444] hover:bg-[#fee2e2] dark:hover:bg-[#2d1010] hover:text-[#dc2626]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log out
          </button>
        </nav>

        {/* User profile */}
        <div className="px-4 py-4 border-t border-gray-100 dark:border-[#212637] flex items-center gap-3 transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#0CC8A8]/20 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2a3 3 0 1 1 0 6A3 3 0 0 1 8 2zm0 7c3.314 0 6 1.343 6 3v1H2v-1c0-1.657 2.686-3 6-3z" fill="#0CC8A8"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#1a1a1a] dark:text-[#e8ecf5] truncate">{user?.email || 'admin@edu.com'}</p>
            <p className="text-[11px] text-gray-400">Security Lead</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 text-gray-400">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
<div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f8fafc] dark:bg-[#0d1117]">

        {/* Top Header */}
        <header className="bg-white dark:bg-[#161922] border-b border-gray-100 dark:border-[#212637] px-4 md:px-7 py-3.5 flex items-center justify-between flex-shrink-0 gap-3">
          <div className="flex items-center gap-2">
            {/* Hamburger for mobile */}
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="md:hidden p-1.5 rounded-lg text-gray-500 dark:text-[#8891a8] hover:bg-gray-100 dark:hover:bg-[#1c2234] transition-colors cursor-pointer border-none bg-transparent"
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400">
              <span className="font-medium text-[#1a1a1a] dark:text-[#e8ecf5]">Scan</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              <span>Private Assets</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              <span className="text-[#0CC8A8] font-medium">New Scan</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg border border-gray-200 dark:border-[#2d3448] bg-white dark:bg-transparent text-sm font-medium text-[#1a1a1a] dark:text-[#e8ecf5] hover:border-[#0CC8A8] hover:text-[#0CC8A8] transition-colors cursor-pointer">
              <FileText size={15} strokeWidth={1.5} className="sm:hidden" />
              <span className="hidden sm:inline">Export Report</span>
            </button>
            <button
              onClick={() => setIsDark(d => !d)}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#2d3448] bg-white dark:bg-[#1c2234] text-gray-500 dark:text-[#8891a8] hover:border-[#0CC8A8] hover:text-[#0CC8A8] transition-colors cursor-pointer">
              {isDark ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
            </button>
            <button
              disabled={!activeScanId}
              onClick={() => {
                if (scanIntervalRef.current) {
                  clearInterval(scanIntervalRef.current);
                  scanIntervalRef.current = null;
                }
                setToast({ message: 'Scan stopped successfully', type: 'error', duration: 1000 });
                setScanList(prev => prev.map(s =>
                  s.id === activeScanId ? { ...s, status: 'Failed', progress: s.progress } : s
                ));
                setActiveScanId(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors
                ${!activeScanId
                  ? 'bg-gray-100 dark:bg-[#1c2234] border-transparent text-gray-400 dark:text-[#4a5068] cursor-not-allowed'
                  : 'bg-[#fee2e2] dark:bg-[#2d1a1a] border-[#fecaca] dark:border-[#5c2020] text-[#dc2626] hover:bg-[#fecaca] dark:hover:bg-[#3d2020] cursor-pointer'}`}>
              Stop Scan
            </button>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 md:px-7 py-5 flex flex-col gap-5">

          {/* ── PROJECTS VIEW ─────────────────────────── */}
          {activeNav === 'projects' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#1a1a1a] dark:text-[#e8ecf5]">Projects</h2>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0CC8A8] text-sm font-semibold text-white hover:bg-[#0ab597] transition-colors cursor-pointer border-none">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  New Project
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Project Card */}
                <div className="bg-white dark:bg-[#161b27] rounded-xl border border-gray-100 dark:border-[#212637] p-5 flex flex-col gap-3 hover:border-[#0CC8A8] hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-lg bg-[#e6faf7] flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M2 5a2 2 0 0 1 2-2h2.5l2 2H14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5z" stroke="#0CC8A8" strokeWidth="1.6"/>
                      </svg>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#dcfce7] dark:bg-[#0c2d1a] text-[#16a34a] dark:text-[#4ade80] font-semibold">Active</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a1a1a] text-sm">Project X</p>
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs pt-1 border-t border-gray-100 dark:border-[#212637]">
                    {[
                      { label: 'Org',          value: 'Project X' },
                      { label: 'Owner',        value: 'Nammagiri' },
                      { label: 'Total Scans',  value: '100' },
                      { label: 'Scheduled',    value: '1000' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between">
                        <span className="text-gray-400 dark:text-[#8891a8]">{row.label}</span>
                        <span className="font-semibold text-[#1a1a1a] dark:text-[#e8ecf5]">{row.value}</span>
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
                <h2 className="text-base font-semibold text-[#1a1a1a] dark:text-[#e8ecf5]">Scheduled Scans</h2>
              </div>
              <div className="bg-white dark:bg-[#161b27] rounded-xl border border-gray-100 dark:border-[#212637] flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-[#212637]">
                        {['Scan Name','Type','Status','Progress','Vulnerability','Last Scan'].map(col => (
                          <th key={col} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 dark:text-[#8891a8] uppercase tracking-wide whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {scans.filter(s => s.status === 'Scheduled').map(scan => (
                        <tr key={scan.id} className="border-b border-gray-50 dark:border-[#1a1f2e] last:border-0">
                          <td className="px-5 py-3.5 font-medium text-[#1a1a1a] dark:text-[#e8ecf5]">{scan.name}</td>
                          <td className="px-5 py-3.5 text-gray-500 dark:text-[#8891a8]">{scan.type}</td>
                          <td className="px-5 py-3.5"><StatusChip status={scan.status} /></td>
                          <td className="px-5 py-3.5"><ProgressBar value={scan.progress} /></td>
                          <td className="px-5 py-3.5 text-gray-400 dark:text-[#8891a8] text-xs font-medium">N/A</td>
                          <td className="px-5 py-3.5 text-gray-400 dark:text-[#8891a8] text-xs">{scan.lastScan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-gray-100 dark:border-[#212637] text-xs text-gray-400 dark:text-[#8891a8]">
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
                <p className="text-base font-semibold text-[#1a1a1a] dark:text-[#e8ecf5] capitalize">{activeNav}</p>
                <p className="text-sm text-gray-400 dark:text-[#8891a8] mt-1">This section is yet to be added</p>
              </div>
            </div>
          )}

          {/* ── SCAN DETAIL VIEW (inline, shown via Scans nav) ── */}
          {selectedScan && (activeNav === 'scans' || activeNav === 'dashboard') && (
            <>
              {/* Back breadcrumb */}
              <div className="flex items-center gap-1.5 text-sm">
                <button
                  onClick={() => { setActiveNav('dashboard'); setSelectedScanId(null); }}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-[#0CC8A8] transition-colors cursor-pointer bg-transparent border-none p-0 text-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Back to Dashboard
                </button>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 5l3 3-3 3" stroke="#d1d5db" strokeWidth="1.4" strokeLinecap="round"/></svg>
                <span className="font-semibold text-[#1a1a1a] dark:text-[#e8ecf5]">{selectedScan.name}</span>
              </div>

              {/* Progress card */}
              <div className="bg-white dark:bg-[#161b27] rounded-xl border border-gray-100 dark:border-[#212637] p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                  <div className="flex-shrink-0 w-24 h-24 relative">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke={isDark ? '#1e2535' : '#f3f4f6'} strokeWidth="10"/>
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#0CC8A8" strokeWidth="10"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-[#1a1a1a] dark:text-[#e8ecf5] leading-none">0%</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">In Progress</span>
                    </div>
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-0 overflow-x-auto pb-2">
                      {STEPS.map((step, i) => {
                        const Icon = STEP_ICONS[i];
                        const active = i === 0;
                        return (
                          <div key={step} className="flex items-center flex-1 min-w-[70px]">
                            <div className="flex flex-col items-center flex-1">
                              {active ? (
                                <div className="relative flex items-center justify-center mb-1.5">
                                  {/* Animated pulse ring */}
                                  <span
                                    className="absolute rounded-full bg-[#0CC8A8]"
                                    style={{
                                      width: 52, height: 52,
                                      animation: 'pulseSoft 2s ease-out infinite',
                                    }}
                                  />
                                  {/* Static soft ring */}
                                  <span className="absolute w-12 h-12 rounded-full bg-[#0CC8A8]/20" />
                                  {/* Main circle */}
                                  <div className="relative w-10 h-10 rounded-full bg-[#0CC8A8] flex items-center justify-center z-10">
                                    {i === 0
                                      ? <img src={spideringPng} width={18} height={18} alt="spidering" style={{ filter: 'brightness(0) invert(1)', objectFit: 'contain' }} />
                                      : <Icon size={18} color="white" strokeWidth={1.5} />
                                    }
                                  </div>
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-[#2a3040] bg-white dark:bg-[#1c2234] flex items-center justify-center mb-1.5">
                                  {i === 0
                                    ? <img src={spideringPng} width={18} height={18} alt="spidering" style={{ filter: 'brightness(0) opacity(0.35)', objectFit: 'contain' }} />
                                    : <Icon size={18} color="#d1d5db" strokeWidth={1.5} />
                                  }
                                </div>
                              )}
                              <span className={`text-xs font-medium ${active ? 'text-[#0CC8A8]' : 'text-gray-400'}`}>{step}</span>
                            </div>
                            {i < STEPS.length - 1 && <div className="h-px flex-1 mx-1 mb-6 bg-gray-200 dark:bg-[#2a3040]" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-stretch mt-6 pt-5 border-t border-gray-100 dark:border-[#212637] text-sm gap-y-3">
                  {[
                    { label: 'Scan Type',   value: selectedScan.type },
                    { label: 'Status',      value: 'In Progress' },
                    { label: 'Last Scan',   value: selectedScan.lastScan },
                    { label: 'Credentials', value: '2 Active' },
                    { label: 'Checklists',  value: '40/350', accent: true },
                  ].map((item, i, arr) => (
                    <div
                      key={item.label}
                      className={`flex-1 flex flex-col items-center justify-center py-1 ${
                        i < arr.length - 1 ? 'border-r border-gray-100 dark:border-[#212637]' : ''
                      }`}
                    >
                      <span className="text-[11px] text-gray-400 dark:text-[#8891a8] mb-0.5">{item.label}</span>
                      <span className={`font-semibold text-sm ${
                        item.accent ? 'text-[#0CC8A8]' : 'text-[#1a1a1a] dark:text-[#e8ecf5]'
                      }`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Scan Console */}
              {consoleOpen && (
                <div className="bg-white dark:bg-[#161b27] rounded-xl border border-gray-100 dark:border-[#212637] flex flex-col">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-[#212637]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-[#0CC8A8] animate-pulse" />
                      <span className="text-sm font-semibold text-[#1a1a1a] dark:text-[#e8ecf5]">Live Scan Console</span>
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-[#2a3040] text-xs text-gray-400 dark:text-[#8891a8] ml-2">
                        <Timer size={12} strokeWidth={1.8} className="text-[#eab308]" />
                        Running...
                      </div>
                    </div>
                    <button onClick={() => setConsoleOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none p-1">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row" style={{ minHeight: '300px' }}>
                    {/* Activity / Verification panel — 60% */}
                    <div className="flex flex-col border-b md:border-b-0 md:border-r border-gray-100 dark:border-[#212637] min-w-0 w-full md:w-[60%]" style={{ minHeight: '200px' }}>
                      <div className="flex border-b border-gray-100 dark:border-[#212637] px-4 pt-2">
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
                      <div className="flex-1 overflow-y-auto px-5 py-4 text-xs text-[#1a1a1a] dark:text-[#c8cfe0] leading-relaxed space-y-2.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {consoleTab === 'activity'
                          ? ACTIVITY_LOG.map((entry, i) => (
                              <div key={i}>
                                <span className="text-[#6b7280]">[{logTime(i)}] </span>
                                {entry.parts.map((p, j) => {
                                  if (p.t === 'teal')     return <span key={j} className="text-[#0CC8A8]">{p.v}</span>;
                                  if (p.t === 'red')      return <span key={j} className="text-[#ef4444]">{p.v}</span>;
                                  if (p.t === 'bold-red') return <span key={j} className="text-[#ef4444] font-bold">{p.v}</span>;
                                  if (p.t === 'pill')     return <span key={j} className="bg-[#1a1a1a] dark:bg-[#2a3448] text-white px-1.5 py-0.5 rounded text-[10px] mx-0.5 inline-block">{p.v}</span>;
                                  if (p.t === 'chip')     return <span key={j} className="bg-[#e6faf7] dark:bg-[#0c2620] text-[#0CC8A8] border border-[#0CC8A8]/40 px-1.5 py-0.5 rounded text-[10px] mx-0.5 inline-block font-semibold">{p.v}</span>;
                                  return <span key={j}>{p.v}</span>;
                                })}
                                {entry.sub && (
                                  <div className="mt-1 ml-2 pl-3 border-l-2 border-gray-200 text-gray-500 whitespace-pre-line">{entry.sub}</div>
                                )}
                              </div>
                            ))
                          : (
                              <div className="space-y-3 pt-1">
                                {['Verify SQL Injection – /api/auth/login', 'Verify IDOR – /api/users/profile', 'Verify Rate Limit – /api/search'].map((loop, i) => (
                                  <div key={i} className="border border-gray-100 dark:border-[#2a3040] rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-semibold text-[#1a1a1a] dark:text-[#e8ecf5]">{loop}</span>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${i === 0 ? 'bg-[#dcfce7] dark:bg-[#0c2d1a] text-[#16a34a] dark:text-[#4ade80]' : 'bg-[#f3f4f6] dark:bg-[#1e2435] text-[#6b7280] dark:text-[#9ca3af]'}`}>
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

                    {/* Finding Log — 40% */}
                    <div className="flex flex-col min-w-0 w-full md:w-[40%]" style={{ minHeight: '200px' }}>
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-[#212637]">
                        <span className="text-xs font-semibold text-[#1a1a1a] dark:text-[#e8ecf5]">Finding Log</span>
                      </div>
                      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
                        {FINDINGS.map((f, i) => (
                          <div key={i} className="border border-gray-100 dark:border-[#2a3040] rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: f.bg, color: f.color }}>{f.severity}</span>
                              <span className="text-[10px] text-gray-400 dark:text-[#8891a8]">{logTime(2 + i * 2)}</span>
                            </div>
                            <p className="text-xs font-semibold text-[#1a1a1a] dark:text-[#e8ecf5] mb-0.5 leading-snug">{f.title}</p>
                            <p className="text-[10px] text-[#0CC8A8] mb-1.5">{f.path}</p>
                            <p className="text-[10px] text-gray-400 leading-snug">{f.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 md:px-5 py-2 border-t border-gray-100 dark:border-[#212637] flex flex-wrap items-center gap-3 md:gap-6 text-[11px] text-gray-400 dark:text-[#8891a8]">
                    <span>Sub-Agents: 0</span>
                    <span>Parallel Executions: 2</span>
                    <span>Operations: 1</span>
                    <div className="ml-auto flex items-center gap-4">
                      <span className="text-[#ef4444]">Critical: 1</span>
                      <span className="text-[#f97316]">High:1</span>
                      <span className="text-[#eab308]">Medium: 1</span>
                      <span className="text-[#22c55e]">Low: 0</span>
                    </div>
                  </div>
                </div>
              )}

              {!consoleOpen && (
                <button
                  onClick={() => setConsoleOpen(true)}
                  className="flex items-center gap-2 self-start px-4 py-2 rounded-lg border border-gray-200 dark:border-[#2a3040] text-sm font-medium text-gray-600 dark:text-[#8891a8] hover:border-[#0CC8A8] hover:text-[#0CC8A8] transition-colors cursor-pointer bg-white dark:bg-[#161b27]"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0CC8A8]" />
                  Open Console
                </button>
              )}
            </>
          )}

          {/* ── DASHBOARD VIEW ────────────────────────── */}
          {activeNav === 'dashboard' && !selectedScan && <>

          {/* Org Summary Bar */}
          <div className="bg-white dark:bg-[#161b27] rounded-xl border border-gray-100 dark:border-[#212637] px-4 md:px-6 py-3.5">
            <div className="grid grid-cols-3 md:flex md:items-center gap-3 md:gap-0 text-sm">
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
                  className={`md:flex-1 flex flex-col md:flex-row items-start md:items-center md:justify-center gap-0.5 md:gap-1.5 py-1 md:py-0.5 ${i < arr.length - 1 ? 'md:border-r md:border-gray-200 md:dark:border-[#212637]' : ''}`}
                >
                  <span className="text-[11px] md:text-sm text-gray-400 dark:text-[#8891a8]">{item.label}</span>
                  <span className="font-semibold text-sm md:text-sm text-[#1a1a1a] dark:text-[#e8ecf5]">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-gray-400 dark:text-[#8891a8] mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-gray-200 dark:border-[#212637] md:pl-5 md:ml-4 whitespace-nowrap">
              <RefreshCw size={14} strokeWidth={1.5} />
              <span className="text-xs">{lastUpdatedLabel}</span>
            </div>
          </div>

          {/* Severity Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {severityStats.map(stat => {
              const cfg = severityConfig[stat.id];
              return (
                <div key={stat.id} className="bg-white dark:bg-[#161b27] rounded-xl border border-gray-100 dark:border-[#212637] px-5 py-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-[#8891a8]">{stat.label}</span>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: cfg.bg }}>{cfg.icon}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-3xl font-bold text-[#1a1a1a] dark:text-[#e8ecf5] leading-none">{stat.count}</div>
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
          <div className="bg-white dark:bg-[#161b27] rounded-xl border border-gray-100 dark:border-[#212637] flex flex-col">
            {/* Toolbar */}
            <div className="px-4 md:px-5 py-3.5 flex flex-wrap items-center gap-3 border-b border-gray-100 dark:border-[#212637]">
              <div className="flex-1 relative">
                <Search size={15} strokeWidth={1.4} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search scans by name or type..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-[#2a3040] rounded-lg outline-none focus:border-[#0CC8A8] transition-colors bg-[#f8fafc] dark:bg-[#0d1117] dark:text-[#e8ecf5] dark:placeholder:text-[#4a5468]"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                />
              </div>
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setFilterOpen(o => !o)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer
                    ${filterOpen || activeFilterCount > 0
                      ? 'border-[#0CC8A8] bg-[#e6faf7] dark:bg-[#0c2620] text-[#0CC8A8]'
                      : 'border-gray-200 dark:border-[#2a3040] bg-white dark:bg-[#1c2234] text-gray-600 dark:text-[#8891a8] hover:border-gray-300 dark:hover:border-[#3a4458]'}`}
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
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#1c2234] border border-gray-200 dark:border-[#2a3040] rounded-xl shadow-lg dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] z-50 p-4 flex flex-col gap-4">
                    {/* Status filter */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 dark:text-[#8891a8] uppercase tracking-wide mb-2">Status</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['', 'Completed', 'Scheduled', 'Failed'].map(s => (
                          <button
                            key={s || 'all-status'}
                            onClick={() => setFilterStatus(s)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer
                              ${ filterStatus === s
                                ? 'bg-[#0CC8A8] text-white border-[#0CC8A8]'
                                : 'bg-white dark:bg-[#252d40] text-gray-500 dark:text-[#8891a8] border-gray-200 dark:border-[#2a3040] hover:border-[#0CC8A8] hover:text-[#0CC8A8]' }`}
                          >
                            {s || 'All'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Type filter */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 dark:text-[#8891a8] uppercase tracking-wide mb-2">Type</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['', 'Greybox', 'Blackbox', 'Whitebox'].map(t => (
                          <button
                            key={t || 'all-type'}
                            onClick={() => setFilterType(t)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer
                              ${ filterType === t
                                ? 'bg-[#0CC8A8] text-white border-[#0CC8A8]'
                                : 'bg-white dark:bg-[#252d40] text-gray-500 dark:text-[#8891a8] border-gray-200 dark:border-[#2a3040] hover:border-[#0CC8A8] hover:text-[#0CC8A8]' }`}
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
                    ? 'border-[#0CC8A8] bg-[#e6faf7] dark:bg-[#0c2620] text-[#0CC8A8]'
                    : 'border-gray-200 dark:border-[#2a3040] bg-white dark:bg-[#1c2234] text-gray-600 dark:text-[#8891a8] hover:border-gray-300 dark:hover:border-[#3a4458]'}`}
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
                    {paginated.map(scan => (
                      <tr
                        key={scan.id}
                        className="border-b border-gray-50 dark:border-[#1a1f2e] last:border-0 hover:bg-[#f0fdf9] dark:hover:bg-[#1a2030] transition-colors"
                      >
                        <td className="px-5 py-3.5 font-medium text-[#1a1a1a] dark:text-[#e8ecf5]">{scan.name}</td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-[#8891a8]">{scan.type}</td>
                        <td className="px-5 py-3.5"><StatusChip status={scan.status} /></td>
                        <td className="px-5 py-3.5"><ProgressBar value={scan.progress} /></td>
                        <td className="px-5 py-3.5"><VulnBadges v={scan.vulnerabilities} /></td>
                        <td className="px-5 py-3.5 text-gray-400 dark:text-[#8891a8] text-xs">{scan.lastScan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginated.map(scan => (
                  <div
                    key={scan.id}
                    className="border border-gray-100 dark:border-[#212637] rounded-xl p-4 transition-all flex flex-col gap-3 hover:border-[#0CC8A8] dark:bg-[#1c2234]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#1a1a1a] dark:text-[#e8ecf5] text-sm">{scan.name}</p>
                        <p className="text-xs text-gray-400 dark:text-[#8891a8] mt-0.5">{scan.type}</p>
                      </div>
                      <StatusChip status={scan.status} />
                    </div>
                    <ProgressBar value={scan.progress} />
                    <div className="flex items-center justify-between">
                      <VulnBadges v={scan.vulnerabilities} />
                      <span className="text-[11px] text-gray-400 dark:text-[#8891a8]">{scan.lastScan}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="px-4 md:px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400 dark:text-[#8891a8] border-t border-gray-100 dark:border-[#212637]">
              <span>
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} Scans
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 dark:border-[#2a3040] hover:border-[#0CC8A8] hover:text-[#0CC8A8] transition-colors cursor-pointer bg-white dark:bg-[#1c2234] dark:text-[#8891a8] disabled:opacity-40 disabled:cursor-not-allowed">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7 9L4 6l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <span className="px-2 font-medium text-[#1a1a1a] dark:text-[#e8ecf5]">{page + 1} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 dark:border-[#2a3040] hover:border-[#0CC8A8] hover:text-[#0CC8A8] transition-colors cursor-pointer bg-white dark:bg-[#1c2234] dark:text-[#8891a8] disabled:opacity-40 disabled:cursor-not-allowed">
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
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

