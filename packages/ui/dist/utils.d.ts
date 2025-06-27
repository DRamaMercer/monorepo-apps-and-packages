import { type ClassValue } from 'clsx';
/**
 * Utility for merging Tailwind CSS classes with clsx and tailwind-merge
 */
export declare function cn(...inputs: ClassValue[]): string;
/**
 * Brand theme configurations
 */
export declare const brandThemes: {
    saithavys: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        card: string;
        header: string;
        navItem: string;
        activeNavItem: string;
    };
    'partly-office': {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        card: string;
        header: string;
        navItem: string;
        activeNavItem: string;
    };
    'g-prismo': {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        card: string;
        header: string;
        navItem: string;
        activeNavItem: string;
    };
    default: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        card: string;
        header: string;
        navItem: string;
        activeNavItem: string;
    };
};
export type BrandThemeKey = keyof typeof brandThemes;
export type ThemeTokens = keyof typeof brandThemes.default;
//# sourceMappingURL=utils.d.ts.map