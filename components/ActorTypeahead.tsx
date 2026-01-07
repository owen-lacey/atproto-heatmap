'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { useActorSearch } from '@/lib/hooks/useActorSearch';
import { ActorResult } from '@/app/actions/searchActors';

interface ActorTypeaheadProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (actor: ActorResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ActorTypeahead({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
  disabled,
}: ActorTypeaheadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { actors } = useActorSearch(value);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show dropdown when we have results
  useEffect(() => {
    if (actors.length > 0) {
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setIsOpen(false);
    }
  }, [actors]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || actors.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < actors.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < actors.length) {
          e.preventDefault();
          handleSelect(actors[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (actor: ActorResult) => {
    onSelect(actor);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className={className}
        disabled={disabled}
        autoComplete="off"
      />

      {/* Dropdown */}
      {isOpen && actors.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg overflow-hidden">
          {actors.map((actor, index) => (
            <button
              key={actor.did}
              type="button"
              onClick={() => handleSelect(actor)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
              }`}
            >
              {/* Avatar */}
              {actor.avatar ? (
                <img
                  src={actor.avatar}
                  alt={actor.displayName || actor.handle}
                  className="w-10 h-10 rounded-full bg-muted flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-muted-foreground text-sm font-medium">
                    {(actor.displayName || actor.handle).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Name and Handle */}
              <div className="flex-1 min-w-0">
                {actor.displayName && (
                  <div className="font-medium text-sm truncate">
                    {actor.displayName}
                  </div>
                )}
                <div className="text-sm text-muted-foreground truncate">
                  @{actor.handle}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
