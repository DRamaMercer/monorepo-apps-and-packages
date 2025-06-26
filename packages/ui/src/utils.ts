import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility for merging Tailwind CSS classes with clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Brand theme configurations
 */
export const brandThemes = {
  'saithavys': {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-indigo-100 text-indigo-900 hover:bg-indigo-200',
    accent: 'text-indigo-600',
    background: 'bg-white',
    card: 'bg-white border border-indigo-200',
    header: 'bg-indigo-50 text-indigo-900',
    navItem: 'text-indigo-800 hover:bg-indigo-50',
    activeNavItem: 'bg-indigo-100 text-indigo-900',
  },
  'partly-office': {
    primary: 'bg-blue-700 text-white hover:bg-blue-800',
    secondary: 'bg-blue-100 text-blue-900 hover:bg-blue-200',
    accent: 'text-blue-700',
    background: 'bg-gray-50',
    card: 'bg-white border border-gray-200',
    header: 'bg-blue-50 text-blue-900',
    navItem: 'text-gray-700 hover:bg-blue-50',
    activeNavItem: 'bg-blue-100 text-blue-900',
  },
  'g-prismo': {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
    secondary: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200',
    accent: 'text-emerald-600',
    background: 'bg-gray-50',
    card: 'bg-white border border-emerald-200',
    header: 'bg-emerald-50 text-emerald-900',
    navItem: 'text-gray-700 hover:bg-emerald-50',
    activeNavItem: 'bg-emerald-100 text-emerald-900',
  },
  // Default theme used when no brand is selected
  'default': {
    primary: 'bg-gray-800 text-white hover:bg-gray-900',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    accent: 'text-gray-800',
    background: 'bg-white',
    card: 'bg-white border border-gray-200',
    header: 'bg-gray-50 text-gray-900',
    navItem: 'text-gray-700 hover:bg-gray-100',
    activeNavItem: 'bg-gray-200 text-gray-900',
  }
}

export type BrandThemeKey = keyof typeof brandThemes
export type ThemeTokens = keyof typeof brandThemes.default
