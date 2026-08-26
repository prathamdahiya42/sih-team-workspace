import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'saffron' | 'green' | 'navy' | 'outline' | 'danger';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    saffron: 'bg-saffron-50 text-saffron-700 border-saffron-200 font-semibold',
    green: 'bg-sihgreen-50 text-sihgreen-700 border-sihgreen-200 font-semibold',
    navy: 'bg-navy-50 text-navy-800 border-navy-200 font-semibold',
    outline: 'border-slate-300 text-slate-600 bg-transparent',
    danger: 'bg-red-50 text-red-700 border-red-200 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border font-medium select-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
