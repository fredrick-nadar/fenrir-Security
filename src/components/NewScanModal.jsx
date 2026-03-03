import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function NewScanModal({ isOpen, onClose, onSubmit }) {
  const [scanName, setScanName]       = useState('');
  const [scanType, setScanType]       = useState('Greybox');
  const [targetUrl, setTargetUrl]     = useState('');
  const [useCreds, setUseCreds]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState({});
  const [visible, setVisible]         = useState(false);

  // Animate in
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      // reset after close animation
      const t = setTimeout(() => {
        setScanName(''); setScanType('Greybox'); setTargetUrl('');
        setUseCreds(false); setErrors({});
      }, 250);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!scanName.trim())   e.scanName  = 'Scan name is required';
    if (!targetUrl.trim())  e.targetUrl = 'Target URL is required';
    else if (!/^https?:\/\/.+/.test(targetUrl.trim())) e.targetUrl = 'Must start with http:// or https://';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setTimeout(() => {
      onSubmit({
        name:            scanName.trim(),
        type:            scanType,
        status:          'Scheduled',
        progress:        0,
        vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
        lastScan:        'Just now',
      });
      setLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: visible ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0)',
        backdropFilter: 'blur(2px)',
        transition: 'background-color 250ms ease',
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
          transition: 'opacity 250ms ease, transform 250ms ease',
          fontFamily: 'Outfit, sans-serif',
        }}
        className="bg-white dark:bg-[#161b27] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#212637]">
          <div>
            <h2 className="text-base font-semibold text-[#1a1a1a] dark:text-[#e8ecf5]">Start New Scan</h2>
            <p className="text-xs text-gray-400 dark:text-[#8891a8] mt-0.5">Configure and launch a security scan</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 dark:text-[#6b7280] hover:bg-gray-100 dark:hover:bg-[#212637] hover:text-gray-600 dark:hover:text-[#8891a8] transition-colors cursor-pointer border-none bg-transparent"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">

          {/* Scan Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-[#8891a8] uppercase tracking-wide">
              Scan Name <span className="text-[#ef4444]">*</span>
            </label>
            <input
              type="text"
              value={scanName}
              onChange={e => { setScanName(e.target.value); setErrors(p => ({ ...p, scanName: '' })); }}
              placeholder="Enter scan name"
              className={`px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors bg-[#f8fafc] dark:bg-[#0d1117] dark:text-[#e8ecf5] dark:placeholder-[#4b5568]
                ${errors.scanName ? 'border-[#ef4444] focus:border-[#ef4444]' : 'border-gray-200 dark:border-[#212637] focus:border-[#0CC8A8]'}`}
              style={{ fontFamily: 'Outfit, sans-serif' }}
            />
            {errors.scanName && <p className="text-xs text-[#ef4444]">{errors.scanName}</p>}
          </div>

          {/* Scan Type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-[#8891a8] uppercase tracking-wide">
              Scan Type <span className="text-[#ef4444]">*</span>
            </label>
            <select
              value={scanType}
              onChange={e => setScanType(e.target.value)}
              className="px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-[#212637] text-sm outline-none focus:border-[#0CC8A8] transition-colors bg-[#f8fafc] dark:bg-[#0d1117] dark:text-[#e8ecf5] cursor-pointer"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              <option value="Greybox">Greybox</option>
              <option value="Blackbox">Blackbox</option>
              <option value="Whitebox">Whitebox</option>
            </select>
          </div>

          {/* Target URL */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-[#8891a8] uppercase tracking-wide">
              Target URL <span className="text-[#ef4444]">*</span>
            </label>
            <input
              type="text"
              value={targetUrl}
              onChange={e => { setTargetUrl(e.target.value); setErrors(p => ({ ...p, targetUrl: '' })); }}
              placeholder="https://example.com"
              className={`px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors bg-[#f8fafc] dark:bg-[#0d1117] dark:text-[#e8ecf5] dark:placeholder-[#4b5568]
                ${errors.targetUrl ? 'border-[#ef4444] focus:border-[#ef4444]' : 'border-gray-200 dark:border-[#212637] focus:border-[#0CC8A8]'}`}
              style={{ fontFamily: 'Outfit, sans-serif' }}
            />
            {errors.targetUrl && <p className="text-xs text-[#ef4444]">{errors.targetUrl}</p>}
          </div>

          {/* Credentials toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none group">
            <div
              onClick={() => setUseCreds(v => !v)}
              className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${useCreds ? 'bg-[#0CC8A8]' : 'bg-gray-200 dark:bg-[#2d3448]'}`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${useCreds ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </div>
            <span className="text-sm text-gray-600 dark:text-[#8891a8] group-hover:text-[#1a1a1a] dark:group-hover:text-[#e8ecf5] transition-colors">Use stored credentials</span>
            <span className="text-xs text-gray-400 dark:text-[#6b7280]">(optional)</span>
          </label>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1 border-t border-gray-100 dark:border-[#212637] mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-[#2d3448] text-sm font-medium text-gray-600 dark:text-[#8891a8] hover:bg-gray-50 dark:hover:bg-[#1c2234] hover:border-gray-300 transition-colors cursor-pointer bg-white dark:bg-transparent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !scanName.trim() || !targetUrl.trim()}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all flex items-center justify-center gap-2
                ${loading || !scanName.trim() || !targetUrl.trim()
                  ? 'bg-[#0CC8A8]/50 cursor-not-allowed'
                  : 'bg-[#0CC8A8] hover:bg-[#0ab597] cursor-pointer'}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round"/>
                  </svg>
                  Starting...
                </>
              ) : 'Start Scan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
