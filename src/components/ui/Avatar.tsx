import clsx from 'clsx';

const sizes = { xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base', xl: 'w-20 h-20 text-xl' };

export default function Avatar({ src, alt = '', size = 'md', className }: { src?: string | null; alt?: string; size?: keyof typeof sizes; className?: string }) {
  const initials = alt ? alt.charAt(0).toUpperCase() : '?';
  if (src) {
    return <img src={src} alt={alt} className={clsx('rounded-full object-cover flex-shrink-0', sizes[size], className)} />;
  }
  return (
    <div className={clsx('rounded-full bg-primary bg-gradient-primary flex items-center justify-center text-white font-semibold flex-shrink-0', sizes[size], className)}>
      {initials}
    </div>
  );
}
