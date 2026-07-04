import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Users, MessageCircle, Sparkles, Shield } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import ThemeToggle from '@/components/ui/ThemeToggle';

const features = [
  { icon: Users, title: 'Connect', desc: 'Build your network with friends and communities' },
  { icon: MessageCircle, title: 'Chat', desc: 'Real-time messaging with rich media' },
  { icon: Sparkles, title: 'Discover', desc: 'Personalized feed and trending content' },
  { icon: Shield, title: 'Secure', desc: 'Enterprise-grade security and privacy' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/login"><Button variant="ghost">Sign In</Button></Link>
          <Link to="/register"><Button>Get Started</Button></Link>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Your world, <span className="gradient-text">connected</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mt-6 max-w-2xl mx-auto">
            The modern social platform combining the best of Instagram, Facebook, and X — with a premium experience built for you.
          </p>
          <div className="flex gap-4 justify-center mt-10">
            <Link to="/register"><Button size="lg">Create Account <ArrowRight className="w-5 h-5" /></Button></Link>
            <Link to="/login"><Button size="lg" variant="secondary">Sign In</Button></Link>
          </div>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map(({ icon: Icon, title, desc }, i) => (
          <motion.div key={title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-6 text-center hover:shadow-elevated transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4"><Icon className="w-6 h-6 text-primary" /></div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-gray-500 mt-2">{desc}</p>
          </motion.div>
        ))}
      </section>

      <footer className="text-center py-8 text-gray-500 text-sm">© 2026 Social Connect. All rights reserved.</footer>
    </div>
  );
}
