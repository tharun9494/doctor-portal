import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Shield, ArrowRight, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useDoctorAuth } from '../contexts/DoctorAuthContext';

const Login: React.FC = () => {
  const [loginType, setLoginType] = useState<'admin' | 'doctor'>('admin');
  const [adminData, setAdminData] = useState({ email: '', password: '' });
  const [doctorData, setDoctorData] = useState({ doctorId: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { loginDoctor } = useDoctorAuth();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, adminData.email, adminData.password);
      const user = userCredential.user;
      
      // Check if user is admin in Firestore
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      
      if (adminDoc.exists()) {
        // User is admin, redirect to admin dashboard
        navigate('/admin/dashboard');
      } else {
        // User exists but is not admin, sign them out and show error
        await auth.signOut();
        setError('Access denied. This account does not have admin privileges.');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('No admin account found with this email address.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Query Firestore for doctor with matching doctorId and password
      const q = query(
        collection(db, 'doctors'),
        where('doctorId', '==', doctorData.doctorId),
        where('password', '==', doctorData.password)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const doctorInfo = docSnap.data();
        // Optionally check if doctor is active
        if (doctorInfo.status && doctorInfo.status !== 'active') {
          setError('Your account is inactive. Please contact the administrator.');
          setLoading(false);
          return;
        }
        // Login doctor using context
        loginDoctor({
          id: docSnap.id,
          name: doctorInfo.name,
          specialization: doctorInfo.specialization,
          email: doctorInfo.email || ''
        });
        navigate('/doctor/dashboard');
      } else {
        setError('Invalid Doctor ID or password. Please try again.');
      }
    } catch (error) {
      console.error('Doctor login error:', error);
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md mx-auto"
        >
          {/* Login Type Selector */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Welcome Back
            </h1>
            
            <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
              <button
                onClick={() => {
                  setLoginType('admin');
                  setError('');
                }}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                  loginType === 'admin'
                    ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Shield size={18} />
                <span>Hospital Admin</span>
              </button>
              <button
                onClick={() => {
                  setLoginType('doctor');
                  setError('');
                }}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                  loginType === 'doctor'
                    ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <User size={18} />
                <span>Doctor</span>
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center"
              >
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Admin Login Form */}
            {loginType === 'admin' && (
              <motion.form
                key="admin-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleAdminLogin}
                className="space-y-6"
              >
                <div>
                  <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      id="admin-email"
                      required
                      value={adminData.email}
                      onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="admin@hospital.com"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      id="admin-password"
                      required
                      value={adminData.password}
                      onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    <>
                      Sign In as Admin
                      <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* Doctor Login Form */}
            {loginType === 'doctor' && (
              <motion.form
                key="doctor-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleDoctorLogin}
                className="space-y-6"
              >
                <div>
                  <label htmlFor="doctor-id" className="block text-sm font-medium text-gray-700 mb-2">
                    Doctor ID
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      id="doctor-id"
                      required
                      value={doctorData.doctorId}
                      onChange={(e) => setDoctorData({ ...doctorData, doctorId: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your Doctor ID"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="doctor-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      id="doctor-password"
                      required
                      value={doctorData.password}
                      onChange={(e) => setDoctorData({ ...doctorData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    <>
                      Sign In as Doctor
                      <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Need help with your account?{' '}
                <Link to="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
                  Contact Support
                </Link>
              </p>
            </div>

            {/* Demo Credentials & Instructions */}
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Demo Credentials:</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <p><strong>Admin:</strong> admin@hospital.com / admin123</p>
                  <p><strong>Doctor:</strong> Use email and password from Doctor Management</p>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="text-sm font-semibold text-green-900 mb-2">Doctor Login Instructions:</h4>
                <div className="text-xs text-green-700 space-y-1">
                  <p>• Doctors now login using their email and password</p>
                  <p>• Firebase Authentication is used for secure access</p>
                  <p>• Create doctor accounts through Admin → Doctor Management</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;