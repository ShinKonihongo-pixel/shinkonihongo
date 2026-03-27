// SearchInput — reusable search bar with icon, debounce, clear button
// Replaces 20+ inline search input patterns across the codebase
// Usage:
//   <SearchInput value={query} onChange={setQuery} placeholder="Tìm kiếm..." />

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import './search-input.css';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Debounce delay in ms (0 = no debounce) */
  debounce?: number;
  /** Additional CSS class */
  className?: string;
  /** Auto focus on mount */
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
  debounce = 0,
  className = '',
  autoFocus = false,
}: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync external value changes
  useEffect(() => { setLocal(value); }, [value]);

  const handleChange = (v: string) => {
    setLocal(v);
    if (debounce > 0) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onChange(v), debounce);
    } else {
      onChange(v);
    }
  };

  const handleClear = () => {
    setLocal('');
    onChange('');
  };

  return (
    <div className={`si-wrapper ${className}`}>
      <Search size={16} className="si-icon" />
      <input
        type="text"
        className="si-input"
        value={local}
        onChange={e => handleChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      {local && (
        <button className="si-clear" onClick={handleClear} aria-label="Xóa">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
