
import React from 'react';
import { View } from '../types';
import { DashboardIcon } from './icons/DashboardIcon';
import { BuilderIcon } from './icons/BuilderIcon';
import { BacktestIcon } from './icons/BacktestIcon';
import { AlertIcon } from './icons/AlertIcon';
import { OptionsIcon } from './icons/OptionsIcon';
import { ProfileIcon } from './icons/ProfileIcon';
import { GuidesIcon } from './icons/GuidesIcon';
import { BlogIcon } from './icons/BlogIcon';
import { FaqIcon } from './icons/FaqIcon';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-4 py-3 text-left transition-colors duration-200 rounded-lg ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg'
          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {icon}
      <span className="ml-4 font-medium">{label}</span>
    </button>
  );
};

const NavHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{children}</h3>
);


const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  return (
    <div className="w-64 bg-gray-800 p-4 flex flex-col border-r border-gray-700">
      <div className="flex-grow">
        <NavHeader>Trading</NavHeader>
        <div className="space-y-1">
          <NavItem
            icon={<DashboardIcon className="w-6 h-6" />}
            label="Dashboard"
            isActive={activeView === View.DASHBOARD}
            onClick={() => setActiveView(View.DASHBOARD)}
          />
          <NavItem
            icon={<BuilderIcon className="w-6 h-6" />}
            label="Strategy Builder"
            isActive={activeView === View.BUILDER}
            onClick={() => setActiveView(View.BUILDER)}
          />
          <NavItem
            icon={<OptionsIcon className="w-6 h-6" />}
            label="Options Builder"
            isActive={activeView === View.OPTIONS_BUILDER}
            onClick={() => setActiveView(View.OPTIONS_BUILDER)}
          />
          <NavItem
            icon={<BacktestIcon className="w-6 h-6" />}
            label="Backtest"
            isActive={activeView === View.BACKTEST}
            onClick={() => setActiveView(View.BACKTEST)}
          />
          <NavItem
            icon={<AlertIcon className="w-6 h-6" />}
            label="Alerts"
            isActive={activeView === View.ALERTS}
            onClick={() => setActiveView(View.ALERTS)}
          />
        </div>

        <NavHeader>Resources</NavHeader>
        <div className="space-y-1">
          <NavItem
            icon={<GuidesIcon className="w-6 h-6" />}
            label="Guides"
            isActive={activeView === View.GUIDES}
            onClick={() => setActiveView(View.GUIDES)}
          />
          <NavItem
            icon={<BlogIcon className="w-6 h-6" />}
            label="Blog"
            isActive={activeView === View.BLOG}
            onClick={() => setActiveView(View.BLOG)}
          />
          <NavItem
            icon={<FaqIcon className="w-6 h-6" />}
            label="FAQ"
            isActive={activeView === View.FAQ}
            onClick={() => setActiveView(View.FAQ)}
          />
        </div>
        
        <NavHeader>Account</NavHeader>
        <div className="space-y-1">
             <NavItem
                icon={<ProfileIcon className="w-6 h-6" />}
                label="Profile"
                isActive={activeView === View.PROFILE}
                onClick={() => setActiveView(View.PROFILE)}
                />
        </div>

      </div>
      <div className="text-center text-gray-600 text-xs">
        <p>&copy; 2024 Bot Architect Inc.</p>
      </div>
    </div>
  );
};

export default Sidebar;
