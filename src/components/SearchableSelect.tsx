import React, { useState, useRef, useEffect } from 'react';

interface Option {
  id: string;
  name: string;
  isSystem?: boolean;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  onEdit?: (id: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function SearchableSelect({ options, value, onChange, onEdit, placeholder = "Select...", required }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(o => String(o.name || '').toLowerCase().includes(String(search || '').toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      if (inputRef.current) inputRef.current.focus();
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (value && onEdit) onEdit(value);
        return;
      }
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && onEdit) {
        if (filteredOptions[highlightedIndex]) {
           onEdit(filteredOptions[highlightedIndex].id);
        }
      } else {
        if (filteredOptions[highlightedIndex]) {
          onChange(filteredOptions[highlightedIndex].id);
          setIsOpen(false);
        }
      }
    }
  };

  const selectedOption = options.find(o => o.id === value);

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className={`mt-1 flex items-center justify-between w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus-within:ring-1 focus-within:ring-blue-900 focus-within:border-blue-900 sm:text-sm cursor-text ${!selectedOption && required ? 'border-red-300' : ''}`}
        onClick={() => { setIsOpen(true); inputRef.current?.focus(); }}
      >
        {!isOpen ? (
           <div className="truncate flex-1 outline-none" tabIndex={0} onKeyDown={handleKeyDown}>{selectedOption ? selectedOption.name : <span className="text-gray-400">{placeholder}</span>}</div>
        ) : (
           <input 
             ref={inputRef}
             type="text"
             className="w-full outline-none border-none p-0 text-sm"
             value={search}
             onChange={e => setSearch(e.target.value)}
             onKeyDown={handleKeyDown}
             placeholder="Search..."
           />
        )}
        <div className="shrink-0 ml-2">
           <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto sm:text-sm">
          {filteredOptions.length === 0 ? (
            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">No options found</div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={option.id}
                className={`relative cursor-pointer select-none py-2 pl-3 pr-9 ${highlightedIndex === index ? 'bg-blue-600 text-white' : 'text-gray-900'}`}
                onClick={() => { onChange(option.id); setIsOpen(false); }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className={`block truncate ${value === option.id ? 'font-semibold' : 'font-normal'}`}>{option.name}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
