import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Wallet, 
  Gamepad2, 
  History, 
  CreditCard, 
  Users, 
  LifeBuoy
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
    { path: '/game', icon: Gamepad2, label: 'Game' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/transactions', icon: CreditCard, label: 'Transactions' },
    { path: '/referral', icon: Users, label: 'Referral' },
    { path: '/support', icon: LifeBuoy, label: 'Support' },
  ];

  return (
    <aside className="w-64 bg-white shadow-sm">
      <nav className="mt-5 px-2">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                location.pathname === item.path
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 ${
                  location.pathname === item.path
                    ? 'text-blue-700'
                    : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
