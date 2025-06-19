import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import Navbar from '@/components/Navbar';
import { CogIcon, UserIcon, KeyIcon, BellIcon } from '@heroicons/react/24/outline';

const SettingsPage: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <Layout title="Settings - RuneRogue">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'security', name: 'Security', icon: KeyIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
              <p className="mt-1 text-sm text-gray-500">
                Update your account profile information and email address.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  id="username"
                  defaultValue={user?.username}
                  className="form-input"
                  disabled
                />
                <p className="mt-1 text-sm text-gray-500">
                  Username cannot be changed at this time.
                </p>
              </div>
              <div>
                <label htmlFor="email" className="form-label">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  defaultValue={user?.email}
                  className="form-input"
                  disabled
                />
                <p className="mt-1 text-sm text-gray-500">
                  Email changes will be available in a future update.
                </p>
              </div>
              <div>
                <label htmlFor="created" className="form-label">
                  Account Created
                </label>
                <input
                  type="text"
                  name="created"
                  id="created"
                  defaultValue={
                    user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'
                  }
                  className="form-input"
                  disabled
                />
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Security Settings</h3>
              <p className="mt-1 text-sm text-gray-500">
                Manage your account security and password settings.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <KeyIcon className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Password Change Coming Soon
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Password change functionality will be available in a future update. For now,
                      your account is secured with the password you created during registration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Notification Preferences
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose what notifications you want to receive.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <BellIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Notification Settings Coming Soon
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Customizable notification preferences will be available in a future update.
                      Stay tuned for email alerts, leaderboard updates, and more!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout title="Settings - RuneRogue">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <div className="flex items-center">
              <CogIcon className="h-8 w-8 text-gray-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            </div>
            <p className="mt-2 text-gray-600">
              Manage your account preferences and security settings.
            </p>
          </div>

          <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
            <aside className="py-6 px-2 sm:px-6 lg:py-0 lg:px-0 lg:col-span-3">
              <nav className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'bg-primary-50 border-primary-500 text-primary-700'
                        : 'border-transparent text-gray-900 hover:bg-gray-50 hover:text-gray-900'
                    } group border-l-4 px-3 py-2 flex items-center text-sm font-medium w-full text-left`}
                  >
                    <tab.icon
                      className={`${
                        activeTab === tab.id
                          ? 'text-primary-500'
                          : 'text-gray-400 group-hover:text-gray-500'
                      } flex-shrink-0 -ml-1 mr-3 h-6 w-6`}
                    />
                    <span className="truncate">{tab.name}</span>
                  </button>
                ))}
              </nav>
            </aside>

            <div className="space-y-6 sm:px-6 lg:px-0 lg:col-span-9">
              <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
