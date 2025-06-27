import React from 'react';
import { BrandThemeKey } from '../utils';
export interface BrandSwitcherProps extends React.HTMLAttributes<HTMLDivElement> {
    currentBrand?: BrandThemeKey;
    onBrandChange?: (brand: BrandThemeKey) => void;
}
export declare const BrandSwitcher: React.FC<BrandSwitcherProps>;
export interface BrandContextProviderProps {
    children: React.ReactNode;
    initialBrand?: BrandThemeKey;
}
export declare const BrandContext: React.Context<{
    currentBrand: BrandThemeKey;
    setCurrentBrand: (brand: BrandThemeKey) => void;
}>;
export declare const BrandContextProvider: React.FC<BrandContextProviderProps>;
export declare const useBrandContext: () => {
    currentBrand: BrandThemeKey;
    setCurrentBrand: (brand: BrandThemeKey) => void;
};
//# sourceMappingURL=BrandSwitcher.d.ts.map