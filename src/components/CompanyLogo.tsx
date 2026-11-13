import React, { useState, useEffect } from 'react';

interface CompanyLogoProps {
  src?: string | null;
  company: string;
  className?: string;
}

const KNOWN_COMPANY_LOGOS: Record<string, string> = {
  linear: '/logos/linear.svg',
  figma: '/logos/figma.svg',
  'watershed climate': '/logos/watershed.svg',
  watershed: '/logos/watershed.svg',
  supabase: '/logos/supabase.svg',
  duolingo: '/logos/duolingo.svg',
  canva: '/logos/canva.svg',
  postman: '/logos/postman.svg',
};

const PALETTES = [
  'from-[#7C6CF0] to-[#5846CA]',
  'from-[#FF8A65] to-[#F43F5E]',
  'from-[#10B981] to-[#059669]',
  'from-[#0EA5E9] to-[#6366F1]',
  'from-[#8B5CF6] to-[#EC4899]',
  'from-[#F59E0B] to-[#EA580C]',
];

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'W';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getPaletteClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTES[hash % PALETTES.length];
}

export function resolveCompanyLogoSrc(src?: string | null, company?: string): string {
  const trimmed = (src || '').trim();
  const normalizedCompany = (company || '').trim().toLowerCase();

  // Replace empty, broken Unsplash IDs, or legacy seeded placeholder photos with local crisp brand emblems
  if (
    !trimmed ||
    trimmed.includes('photo-1534972195531-a756b1126f24') ||
    trimmed.includes('images.unsplash.com')
  ) {
    if (KNOWN_COMPANY_LOGOS[normalizedCompany]) {
      return KNOWN_COMPANY_LOGOS[normalizedCompany];
    }
    if (!trimmed) {
      return '/logos/workvanta-default.svg';
    }
  }

  return trimmed;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  src,
  company,
  className = 'w-full h-full object-cover rounded-xl',
}) => {
  const resolvedSrc = resolveCompanyLogoSrc(src, company);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [resolvedSrc]);

  if (hasError || !resolvedSrc) {
    const initials = getInitials(company || 'Workvanta');
    const gradient = getPaletteClass(company || 'Workvanta');
    return (
      <div
        role="img"
        aria-label={`${company} logo`}
        className={`w-full h-full bg-gradient-to-br ${gradient} text-white font-extrabold flex items-center justify-center select-none text-xs sm:text-sm tracking-tight rounded-xl`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={`${company} logo`}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
};
