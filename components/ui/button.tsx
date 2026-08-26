import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';
    
    const variants = {
      primary: 'bg-saffron-500 hover:bg-saffron-600 text-white shadow-soft focus:ring-saffron-400',
      secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-300',
      outline: 'border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-700 focus:ring-slate-300',
      ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-200',
      danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400',
      success: 'bg-sihgreen-500 hover:bg-sihgreen-600 text-white shadow-soft focus:ring-sihgreen-400',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
      md: 'h-10 px-4 text-sm rounded-xl gap-2',
      lg: 'h-12 px-6 text-base rounded-xl gap-2.5',
      icon: 'h-9 w-9 p-0 rounded-lg justify-center items-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
