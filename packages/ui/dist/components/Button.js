import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../utils';
const buttonVariants = cva('inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none', {
    variants: {
        variant: {
            default: 'bg-gray-800 text-white hover:bg-gray-900',
            primary: 'bg-blue-600 text-white hover:bg-blue-700',
            secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
            outline: 'border border-gray-300 bg-transparent hover:bg-gray-100',
            ghost: 'bg-transparent hover:bg-gray-100',
            destructive: 'bg-red-600 text-white hover:bg-red-700',
            brand: '', // This will be dynamically set based on the current brand
        },
        size: {
            default: 'h-10 py-2 px-4',
            sm: 'h-8 px-3 text-xs',
            lg: 'h-12 px-6',
            icon: 'h-10 w-10',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
});
export const Button = React.forwardRef(({ className, variant, size, brandTheme, asChild = false, ...props }, ref) => {
    // If variant is 'brand' and brandTheme is provided, use the brandTheme
    const variantClass = variant === 'brand' && brandTheme
        ? brandTheme
        : buttonVariants({ variant, size, className });
    return (_jsx("button", { className: cn(variantClass), ref: ref, ...props }));
});
Button.displayName = 'Button';
//# sourceMappingURL=Button.js.map