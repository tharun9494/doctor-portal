import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, RefreshCw, AlertCircle } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConnected } from '../../firebase/firebase';
import AdminLayout from '../../components/admin/AdminLayout';

interface Doctor {
  id: string;
  doctorId: string;
  name: string;
  specialization: string;
  experience: number;
  email: string;
  phone: string;
  password: string;
  status: 'active' | 'inactive';
  hospitalName?: string;
}

const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [hospitalName, setHospitalName] = useState('');

  const [formData, setFormData] = useState({
    doctorId: '',
    name: '',
    specialization: '',
    experience: '',
    email: '',
    phone: '',
    password: '',
    status: 'active' as 'active' | 'inactive',
    hospitalName: ''
  });

  // Mock data for offline mode
  const mockDoctors: Doctor[] = [
    {
      id: '1',
      doctorId: 'DOC001',
      name: 'Dr. Sarah Johnson',
      specialization: 'Cardiology',
      experience: 15,
      email: 'sarah.johnson@hospital.com',
      phone: '+1 (555) 123-4567',
      password: 'temp123',
      status: 'active',
      hospitalName: 'MediConnect General Hospital'
    },
    {
      id: '2',
      doctorId: 'DOC002',
      name: 'Dr. Michael Chen',
      specialization: 'Neurology',
      experience: 12,
      email: 'michael.chen@hospital.com',
      phone: '+1 (555) 234-5678',
      password: 'temp456',
      status: 'active',
      hospitalName: 'MediConnect General Hospital'
    },
    {
      id: '3',
      doctorId: 'DOC003',
      name: 'Dr. Emily Rodriguez',
      specialization: 'Pediatrics',
      experience: 8,
      email: 'emily.rodriguez@hospital.com',
      phone: '+1 (555) 345-6789',
      password: 'temp789',
      status: 'active',
      hospitalName: 'MediConnect General Hospital'
    }
  ];

  useEffect(() => {
    fetchHospitalName();
    fetchDoctors();
  }, []);

  const fetchHospitalName = async () => {
    try {
      if (!isFirebaseConnected()) {
        setHospitalName('MediConnect General Hospital');
        return;
      }
      const settingsDoc = await getDoc(doc(db, 'settings', 'hospital'));
      if (settingsDoc.exists()) {
        const defaultHospitalName = settingsDoc.data().name || 'MediConnect General Hospital';
        setHospitalName(defaultHospitalName);
        // Set as default in form data
        setFormData(prev => ({ ...prev, hospitalName: defaultHospitalName }));
      } else {
        setHospitalName('MediConnect General Hospital');
        setFormData(prev => ({ ...prev, hospitalName: 'MediConnect General Hospital' }));
      }
    } catch (error) {
      setHospitalName('MediConnect General Hospital');
      setFormData(prev => ({ ...prev, hospitalName: 'MediConnect General Hospital' }));
    }
  };

  const fetchDoctors = async () => {
    try {
      setError(null);
      
      if (!isFirebaseConnected()) {
        setError('Operating in offline mode. Showing sample data.');
        setDoctors(mockDoctors);
        setLoading(false);
        return;
      }

      const querySnapshot = await getDocs(collection(db, 'doctors'));
      const doctorsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Doctor[];
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Unable to connect to database. Using offline mode.');
      setDoctors(mockDoctors);
    } finally {
      setLoading(false);
    }
  };

  const generateDoctorId = () => {
    const prefix = 'DOC';
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${randomNum}`;
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);

    try {
      const doctorData = {
        ...formData,
        experience: parseInt(formData.experience),
        createdAt: new Date(),
        hospitalName: formData.hospitalName || hospitalName || 'MediConnect General Hospital'
      };

      if (!isFirebaseConnected()) {
        // Offline mode - update local state only
        if (editingDoctor) {
          setDoctors(prev => prev.map(doc => 
            doc.id === editingDoctor.id ? { ...doc, ...doctorData } : doc
          ));
        } else {
          const newDoctor = {
            id: Date.now().toString(),
            ...doctorData
          };
          setDoctors(prev => [...prev, newDoctor]);
        }
        setError('Changes saved locally. Will sync when connection is restored.');
        setShowModal(false);
        resetForm();
        return;
      }

      if (editingDoctor) {
        // Update existing doctor
        await updateDoc(doc(db, 'doctors', editingDoctor.id), doctorData);
      } else {
        // Create new doctor - only in Firestore
        await addDoc(collection(db, 'doctors'), doctorData);
      }

      await fetchDoctors();
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving doctor:', error);
      setError('Failed to save doctor. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      doctorId: doctor.doctorId,
      name: doctor.name,
      specialization: doctor.specialization,
      experience: doctor.experience.toString(),
      email: doctor.email,
      phone: doctor.phone,
      password: doctor.password,
      status: doctor.status,
      hospitalName: doctor.hospitalName || hospitalName || 'MediConnect General Hospital'
    });
    setShowModal(true);
  };

  const handleDelete = async (doctorId: string) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        if (!isFirebaseConnected()) {
          // Offline mode - remove from local state
          setDoctors(prev => prev.filter(doc => doc.id !== doctorId));
          setError('Doctor removed locally. Will sync when connection is restored.');
          return;
        }

        // Delete from Firestore only
        await deleteDoc(doc(db, 'doctors', doctorId));
        
        await fetchDoctors();
      } catch (error) {
        console.error('Error deleting doctor:', error);
        setError('Failed to delete doctor. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      doctorId: '',
      name: '',
      specialization: '',
      experience: '',
      email: '',
      phone: '',
      password: '',
      status: 'active',
      hospitalName: hospitalName || 'MediConnect General Hospital'
    });
    setEditingDoctor(null);
  };

  const handleNewDoctor = () => {
    resetForm();
    setFormData(prev => ({
      ...prev,
      doctorId: generateDoctorId(),
      password: generatePassword(),
      hospitalName: hospitalName || 'MediConnect General Hospital'
    }));
    setShowModal(true);
  };

  const togglePasswordVisibility = (doctorId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [doctorId]: !prev[doctorId]
    }));
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.doctorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Doctor Management">
      <div className="space-y-6">
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

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleNewDoctor}
            className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Doctor</span>
          </button>
        </div>

        {/* Doctors Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Doctor ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Specialization</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Experience</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Password</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Hospital</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDoctors.map((doctor) => (
                  <motion.tr
                    key={doctor.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{doctor.doctorId}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{doctor.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{doctor.specialization}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{doctor.experience} years</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{doctor.email}</div>
                      <div className="text-gray-500">{doctor.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono">
                          {showPasswords[doctor.id] ? doctor.password : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(doctor.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords[doctor.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        doctor.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {doctor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{doctor.hospitalName || hospitalName}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(doctor)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(doctor.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
              </h2>
              
              {!isFirebaseConnected() && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="text-sm">Offline mode: Changes will be saved locally and synced when connection is restored.</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Doctor ID
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={formData.doctorId}
                        onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, doctorId: generateDoctorId()})}
                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization
                    </label>
                    <select
                      value={formData.specialization}
                      onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Specialization</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="General Medicine">General Medicine</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      value={formData.experience}
                      onChange={(e) => setFormData({...formData, experience: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, password: generatePassword()})}
                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hospital Name
                    </label>
                    <input
                      type="text"
                      value={formData.hospitalName}
                      onChange={(e) => setFormData({...formData, hospitalName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
                  >
                    {submitLoading ? 'Saving...' : editingDoctor ? 'Update Doctor' : 'Add Doctor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default DoctorManagement;