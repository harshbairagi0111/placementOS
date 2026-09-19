import React, { useState, useEffect, useRef, useId } from 'react';
import { Building2, Check, ChevronDown, Search, X } from 'lucide-react';
import { COLLEGE_LIST } from '../constants/collegeList';

export interface CollegeAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  label?: string;
  id?: string;
  name?: string;
  className?: string;
  inputClassName?: string;
  variant?: 'blue' | 'indigo' | 'default';
  helperText?: string;
}

export const CollegeAutocomplete: React.FC<CollegeAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'e.g. Sanjivani College of Engineering, Kopargaon',
  required = false,
  disabled = false,
  error = null,
  label = 'College / University Name',
  id,
  name = 'collegeName',
  className = '',
  inputClassName = '',
  variant = 'blue',
  helperText,
}) => {
  const generatedId = useId();
  const inputId = id || `college-autocomplete-${generatedId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  // Filter suggestions based on current input
  const suggestions = React.useMemo(() => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      // Return top 8 prominent colleges when empty and focused
      return COLLEGE_LIST.slice(0, 8);
    }
    return COLLEGE_LIST.filter((college) =>
      college.toLowerCase().includes(trimmed)
    ).slice(0, 8);
  }, [value]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelectSuggestion = (college: string) => {
    onChange(college);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(true);
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Enter' && isOpen && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const focusBorderColor =
    variant === 'indigo'
      ? 'focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
      : 'focus:border-blue-600 focus:ring-2 focus:ring-blue-100';

  const iconColor = variant === 'indigo' ? 'text-indigo-600' : 'text-blue-600';
  const labelColor = variant === 'indigo' ? 'text-indigo-950' : 'text-slate-700';

  return (
    <div ref={containerRef} className={`relative ${className}`} id={`container-${inputId}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-xs font-semibold ${labelColor} mb-1.5 flex items-center justify-between`}
        >
          <span className="flex items-center gap-1.5">
            <Building2 className={`w-3.5 h-3.5 ${iconColor}`} />
            {label}
            {required && <span className="text-red-500">*</span>}
          </span>
          <span className="text-[10px] text-slate-400 font-normal">Search or type custom</span>
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          autoComplete="off"
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={`w-full bg-slate-50 border ${
            error ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
          } rounded-xl pl-9 pr-16 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all ${focusBorderColor} ${
            disabled ? 'opacity-60 cursor-not-allowed' : ''
          } ${inputClassName}`}
        />

        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            tabIndex={-1}
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-red-600 font-medium mt-1 animate-in fade-in duration-150">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="text-[11px] text-slate-500 mt-1">
          {helperText}
        </p>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && !disabled && (
        <div
          id={`dropdown-${inputId}`}
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto py-1.5 text-left animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
            <span>Suggested Colleges ({suggestions.length})</span>
            <span className="font-normal text-slate-400">Custom names supported</span>
          </div>

          {suggestions.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {suggestions.map((college, index) => {
                const isSelected = value.trim().toLowerCase() === college.toLowerCase();
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={college}
                    type="button"
                    onMouseDown={(e) => {
                      // Using onMouseDown prevents input onBlur from firing before click
                      e.preventDefault();
                      handleSelectSuggestion(college);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full px-3.5 py-2.5 text-xs text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isHighlighted
                        ? 'bg-blue-50/80 text-blue-900'
                        : isSelected
                        ? 'bg-slate-50 text-slate-900 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          college.includes('Sanjivani')
                            ? 'text-amber-600'
                            : isHighlighted
                            ? 'text-blue-600'
                            : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{college}</span>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-3.5 py-3 text-xs text-slate-500 text-center">
              <p className="font-medium text-slate-700">No matching standard name found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Press enter or continue typing — "{value}" will be saved as your custom college.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
