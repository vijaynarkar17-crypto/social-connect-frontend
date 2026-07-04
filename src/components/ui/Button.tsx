import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 active:scale-[0.98]',
        {
          'bg-primary bg-gradient-primary text-white shadow-md hover:shadow-lg hover:shadow-primary/25 hover:brightness-105': variant === 'primary',
          'bg-white dark:bg-surface-card-dark border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50': variant === 'secondary',
          'text-gray-600 hover:bg-gray-100/80 dark:hover:bg-gray-800': variant === 'ghost',
          'bg-red-500 text-white hover:opacity-90': variant === 'danger',
          'px-3 py-1.5 text-sm gap-1.5': size === 'sm',
          'px-4 py-2.5 text-sm gap-2': size === 'md',
          'px-6 py-3 text-base gap-2': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
export default Button;
