import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { cn } from '../utils';
export const Card = React.forwardRef(({ className, brandTheme, ...props }, ref) => {
    return (_jsx("div", { ref: ref, className: cn('rounded-lg border border-gray-200 bg-white p-4 shadow-sm', brandTheme, className), ...props }));
});
Card.displayName = 'Card';
export const CardHeader = React.forwardRef(({ className, brandTheme, ...props }, ref) => {
    return (_jsx("div", { ref: ref, className: cn('flex flex-col space-y-1.5 p-4', brandTheme, className), ...props }));
});
CardHeader.displayName = 'CardHeader';
export const CardTitle = React.forwardRef(({ className, ...props }, ref) => {
    return (_jsx("h3", { ref: ref, className: cn('font-semibold leading-none tracking-tight', className), ...props }));
});
CardTitle.displayName = 'CardTitle';
export const CardDescription = React.forwardRef(({ className, ...props }, ref) => {
    return (_jsx("p", { ref: ref, className: cn('text-sm text-gray-500', className), ...props }));
});
CardDescription.displayName = 'CardDescription';
export const CardContent = React.forwardRef(({ className, ...props }, ref) => {
    return (_jsx("div", { ref: ref, className: cn('p-4 pt-0', className), ...props }));
});
CardContent.displayName = 'CardContent';
export const CardFooter = React.forwardRef(({ className, ...props }, ref) => {
    return (_jsx("div", { ref: ref, className: cn('flex items-center p-4 pt-0', className), ...props }));
});
CardFooter.displayName = 'CardFooter';
//# sourceMappingURL=Card.js.map