import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Logo from './Logo';
import { Sparkles, Users, MessageCircle, Shield } from 'lucide-react';

const features = [
  { icon: Users, text: 'Connect with friends & communities' },
  { icon: MessageCircle, text: 'Real-time messaging' },
  { icon: Sparkles, text: 'Personalized feed' },
  { icon: Shield, text: 'Secure authentication' },
];

export default function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[45%] auth-mesh relative overflow-hidden p-12 flex-col justify-between">
        <Logo size="md" className="[&_span]:!text-white [&_span]:!bg-none" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">Your world,<br />connected beautifully.</h2>
            <p className="text-white/70 mt-4 text-lg max-w-md">Share moments, join circles, and stay close to the people who matter.</p>
          </div>
          <ul className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/90">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center"><Icon className="w-4 h-4" /></div>
                <span className="text-sm font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </motion.div>
        <p className="text-white/50 text-sm">© 2026 Social Connect</p>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center"><Logo size="lg" /></div>
          <div className="text-center mb-8 lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{subtitle}</p>
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
