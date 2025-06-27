import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { cn } from '../utils';
import { brandThemes } from '../utils';
export const BrandSwitcher = ({ className, currentBrand = 'default', onBrandChange, ...props }) => {
    const brands = ['saithavys', 'partly-office', 'g-prismo', 'default'];
    const brandLabels = {
        'saithavys': 'SaithavyS',
        'partly-office': 'Partly Office',
        'g-prismo': 'G Prismo',
        'default': 'Default'
    };
    const handleBrandChange = (brand) => {
        if (onBrandChange) {
            onBrandChange(brand);
        }
    };
    return (_jsxs("div", { className: cn('flex flex-col space-y-2', className), ...props, children: [_jsx("div", { className: "text-sm font-medium mb-2", children: "Select Brand" }), _jsx("div", { className: "flex flex-col space-y-1", children: brands.map((brand) => (_jsx("button", { className: cn('px-3 py-2 rounded-md text-sm transition-colors', currentBrand === brand
                        ? `${brandThemes[brand].activeNavItem} font-medium`
                        : `${brandThemes[brand].navItem}`), onClick: () => handleBrandChange(brand), "aria-current": currentBrand === brand ? 'page' : undefined, children: brandLabels[brand] }, brand))) })] }));
};
export const BrandContext = React.createContext({
    currentBrand: 'default',
    setCurrentBrand: () => { },
});
export const BrandContextProvider = ({ children, initialBrand = 'default', }) => {
    const [currentBrand, setCurrentBrand] = useState(initialBrand);
    return (_jsx(BrandContext.Provider, { value: { currentBrand, setCurrentBrand }, children: children }));
};
export const useBrandContext = () => React.useContext(BrandContext);
//# sourceMappingURL=BrandSwitcher.js.map