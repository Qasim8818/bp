import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Gamepad2, Wallet, User, History } from 'lucide-react';

const MobileNavigation = () => {
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/game', icon: Gamepad2, label: 'Game' },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  return (
    <nav className="mobile-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `mobile-nav-item ${isActive ? 'active' : ''}`
          }
        >
          <item.icon size={24} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileNavigation;
