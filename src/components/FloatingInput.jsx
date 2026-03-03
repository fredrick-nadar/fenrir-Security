import { useState } from 'react';

export default function FloatingInput({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  minLength,
  endAdornment,
  error,
}) {
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;

  return (
    <div className="flex flex-col gap-1">
      <div
        className={`relative border rounded-[10px] transition-colors ${
          error
            ? 'border-red-400'
            : focused
            ? 'border-[#0e9e9e]'
            : 'border-[#dddddd] hover:border-[#0e9e9e]'
        }`}
      >
        <label
          htmlFor={id}
          style={{
            position: 'absolute',
            left: '12px',
            fontFamily: 'Outfit, sans-serif',
            pointerEvents: 'none',
            transition: 'top 0.15s, font-size 0.15s, color 0.15s, transform 0.15s',
            top: floated ? '5px' : '50%',
            transform: floated ? 'none' : 'translateY(-50%)',
            fontSize: floated ? '11px' : '14px',
            color: error ? '#ef4444' : floated && focused ? '#0e9e9e' : '#9e9e9e',
            lineHeight: 1,
          }}
        >
          {label}
        </label>
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          minLength={minLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete="off"
          style={{ fontFamily: 'Outfit, sans-serif' }}
          className="w-full pt-[22px] pb-[6px] text-[15px] text-[#342d2d] bg-transparent outline-none rounded-[10px] pr-10 pl-3"
        />
        {endAdornment && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
            {endAdornment}
          </div>
        )}
      </div>
      {error && (
        <span className="text-xs text-red-400 pl-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {error}
        </span>
      )}
    </div>
  );
}
