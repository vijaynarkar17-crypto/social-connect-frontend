import clsx from 'clsx';
import { type HTMLAttributes } from 'react';

export default function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('glass-card p-5', className)} {...props}>
      {children}
    </div>
  );
}
