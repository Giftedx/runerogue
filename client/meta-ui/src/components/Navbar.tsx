import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { HomeIcon, TrophyIcon, CogIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-primary-600">
                RuneRogue
              </Link>
            </div>
            <div className="ml-6 flex space-x-8">
              <Link
                href="/dashboard"
                className="text-gray-900 hover:text-primary-600 inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent hover:border-primary-300"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
              <Link
                href="/leaderboard"
                className="text-gray-900 hover:text-primary-600 inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent hover:border-primary-300"
              >
                <TrophyIcon className="h-4 w-4 mr-2" />
                Leaderboard
              </Link>
              <Link
                href="/settings"
                className="text-gray-900 hover:text-primary-600 inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent hover:border-primary-300"
              >
                <CogIcon className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </div>
          </div>
          <div className="ml-6 flex items-center space-x-4">
            <span className="text-sm text-gray-700">Welcome, {user?.username}</span>
            <button
              onClick={logout}
              className="text-gray-500 hover:text-gray-700 inline-flex items-center px-3 py-2 text-sm font-medium"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;