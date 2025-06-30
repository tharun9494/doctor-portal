import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar, 
  Clock, 
  Video, 
  User, 
  Settings, 
  CreditCard,
  LogOut,
  Stethoscope,
  X,
  Bell,
  FileText,
  Activity
} from 'lucide-react';
import { useDoctorAuth } from '../../contexts/DoctorAuthContext';

interface DoctorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const DoctorSidebar: React.FC<DoctorSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { doctorUser, logoutDoctor } = useDoctorAuth();

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/doctor/dashboard',
      description: 'Overview & Analytics',
      badge: null
    },
    { 
      icon: Clock, 
      label: 'Time Slots', 
      path: '/doctor/slots',
      description: 'Manage Availability',
      badge: null
    },
    { 
      icon: Calendar, 
      label: 'Appointments', 
      path: '/doctor/appointments',
      description: 'View & Manage',
      badge: '8'
    },
    { 
      icon: Video, 
      label: 'Online Consult', 
      path: '/doctor/consult',
      description: 'Virtual Meetings',
      badge: '2'
    },
    { 
      icon: User, 
      label: 'Profile', 
      path: '/doctor/profile',
      description: 'Personal Information',
      badge: null
    },
    { 
      icon: FileText, 
      label: 'Medical Records', 
      path: '/doctor/records',
      description: 'Patient Records',
      badge: null
    },
    { 
      icon: CreditCard, 
      label: 'Payments', 
      path: '/doctor/payments',
      description: 'Financial Overview',
      badge: null
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      path: '/doctor/settings',
      description: 'Preferences',
      badge: null
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logoutDoctor();
    onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar for mobile (animated) */}
      <motion.div
        initial={false}
        animate={{ x: isOpen ? 0 : -320 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="
          fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 border-r border-gray-200
          transition-transform duration-300
          lg:hidden
        "
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-320px)'
        }}
      >
        <SidebarContent onClose={onClose} doctorUser={doctorUser} menuItems={menuItems} isActive={isActive} handleLogout={handleLogout} />
      </motion.div>

      {/* Sidebar for desktop (static, always visible) */}
      <div
        className="
          hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-80 lg:bg-white lg:shadow-2xl lg:border-r lg:border-gray-200
        "
      >
        <SidebarContent onClose={onClose} doctorUser={doctorUser} menuItems={menuItems} isActive={isActive} handleLogout={handleLogout} />
      </div>
    </>
  );
};

// Extract sidebar content to a separate component for reuse
interface SidebarContentProps {
  onClose: () => void;
  doctorUser: {
    name: string;
    specialization: string;
  } | null;
  menuItems: Array<{
    icon: React.ElementType;
    label: string;
    path: string;
    description: string;
    badge: string | null;
  }>;
  isActive: (path: string) => boolean;
  handleLogout: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ onClose, doctorUser, menuItems, isActive, handleLogout }) => (
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-teal-600">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">MediConnect</h2>
            <p className="text-sm text-blue-100">Doctor Portal</p>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
      {/* Doctor Info */}
      {doctorUser && (
        <div className="mt-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{doctorUser.name}</p>
              <p className="text-sm text-blue-100 truncate">{doctorUser.specialization}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Activity className="w-3 h-3 text-green-300" />
                <span className="text-xs text-green-300">Online</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    {/* Navigation */}
    <nav className="flex-1 p-4 overflow-y-auto">
      <div className="space-y-1">
        {menuItems.map((item: {
          icon: React.ElementType;
          label: string;
          path: string;
          description: string;
          badge: string | null;
        }) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive(item.path)
                ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg transform scale-105'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <item.icon 
              size={20} 
              className={`${
                isActive(item.path) ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
              }`}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.label}</p>
              <p className={`text-xs truncate ${
                isActive(item.path) ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {item.description}
              </p>
            </div>
            {/* Badge */}
            {item.badge && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                isActive(item.path) 
                  ? 'bg-white/20 text-white' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
    {/* Logout */}
    <div className="p-4 border-t border-gray-200">
      <button
        onClick={handleLogout}
        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200 w-full"
      >
        <LogOut size={20} />
        <span className="font-medium">Logout</span>
      </button>
    </div>
  </div>
);

export default DoctorSidebar;