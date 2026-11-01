import React from 'react';
import { Search, X, MapPin } from 'lucide-react';

interface SearchAndFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onReset: () => void;
}

const CATEGORIES = [
  'All',
  'Software Engineering',
  'Product Design',
  'Product Management',
  'Data & AI',
  'Developer Relations'
];

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onReset
}) => {
  const isFiltered = searchQuery.trim() !== '' || selectedCategory !== 'All';

  return (
    <div className="space-y-4 mb-8">
      {/* Primary Pill Search Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-4 pointer-events-none text-[#7C6CF0] dark:text-[#A99CFF]">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search remote roles across India, skills, companies (e.g. React, Bengaluru, Python, Figma, Delhi)..."
          className="w-full pl-12 pr-12 py-3.5 rounded-full bg-white dark:bg-[#26223A] border border-[#7C6CF0]/20 dark:border-[#3D3759] focus:outline-none focus:ring-2 focus:ring-[#7C6CF0] text-sm text-[#2D2A3E] dark:text-[#F2EEFF] placeholder-[#6B6880]/70 dark:placeholder-[#A5A0BA]/70 shadow-xs transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 p-1 text-[#6B6880] hover:text-[#2D2A3E] dark:hover:text-[#F2EEFF]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Category tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-white/70 dark:bg-[#26223A]/70 border border-[#7C6CF0]/10 dark:border-[#3D3759]">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#7C6CF0] text-white shadow-xs'
                    : 'text-[#6B6880] dark:text-[#A5A0BA] hover:text-[#2D2A3E] dark:hover:text-[#F2EEFF] hover:bg-[#7C6CF0]/10 dark:hover:bg-[#3D3759]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* 100% Remote Tag & Reset */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-full bg-[#34D399]/15 text-[#006949] dark:text-[#5EE3B0] text-xs font-bold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>100% Remote in India</span>
          </div>

          {isFiltered && (
            <button
              onClick={onReset}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#FF8A65] hover:bg-[#FF8A65]/10 transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
