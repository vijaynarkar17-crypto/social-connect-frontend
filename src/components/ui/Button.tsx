import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

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
        'inline-flex items-center justify-center font-semibold tracking-tight rounded-full transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-light dark:focus-visible:ring-offset-black disabled:opacity-50 disabled:pointer-events-none',
        {
          // Yellow fill + black ink + hard shadow (neo-brutalist spot)
          'bg-primary text-black border-2 border-black shadow-btn-yellow hover:brightness-105 hover:shadow-[1px_1px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none active:translate-x-1 active:translate-y-1':
            variant === 'primary',
          // Black fill + yellow border/text
          'bg-black text-primary border-2 border-primary shadow-btn-black hover:bg-neutral-900 hover:brightness-110 active:scale-[0.98]':
            variant === 'secondary',
          // Minimal yellow accent
          'text-black dark:text-primary border-2 border-transparent hover:border-primary/40 hover:bg-primary/15 dark:hover:bg-primary/10':
            variant === 'ghost',
          // Danger stays clear but fits the hard-edge language
          'bg-red-600 text-white border-2 border-black shadow-btn-yellow hover:bg-red-500 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none':
            variant === 'danger',
          'px-3.5 py-1.5 text-sm gap-1.5': size === 'sm',
          'px-5 py-2.5 text-sm gap-2': size === 'md',
          'px-7 py-3.5 text-base gap-2.5': size === 'lg',
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
