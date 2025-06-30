import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Moon, Sun, Bell, Shield, Database, Wifi, User, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConnected } from '../../firebase/firebase';
import AdminLayout from '../../components/admin/AdminLayout';

interface HospitalSettings {
  name: string;
  registrationNumber: string;
  contactEmail: string;
  emergencyContact: string;
  address: string;
  updatedAt?: any;
}

type SettingItem = 
  | {
      label: string;
      description: string;
      type: 'toggle';
      value: boolean;
    }
  | {
      label: string;
      description: string;
      type: 'button';
      buttonText: string;
      onClick: () => void;
    }
  | {
      label: string;
      description: string;
      type: 'select';
      options: string[];
      value: string;
    };

interface SettingSection {
  title: string;
  icon: React.ComponentType<any>;
  items: SettingItem[];
}

const AdminSettings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [hospitalSettings, setHospitalSettings] = useState<HospitalSettings>({
    name: 'MediConnect General Hospital',
    registrationNumber: 'HSP-2024-001',
    contactEmail: 'admin@mediconnect.com',
    emergencyContact: '+1 (555) 911-0000',
    address: '123 Healthcare Avenue, Medical District, City 12345'
  });

  // Mock settings for offline mode
  const mockSettings: HospitalSettings = {
    name: 'MediConnect General Hospital',
    registrationNumber: 'HSP-2024-001',
    contactEmail: 'admin@mediconnect.com',
    emergencyContact: '+1 (555) 911-0000',
    address: '123 Healthcare Avenue, Medical District, City 12345'
  };

  useEffect(() => {
    fetchHospitalSettings();
  }, []);

  const fetchHospitalSettings = async () => {
    try {
      setError(null);
      
      if (!isFirebaseConnected()) {
        setError('Operating in offline mode. Showing sample data.');
        setHospitalSettings(mockSettings);
        setLoading(false);
        return;
      }

      const settingsDoc = await getDoc(doc(db, 'settings', 'hospital'));
      
      if (settingsDoc.exists()) {
        const settingsData = settingsDoc.data() as HospitalSettings;
        setHospitalSettings({
          name: settingsData.name || mockSettings.name,
          registrationNumber: settingsData.registrationNumber || mockSettings.registrationNumber,
          contactEmail: settingsData.contactEmail || mockSettings.contactEmail,
          emergencyContact: settingsData.emergencyContact || mockSettings.emergencyContact,
          address: settingsData.address || mockSettings.address
        });
      } else {
        // Use default settings if none exists
        setHospitalSettings(mockSettings);
      }
    } catch (error) {
      console.error('Error fetching hospital settings:', error);
      setError('Unable to load hospital settings. Showing default data.');
      setHospitalSettings(mockSettings);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHospitalSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!isFirebaseConnected()) {
        setError('Settings saved locally. Will sync when connection is restored.');
        return;
      }

      // Prepare data for Firebase
      const updateData = {
        ...hospitalSettings,
        updatedAt: new Date()
      };

      // Save to Firestore
      await setDoc(doc(db, 'settings', 'hospital'), updateData, { merge: true });

      setSuccess('Hospital settings updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error saving hospital settings:', error);
      if (error.code === 'permission-denied') {
        setError('Permission denied. Please check your admin privileges.');
      } else {
        setError('Failed to save hospital settings. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const settingSections: SettingSection[] = [
    {
      title: 'Appearance',
      icon: darkMode ? Moon : Sun,
      items: [
        {
          label: 'Dark Mode',
          description: 'Switch between light and dark themes',
          type: 'toggle',
          value: darkMode,
          onChange: setDarkMode
        }
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          label: 'Email Notifications',
          description: 'Receive updates about system activities',
          type: 'toggle',
          value: true
        },
        {
          label: 'SMS Alerts',
          description: 'Get important alerts via SMS',
          type: 'toggle',
          value: false
        },
        {
          label: 'Push Notifications',
          description: 'Enable browser push notifications',
          type: 'toggle',
          value: true
        }
      ]
    },
    {
      title: 'Security',
      icon: Shield,
      items: [
        {
          label: 'Two-Factor Authentication',
          description: 'Add extra security to your account',
          type: 'button',
          buttonText: 'Configure',
          onClick: () => console.log('Configure 2FA')
        },
        {
          label: 'Session Timeout',
          description: 'Automatically log out after inactivity',
          type: 'select',
          options: ['15 minutes', '30 minutes', '1 hour', '2 hours'],
          value: '30 minutes'
        },
        {
          label: 'Login History',
          description: 'View recent login attempts',
          type: 'button',
          buttonText: 'View History',
          onClick: () => console.log('View login history')
        }
      ]
    },
    {
      title: 'System',
      icon: Database,
      items: [
        {
          label: 'Data Backup',
          description: 'Backup hospital data regularly',
          type: 'button',
          buttonText: 'Configure Backup',
          onClick: () => console.log('Configure backup')
        },
        {
          label: 'System Maintenance',
          description: 'Schedule maintenance windows',
          type: 'button',
          buttonText: 'Schedule',
          onClick: () => console.log('Schedule maintenance')
        },
        {
          label: 'API Access',
          description: 'Manage API keys and access',
          type: 'button',
          buttonText: 'Manage',
          onClick: () => console.log('Manage API access')
        }
      ]
    }
  ];

  if (loading) {
    return (
      <AdminLayout title="Settings">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="text-sm">{success}</span>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center"
          >
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        {/* Settings Sections */}
        {settingSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: sectionIndex * 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-3 rounded-xl">
                <section.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{section.title}</h3>
            </div>

            <div className="space-y-6">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.label}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>

                  <div className="ml-4">
                    {item.type === 'toggle' && (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={item.value} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    )}

                    {item.type === 'button' && (
                      <button
                        onClick={item.onClick}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {item.buttonText}
                      </button>
                    )}

                    {item.type === 'select' && (
                      <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        {item.options.map((option) => (
                          <option key={option} value={option} selected={option === item.value}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Hospital Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-3 rounded-xl">
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Hospital Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hospital Name
              </label>
              <input
                type="text"
                value={hospitalSettings.name}
                onChange={(e) => setHospitalSettings({...hospitalSettings, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Number
              </label>
              <input
                type="text"
                value={hospitalSettings.registrationNumber}
                onChange={(e) => setHospitalSettings({...hospitalSettings, registrationNumber: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={hospitalSettings.contactEmail}
                onChange={(e) => setHospitalSettings({...hospitalSettings, contactEmail: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact
              </label>
              <input
                type="tel"
                value={hospitalSettings.emergencyContact}
                onChange={(e) => setHospitalSettings({...hospitalSettings, emergencyContact: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hospital Address
              </label>
              <textarea
                rows={3}
                value={hospitalSettings.address}
                onChange={(e) => setHospitalSettings({...hospitalSettings, address: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleSaveHospitalSettings}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Hospital Information'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;