import React, { useState } from 'react'
import { cn } from '../utils'
import { BrandThemeKey, brandThemes } from '../utils'

export interface BrandSwitcherProps extends React.HTMLAttributes<HTMLDivElement> {
  currentBrand?: BrandThemeKey
  onBrandChange?: (brand: BrandThemeKey) => void
}

export const BrandSwitcher: React.FC<BrandSwitcherProps> = ({
  className,
  currentBrand = 'default',
  onBrandChange,
  ...props
}) => {
  const brands: BrandThemeKey[] = ['saithavys', 'partly-office', 'g-prismo', 'default']
  const brandLabels = {
    'saithavys': 'SaithavyS',
    'partly-office': 'Partly Office',
    'g-prismo': 'G Prismo',
    'default': 'Default'
  }

  const handleBrandChange = (brand: BrandThemeKey) => {
    if (onBrandChange) {
      onBrandChange(brand)
    }
  }

  return (
    <div className={cn('flex flex-col space-y-2', className)} {...props}>
      <div className="text-sm font-medium mb-2">Select Brand</div>
      <div className="flex flex-col space-y-1">
        {brands.map((brand) => (
          <button
            key={brand}
            className={cn(
              'px-3 py-2 rounded-md text-sm transition-colors',
              currentBrand === brand 
                ? `${brandThemes[brand].activeNavItem} font-medium` 
                : `${brandThemes[brand].navItem}`
            )}
            onClick={() => handleBrandChange(brand)}
            aria-current={currentBrand === brand ? 'page' : undefined}
          >
            {brandLabels[brand]}
          </button>
        ))}
      </div>
    </div>
  )
}

export interface BrandContextProviderProps {
  children: React.ReactNode
  initialBrand?: BrandThemeKey
}

export const BrandContext = React.createContext<{
  currentBrand: BrandThemeKey
  setCurrentBrand: (brand: BrandThemeKey) => void
}>({
  currentBrand: 'default',
  setCurrentBrand: () => {},
})

export const BrandContextProvider: React.FC<BrandContextProviderProps> = ({
  children,
  initialBrand = 'default',
}) => {
  const [currentBrand, setCurrentBrand] = useState<BrandThemeKey>(initialBrand)

  return (
    <BrandContext.Provider value={{ currentBrand, setCurrentBrand }}>
      {children}
    </BrandContext.Provider>
  )
}

export const useBrandContext = () => React.useContext(BrandContext)
