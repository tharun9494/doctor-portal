import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Save, Edit, Camera, Stethoscope, Award, Clock, AlertCircle, Plus, Trash2, Navigation, Globe, CheckCircle, X } from 'lucide-react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConnected } from '../../firebase/firebase';
import { useDoctorAuth } from '../../contexts/DoctorAuthContext';
import DoctorLayout from '../../components/doctor/DoctorLayout';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  landmark?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface DoctorProfile {
  id: string;
  doctorId: string;
  name: string;
  specialization: string;
  experience: number;
  email: string;
  phone: string;
  address: Address;
  bio?: string;
  education: string[];
  certifications: string[];
  languages: string[];
  consultationFee?: number;
  availability?: {
    days?: string[];
    hours?: string;
  };
  profileImage?: string;
  status: 'active' | 'inactive';
  createdAt?: any;
  updatedAt?: any;
}

const DoctorProfile: React.FC = () => {
  const { doctorUser, loginDoctor } = useDoctorAuth();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newEducation, setNewEducation] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Mock profile data for offline mode
  const mockProfile: DoctorProfile = {
    id: doctorUser?.id || '1',
    doctorId: 'DOC001',
    name: doctorUser?.name || 'Dr. Sarah Johnson',
    specialization: doctorUser?.specialization || 'Cardiology',
    experience: 15,
    email: doctorUser?.email || 'sarah.johnson@hospital.com',
    phone: '+1 (555) 123-4567',
    address: {
      street: '123 Medical Center Drive',
      city: 'Healthcare City',
      state: 'California',
      pincode: '90210',
      country: 'United States',
      landmark: 'Near Central Hospital',
      coordinates: {
        lat: 34.0522,
        lng: -118.2437
      }
    },
    bio: 'Experienced cardiologist with over 15 years of practice. Specialized in interventional cardiology and heart disease prevention.',
    education: [
      'MD - Harvard Medical School (2008)',
      'Residency - Johns Hopkins Hospital (2012)',
      'Fellowship - Mayo Clinic Cardiology (2014)'
    ],
    certifications: [
      'Board Certified in Cardiology',
      'Advanced Cardiac Life Support (ACLS)',
      'Interventional Cardiology Certification'
    ],
    languages: ['English', 'Spanish', 'French'],
    consultationFee: 200,
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hours: '9:00 AM - 5:00 PM'
    },
    status: 'active'
  };

  useEffect(() => {
    fetchProfile();
  }, [doctorUser]);

  const fetchProfile = async () => {
    if (!doctorUser) return;

    try {
      setError(null);
      
      if (!isFirebaseConnected()) {
        setError('Operating in offline mode. Changes will be saved locally.');
        setProfile(mockProfile);
        return;
      }

      const profileDoc = await getDoc(doc(db, 'doctors', doctorUser.id));
      
      if (profileDoc.exists()) {
        const profileData = profileDoc.data() as DoctorProfile;
        let days: string[] = ['Monday'];
        let hours: string = '9:00 AM - 5:00 PM';
        if (profileData.availability) {
          if (Array.isArray(profileData.availability.days) && profileData.availability.days.length > 0) {
            days = profileData.availability.days;
          }
          if (typeof profileData.availability.hours === 'string' && profileData.availability.hours.length > 0) {
            hours = profileData.availability.hours;
          }
        }
        setProfile({
          ...profileData,
          education: profileData.education || [],
          certifications: profileData.certifications || [],
          languages: profileData.languages || ['English'],
          address: profileData.address || mockProfile.address,
          availability: { days, hours },
        });
      } else {
        // Create profile with default data
        setProfile(mockProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Unable to load profile. Showing default data.');
      setProfile(mockProfile);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile || !doctorUser) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!isFirebaseConnected()) {
        setError('Profile saved locally. Will sync when connection is restored.');
        setIsEditing(false);
        return;
      }

      // Prepare data for Firebase - include firebaseUid to satisfy security rules
      const updateData = {
        ...profile,
        firebaseUid: doctorUser.id, // Add this field to satisfy Firestore security rules
        updatedAt: new Date(),
        // Ensure required fields are present
        status: profile.status || 'active',
        createdAt: profile.createdAt || new Date()
      };

      // Update the doctor document in Firebase
      await setDoc(doc(db, 'doctors', doctorUser.id), updateData, { merge: true });

      // Update the doctor context with new data
      loginDoctor({
        id: doctorUser.id,
        name: profile.name,
        specialization: profile.specialization,
        email: profile.email,
        profileImage: profile.profileImage
      });

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      if (error.code === 'permission-denied') {
        setError('Permission denied. Please contact administrator.');
      } else {
        setError('Failed to save profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof DoctorProfile, value: any) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const handleAddressChange = (field: keyof Address, value: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      address: { ...profile.address, [field]: value }
    });
  };

  const handleAvailabilityChange = (field: 'days' | 'hours', value: any) => {
    if (!profile) return;
    setProfile({
      ...profile,
      availability: {
        ...profile.availability,
        [field]: value
      }
    });
  };

  const geocodeAddress = async () => {
    if (!profile?.address) return;
    
    const { street, city, state, pincode, country } = profile.address;
    const fullAddress = `${street}, ${city}, ${state} ${pincode}, ${country}`;
    
    try {
      // Mock geocoding - in a real app, you'd use Google Maps Geocoding API
      const mockCoordinates = {
        lat: 34.0522 + (Math.random() - 0.5) * 0.1,
        lng: -118.2437 + (Math.random() - 0.5) * 0.1
      };
      
      setProfile({
        ...profile,
        address: {
          ...profile.address,
          coordinates: mockCoordinates
        }
      });
      
      setSuccess('Location coordinates updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to geocode address. Please check the address details.');
    }
  };

  const addEducation = () => {
    if (!newEducation.trim() || !profile) return;
    setProfile({
      ...profile,
      education: [...profile.education, newEducation.trim()]
    });
    setNewEducation('');
  };

  const removeEducation = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      education: profile.education.filter((_, i) => i !== index)
    });
  };

  const addCertification = () => {
    if (!newCertification.trim() || !profile) return;
    setProfile({
      ...profile,
      certifications: [...profile.certifications, newCertification.trim()]
    });
    setNewCertification('');
  };

  const removeCertification = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      certifications: profile.certifications.filter((_, i) => i !== index)
    });
  };

  const addLanguage = () => {
    if (!newLanguage.trim() || !profile) return;
    setProfile({
      ...profile,
      languages: [...profile.languages, newLanguage.trim()]
    });
    setNewLanguage('');
  };

  const removeLanguage = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      languages: profile.languages.filter((_, i) => i !== index)
    });
  };

  const openInMaps = () => {
    if (!profile?.address.coordinates) return;
    const { lat, lng } = profile.address.coordinates;
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    fetchProfile(); // Reload original data
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !profile || !doctorUser) return;
    
    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
    
    setImageFile(file);
    setImageUploading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!isFirebaseConnected()) {
        setError('Unable to upload image. Please check your internet connection.');
        return;
      }

      const storage = getStorage();
      const imgRef = storageRef(storage, `doctor-profiles/${doctorUser.id}/${Date.now()}_${file.name}`);
      
      // Upload the file
      const uploadResult = await uploadBytes(imgRef, file);
      
      // Get the download URL
      const url = await getDownloadURL(uploadResult.ref);
      
      // Update profile with new image URL
      setProfile({ ...profile, profileImage: url });
      
      // Save the updated profile to Firestore
      const updateData = {
        ...profile,
        profileImage: url,
        firebaseUid: doctorUser.id,
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, 'doctors', doctorUser.id), updateData, { merge: true });
      
      // Update the doctor context with new image
      loginDoctor({
        id: doctorUser.id,
        name: doctorUser.name,
        specialization: doctorUser.specialization,
        email: doctorUser.email,
        profileImage: url
      });
      
      setSuccess('Profile image uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      if (err.code === 'storage/unauthorized') {
        setError('Permission denied. Please contact administrator.');
      } else if (err.code === 'storage/quota-exceeded') {
        setError('Storage quota exceeded. Please try a smaller image.');
      } else {
        setError('Failed to upload image. Please try again.');
      }
    } finally {
      setImageUploading(false);
      setImageFile(null);
    }
  };

  const removeProfileImage = async () => {
    if (!profile || !doctorUser) return;
    
    setImageUploading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Update profile to remove image URL
      const updateData = {
        ...profile,
        profileImage: null,
        firebaseUid: doctorUser.id,
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, 'doctors', doctorUser.id), updateData, { merge: true });
      
      // Update local state
      setProfile({ ...profile, profileImage: undefined });
      
      // Update the doctor context
      loginDoctor({
        id: doctorUser.id,
        name: doctorUser.name,
        specialization: doctorUser.specialization,
        email: doctorUser.email,
        profileImage: undefined
      });
      
      setSuccess('Profile image removed successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error removing image:', err);
      setError('Failed to remove profile image. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  if (loading) {
    return (
      <DoctorLayout title="Profile">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DoctorLayout>
    );
  }

  if (!profile) {
    return (
      <DoctorLayout title="Profile">
        <div className="text-center py-12">
          <p className="text-gray-600">Unable to load profile data.</p>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout title="Profile">
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

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-32 h-32 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center ${profile.profileImage ? 'hidden' : ''}`}>
                <Stethoscope className="w-16 h-16 text-white" />
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <Camera className="w-5 h-5 text-gray-600" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={imageUploading}
                  />
                </label>
              )}
              
              {isEditing && profile.profileImage && (
                <button
                  onClick={removeProfileImage}
                  disabled={imageUploading}
                  className="absolute top-0 right-0 bg-red-600 text-white p-2 rounded-full cursor-pointer hover:bg-red-700 transition-colors shadow-lg"
                  title="Remove profile image"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="text-center md:text-left flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-600 focus:outline-none w-full"
                />
              ) : (
                <h2 className="text-3xl font-bold text-gray-900">{profile.name}</h2>
              )}
              
              {isEditing ? (
                <select
                  value={profile.specialization}
                  onChange={(e) => handleInputChange('specialization', e.target.value)}
                  className="text-xl text-gray-600 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-600 mt-2"
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Psychiatry">Psychiatry</option>
                  <option value="Radiology">Radiology</option>
                </select>
              ) : (
                <p className="text-xl text-gray-600">{profile.specialization}</p>
              )}
              
              <p className="text-gray-500">Doctor ID: {profile.doctorId}</p>
              <div className="flex items-center justify-center md:justify-start space-x-4 mt-2">
                <span className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  {profile.experience} years experience
                </span>
                <span className="flex items-center text-gray-600">
                  <Award className="w-4 h-4 mr-1" />
                  {profile.certifications.length} certifications
                </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  profile.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {profile.status}
                </span>
              </div>
            </div>
            <div className="md:ml-auto">
              {isEditing ? (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{profile.email}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{profile.phone}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={profile.experience}
                    onChange={(e) => handleInputChange('experience', parseInt(e.target.value))}
                    min="0"
                    max="50"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">{profile.experience} years</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Fee ($)</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={profile.consultationFee || 0}
                    onChange={(e) => handleInputChange('consultationFee', parseInt(e.target.value))}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">${profile.consultationFee || 'Not set'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    value={profile.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Tell patients about yourself..."
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">{profile.bio || 'No bio provided'}</span>
                  </div>
                )}
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.availability?.hours || ''}
                    onChange={(e) => handleAvailabilityChange('hours', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 9:00 AM - 5:00 PM"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">{profile.availability?.hours || 'Not set'}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Address & Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Address & Location</h3>
              {!isEditing && profile.address.coordinates && (
                <button
                  onClick={openInMaps}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>View on Map</span>
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.address.street}
                    onChange={(e) => handleAddressChange('street', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123 Main Street"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">{profile.address.street}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.address.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="City"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">{profile.address.city}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.address.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="State"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">{profile.address.state}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.address.pincode}
                      onChange={(e) => handleAddressChange('pincode', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="12345"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">{profile.address.pincode}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.address.country}
                      onChange={(e) => handleAddressChange('country', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Country"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">{profile.address.country}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Landmark (Optional)</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.address.landmark || ''}
                    onChange={(e) => handleAddressChange('landmark', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Near Central Hospital"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">{profile.address.landmark || 'No landmark specified'}</span>
                  </div>
                )}
              </div>

              {isEditing && (
                <button
                  onClick={geocodeAddress}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Update Location Coordinates</span>
                </button>
              )}

              {/* Map Preview */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Location Preview</label>
                <div className="h-48 bg-gradient-to-br from-blue-100 to-teal-100 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                    <p className="text-blue-800 font-medium">Interactive Map</p>
                    <p className="text-blue-600 text-sm">
                      {profile.address.coordinates ? 
                        `Lat: ${profile.address.coordinates.lat.toFixed(4)}, Lng: ${profile.address.coordinates.lng.toFixed(4)}` :
                        'Coordinates not set'
                      }
                    </p>
                    {profile.address.coordinates && (
                      <button
                        onClick={openInMaps}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        Open in Google Maps
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Education */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Education</h3>
            {isEditing && (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newEducation}
                  onChange={(e) => setNewEducation(e.target.value)}
                  placeholder="Add education..."
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addEducation()}
                />
                <button
                  onClick={addEducation}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {profile.education.map((edu, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-900">{edu}</span>
                {isEditing && (
                  <button
                    onClick={() => removeEducation(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {profile.education.length === 0 && (
              <p className="text-gray-500 text-center py-4">No education information added</p>
            )}
          </div>
        </motion.div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Certifications</h3>
            {isEditing && (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  placeholder="Add certification..."
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addCertification()}
                />
                <button
                  onClick={addCertification}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {profile.certifications.map((cert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-900">{cert}</span>
                {isEditing && (
                  <button
                    onClick={() => removeCertification(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {profile.certifications.length === 0 && (
              <p className="text-gray-500 text-center py-4">No certifications added</p>
            )}
          </div>
        </motion.div>

        {/* Languages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Languages</h3>
            {isEditing && (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="Add language..."
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                />
                <button
                  onClick={addLanguage}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            {profile.languages.map((lang, index) => (
              <div key={index} className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-full">
                <span>{lang}</span>
                {isEditing && (
                  <button
                    onClick={() => removeLanguage(index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {profile.languages.length === 0 && (
              <p className="text-gray-500 text-center py-4 w-full">No languages added</p>
            )}
          </div>
        </motion.div>

        {/* Profile Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Profile Image</h3>
          
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/default-profile.png';
                  }}
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center border-4 border-blue-200 shadow-lg">
                  <Stethoscope className="w-16 h-16 text-white" />
                </div>
              )}
              
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={imageUploading}
                  />
                </label>
              )}
            </div>
            
            {imageUploading && (
              <div className="flex items-center space-x-2 text-blue-600 text-sm mb-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Uploading image...</span>
              </div>
            )}
            
            {isEditing && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Click the camera icon to upload a new profile image
                </p>
                <p className="text-xs text-gray-500">
                  Supported formats: JPEG, PNG, GIF (Max size: 5MB)
                </p>
              </div>
            )}
            
            {!isEditing && !profile.profileImage && (
              <p className="text-sm text-gray-500 text-center">
                No profile image uploaded
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorProfile;