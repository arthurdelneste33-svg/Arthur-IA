import React from 'react';
import { 
  MessageSquare, 
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
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'documents', label: 'Docs', icon: FileText },
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d131f]/95 backdrop-blur-xl border-t border-slate-800/90 px-2 py-1.5 flex items-center justify-around select-none safe-area-pb"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className="flex flex-col items-center justify-center py-1 px-3 min-w-[56px] min-h-[48px] rounded-xl transition-all relative"
          >
            <div
              className={`p-1.5 rounded-xl transition-colors ${
                isActive ? getAccentBg() : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span
              className={`text-[10px] font-medium mt-0.5 tracking-tight ${
                isActive ? getAccentText() : 'text-slate-500'
              }`}
            >
              {item.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="bottomNavDot"
                className="w-1 h-1 rounded-full bg-violet-400 absolute bottom-0.5"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
