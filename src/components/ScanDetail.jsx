import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { scans } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

const STEPS = ['Spidering', 'Mapping', 'Testing', 'Validating', 'Reporting'];

const ACTIVITY_LOG = [
  { time: '09:00:00', text: "I'll begin a systematic penetration test on ", link: 'helpdesk.democorp.com', after: ". Let me start with reconnaissance and enumeration." },
  { time: '09:01:00', text: "Good! target is online. Now let me perform port scanning to identify running services.", link: null },
  { time: '09:02:00', text: "Excellent reconnaissance results:", sub: "- helpdesk.democorp.com: Apache httpd 2.4.65 on port 80 (web server)\nLet me probe the web server on target first to understand its structure.", link: null },
  { time: '09:03:00', text: 'Great! I found a login page for a Help Desk Platform. I can see a useful comment: "TODO: Delete the testing account (test:test)". Let me test this credential. The login redirects to ', link: '/password/test', after: ". Let me follow that path and explore it." },
  { time: '09:04:00', text: "The POST method is not allowed on /password/test. Let me check what the JavaScript does - it posts to ", link: '#', after: " which means the current page. Let me try a different approach." },
  { time: '09:05:00', text: "It redirects back to /password/test. Let me check if there's an /api endpoint or look for other paths. Let me also try exploring with the ", link: 'test:test', after: " password directly on other endpoints." },
  { time: '09:06:00', text: "Great! I can access the dashboard using the ", highlight: "'X-UserId: 10032'", after: " header. The dashboard shows \"Welcome, John Doe\". This suggests an **IDOR vulnerability** - I can access any user's dashboard by just changing the X-UserId header. Let me explore the application...", link: null },
];

const FINDINGS = [
  {
    severity: 'Critical',
    color: '#ef4444',
    bg: '#fef2f2',
    title: 'SQL Injection in Authentication Endpoint',
    path: '/api/users/profile',
    desc: 'Time-based blind SQL injection confirmed on user-controlled input during authentication flow. Exploitation allows database-level access.',
    time: '18:45:23',
  },
  {
    severity: 'High',
    color: '#f97316',
    bg: '#fff7ed',
    title: 'Unauthorized Access to User Metadata',
    path: '/api/auth/login',
    desc: 'Authenticated low-privilege user was able to access metadata of other users. Access control checks were missing.',
    time: '18:45:23',
  },
  {
    severity: 'Medium',
    color: '#eab308',
    bg: '#fefce8',
    title: 'Broken Authentication Rate Limiting',
    path: '/api/search',
    desc: 'No effective rate limiting detected on login attempts. Automated brute-force attacks are possible.',
    time: '18:45:23',
  },
];

export default function ScanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const scan = scans.find(s => s.id === Number(id)) || scans[0];
  const [activeTab, setActiveTab] = useState('activity');
  const [consoleOpen, setConsoleOpen] = useState(true);

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden" style={{ fontFamily: 'Outfit, sans-serif' }}>

      {/* Minimal sidebar */}
      <aside className="w-[200px] flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full">
        <div className="px-5 py-5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#0CC8A8] flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white" />
          </div>
          <span className="text-lg font-semibold text-[#1a1a1a] tracking-tight">aps</span>
        </div>
        <nav className="flex-1 px-3 flex flex-col gap-0.5 mt-1 text-sm">
          {[
            { label: 'Dashboard', path: '/dashboard', active: false },
            { label: 'Projects',  path: '#',          active: false },
            { label: 'Scans',     path: '#',          active: true  },
            { label: 'Schedule',  path: '#',          active: false },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => item.path !== '#' && navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium cursor-pointer border-none w-full text-left transition-colors
                ${item.active ? 'bg-[#e6faf7] text-[#0CC8A8]' : 'bg-transparent text-[#6b7280] hover:bg-gray-50'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div
          className="px-4 py-4 border-t border-gray-100 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => { logout(); navigate('/login'); }}
        >
          <div className="w-8 h-8 rounded-full bg-[#0CC8A8]/20 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2a3 3 0 1 1 0 6A3 3 0 0 1 8 2zm0 7c3.314 0 6 1.343 6 3v1H2v-1c0-1.657 2.686-3 6-3z" fill="#0CC8A8"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#1a1a1a] truncate">admin@edu.com</p>
            <p className="text-[11px] text-gray-400">Security Lead</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-7 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <span className="font-medium text-[#1a1a1a]">Scan</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            <button onClick={() => navigate('/dashboard')} className="hover:text-[#1a1a1a] transition-colors cursor-pointer bg-transparent border-none text-gray-400 text-sm p-0">Private Assets</button>
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

        <div className="flex-1 overflow-y-auto px-7 py-5 flex flex-col gap-4">

          {/* Scan Progress Card */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-8">
              {/* Circular progress */}
              <div className="flex-shrink-0 w-24 h-24 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="10"/>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#0CC8A8" strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - 0.0)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-[#1a1a1a] leading-none">0%</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">In Progress</span>
                </div>
              </div>

              {/* Steps */}
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
                      {i < STEPS.length - 1 && (
                        <div className={`h-px flex-1 mx-1 mb-6 ${i < 0 ? 'bg-[#0CC8A8]' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Scan meta */}
            <div className="flex items-center gap-0 mt-6 pt-5 border-t border-gray-100 text-sm flex-wrap gap-y-2">
              {[
                { label: 'Scan Type',   value: 'Grey Box' },
                { label: 'Targets',     value: 'google.com' },
                { label: 'Started At',  value: 'Nov 22, 09:00AM' },
                { label: 'Credentials', value: '2 Active' },
                { label: 'Files',       value: 'Control.pdf' },
                { label: 'Checklists',  value: '40/350', accent: true },
              ].map((item, i) => (
                <div key={item.label} className="flex items-center">
                  {i > 0 && <div className="w-px h-8 bg-gray-100 mx-6" />}
                  <div className="flex flex-col">
                    <span className="text-[11px] text-gray-400 mb-0.5">{item.label}</span>
                    <span className={`font-semibold text-sm ${item.accent ? 'text-[#0CC8A8]' : 'text-[#1a1a1a]'}`}>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Scan Console */}
          {consoleOpen && (
            <div className="bg-white rounded-xl border border-gray-100 flex flex-col">
              {/* Console header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-[#0CC8A8] animate-pulse" />
                  <span className="text-sm font-semibold text-[#1a1a1a]">Live Scan Console</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-gray-200 text-xs text-gray-400 ml-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#eab308]" />
                    Running...
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer bg-transparent border-none p-1">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                  <button
                    onClick={() => setConsoleOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer bg-transparent border-none p-1"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex" style={{ height: '340px' }}>
                {/* Activity panel */}
                <div className="flex-1 flex flex-col border-r border-gray-100 min-w-0">
                  {/* Tabs */}
                  <div className="flex border-b border-gray-100 px-4 pt-2">
                    {['Activity Log', 'Verification Loops'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab === 'Activity Log' ? 'activity' : 'verification')}
                        className={`px-4 py-2 text-xs font-semibold border-none cursor-pointer transition-colors bg-transparent
                          ${activeTab === (tab === 'Activity Log' ? 'activity' : 'verification')
                            ? 'border-b-2 border-[#0CC8A8] text-[#0CC8A8]'
                            : 'text-gray-400 hover:text-gray-600'}`}
                        style={{ borderBottom: activeTab === (tab === 'Activity Log' ? 'activity' : 'verification') ? '2px solid #0CC8A8' : '2px solid transparent', marginBottom: '-1px' }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  {/* Log output */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 text-xs text-[#1a1a1a] leading-relaxed space-y-2.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {ACTIVITY_LOG.map((entry, i) => (
                      <div key={i}>
                        <span className="text-gray-400">[{entry.time}] </span>
                        {entry.text}
                        {entry.link && (
                          <span className="bg-[#1a1a1a] text-white px-1.5 py-0.5 rounded text-[10px] mx-0.5">{entry.link}</span>
                        )}
                        {entry.highlight && (
                          <span className="bg-[#dbeafe] text-[#1d4ed8] px-1.5 py-0.5 rounded text-[10px] mx-0.5 font-semibold">{entry.highlight}</span>
                        )}
                        {entry.after && <span>{entry.after}</span>}
                        {entry.sub && (
                          <div className="mt-1 ml-4 text-gray-500 whitespace-pre-line">{entry.sub}</div>
                        )}
                      </div>
                    ))}
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
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: f.bg, color: f.color }}
                          >
                            {f.severity}
                          </span>
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

              {/* Console footer */}
              <div className="px-5 py-2 border-t border-gray-100 flex items-center gap-6 text-[11px] text-gray-400">
                <span>Sub-Agents: 0</span>
                <span>Parallel Executions: 2</span>
                <span>Operations: 1</span>
                <div className="ml-auto flex items-center gap-4">
                  <span className="text-[#ef4444]">Critical: 0</span>
                  <span className="text-[#f97316]">High: 0</span>
                  <span className="text-[#eab308]">Medium: 0</span>
                  <span className="text-[#22c55e]">Low: 0</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
