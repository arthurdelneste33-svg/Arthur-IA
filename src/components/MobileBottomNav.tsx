import React from 'react';
import { 
  MessageSquare, 
  Film,
  Music, 
  Image as ImageIcon, 
  FileText, 
  Settings 
} from 'lucide-react';
import { motion } from 'motion/react';
import { TabType, AccentColorType } from '../types';

interface MobileBottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  accentColor: AccentColorType;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  accentColor,
}) => {
  const navItems: Array<{ id: TabType; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'video', label: 'Vidéo', icon: Film },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'settings', label: 'Système', icon: Settings },
  ];

  const getAccentText = () => {
    switch (accentColor) {
      case 'emerald': return 'text-emerald-400';
      case 'amber': return 'text-amber-400';
      case 'cyan': return 'text-cyan-400';
      default: return 'text-violet-400';
    }
  };

  const getAccentBg = () => {
    switch (accentColor) {
      case 'emerald': return 'bg-emerald-500/15 text-emerald-400';
      case 'amber': return 'bg-amber-500/15 text-amber-400';
      case 'cyan': return 'bg-cyan-500/15 text-cyan-400';
      default: return 'bg-violet-500/15 text-violet-400';
    }
  };

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Navigation mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d131f]/95 backdrop-blur-2xl border-t border-slate-800/90 px-1.5 py-1 flex items-center justify-around select-none safe-area-pb shadow-2xl"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className="flex flex-col items-center justify-center py-1 px-2 flex-1 min-w-[50px] min-h-[48px] rounded-xl transition-all relative active:scale-95 touch-manipulation"
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                isActive ? getAccentBg() : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span
              className={`text-[10px] font-medium mt-0.5 tracking-tight ${
                isActive ? getAccentText() : 'text-slate-400'
              }`}
            >
              {item.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="bottomNavDot"
                className="w-1.5 h-1.5 rounded-full bg-violet-400 absolute bottom-0.5 shadow-xs shadow-violet-400/80"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
