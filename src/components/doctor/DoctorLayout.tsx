import React, { useState } from 'react';
import { Menu, X, Bell, Search } from 'lucide-react';
import DoctorSidebar from './DoctorSidebar';

interface DoctorLayoutProps {
  children: React.ReactNode;
  title: string;
}

const DoctorLayout: React.FC<DoctorLayoutProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <DoctorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content Area - Full width on desktop */}
      <div className="lg:pl-80 min-h-screen">
        {/* Header - Full width */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu size={24} className="text-gray-600" />
              </button>
              
              {/* Page Title */}
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-500 mt-1 hidden sm:block">Manage your medical practice efficiently</p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Search Bar - Desktop */}
              <div className="hidden lg:flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search patients, appointments..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="hidden xl:flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">Today</p>
                  <p className="text-xs text-gray-500">8 appointments</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">Status</p>
                  <p className="text-xs text-green-600">Available</p>
                </div>
              </div>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {/* Profile Avatar */}
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">DR</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Full width with proper padding */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;