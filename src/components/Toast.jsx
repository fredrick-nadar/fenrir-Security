import { useEffect, useState, useRef } from 'react';

export default function Toast({ message, type = 'success', duration = 3000, onClose }) {
  const [visible, setVisible] = useState(true);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onCloseRef.current?.(), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const bg = type === 'success' ? 'bg-[#0e9e9e]' : 'bg-red-500';

  return (
    <div
      className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl text-white text-sm font-medium shadow-lg transition-all duration-300 ${bg} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {type === 'success' ? (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M3.5 9l3.8 3.8L14.5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 5v5M9 13h.01" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      {message}
    </div>
  );
}
