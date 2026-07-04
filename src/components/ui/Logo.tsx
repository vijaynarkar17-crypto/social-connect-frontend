import clsx from 'clsx';

export default function Logo({ size = 'md', showText = true, className }: { size?: 'sm' | 'md' | 'lg'; showText?: boolean; className?: string }) {
  const sizes = { sm: { icon: 'w-8 h-8 text-sm', text: 'text-base' }, md: { icon: 'w-10 h-10 text-base', text: 'text-xl' }, lg: { icon: 'w-14 h-14 text-xl', text: 'text-2xl' } };
  const s = sizes[size];
  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      <div className={clsx(s.icon, 'rounded-xl bg-primary bg-gradient-primary flex items-center justify-center shadow-md shadow-primary/30')}>
        <span className="text-white font-bold">SC</span>
      </div>
      {showText && <span className={clsx(s.text, 'font-bold gradient-text tracking-tight')}>Social Connect</span>}
    </div>
  );
}
