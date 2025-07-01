import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Video, MapPin, Phone, Mail, CheckCircle, XCircle, AlertCircle, ExternalLink, Heart, Shield, Home, UserCheck, CalendarDays, MapPin as MapPinIcon } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db, isFirebaseConnected } from '../../firebase/firebase';
import { useDoctorAuth } from '../../contexts/DoctorAuthContext';
import { useAppointmentCounts } from '../../hooks/useAppointmentCounts';
import DoctorLayout from '../../components/doctor/DoctorLayout';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientProfile?: {
    profileImage?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    address?: {
      street: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
    };
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    medicalHistory?: {
      allergies: string[];
      conditions: string[];
      medications: string[];
    };
  };
  date: any;
  timeSlot: string;
  timingSlot: string;
  type: 'in-person' | 'online';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show' | 'in-progress';
  symptoms?: string;
  notes?: string;
  doctorId: string;
}

const Appointments: React.FC = () => {
  const { doctorUser } = useDoctorAuth();
  const { appointments, loading, error: hookError } = useAppointmentCounts();
  const [activeTab, setActiveTab] = useState<'new' | 'completed' | 'cancelled'>('new');
  const [error, setError] = useState<string | null>(null);
  const [expandedAppointments, setExpandedAppointments] = useState<Set<string>>(new Set());

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      if (!isFirebaseConnected()) {
        setError('Unable to update appointment. Please check your internet connection.');
        return;
      }

      await updateDoc(doc(db, 'appointments', appointmentId), { 
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setError('Failed to update appointment status. Please try again.');
    }
  };

  const addNotes = async (appointmentId: string, notes: string) => {
    try {
      if (!isFirebaseConnected()) {
        setError('Unable to save notes. Please check your internet connection.');
        return;
      }

      await updateDoc(doc(db, 'appointments', appointmentId), { 
        notes,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      setError('Failed to save notes. Please try again.');
    }
  };

  const joinMeeting = (appointment: Appointment) => {
    // Generate a meeting link based on appointment details
    const meetingId = `meeting-${appointment.id}`;
    const meetingUrl = `https://meet.google.com/${meetingId}`;
    
    // Open meeting in new tab
    window.open(meetingUrl, '_blank');
    
    // Update appointment status to indicate meeting started
    updateAppointmentStatus(appointment.id, 'in-progress');
  };

  const newAppointments = appointments.filter(
    (appointment) => appointment.status === 'scheduled' || appointment.status === 'no-show' || appointment.status === 'in-progress'
  );
  const completedAppointments = appointments.filter(
    (appointment) => appointment.status === 'completed'
  );
  const cancelledAppointments = appointments.filter(
    (appointment) => appointment.status === 'cancelled'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-purple-100 text-purple-800';
      case 'no-show': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'online' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />;
  };

  const toggleAppointmentDetails = (appointmentId: string) => {
    const newExpanded = new Set(expandedAppointments);
    if (newExpanded.has(appointmentId)) {
      newExpanded.delete(appointmentId);
    } else {
      newExpanded.add(appointmentId);
    }
    setExpandedAppointments(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const renderPatientInfo = (appointment: Appointment) => {
    const isExpanded = expandedAppointments.has(appointment.id);
    const hasProfile = appointment.patientProfile && Object.keys(appointment.patientProfile).length > 0;

    return (
      <div className="flex-1">
        <div className="flex items-start space-x-4 mb-4">
          {/* Patient Profile Image */}
          <div className="relative">
            {appointment.patientProfile?.profileImage ? (
              <img
                src={appointment.patientProfile.profileImage}
                alt={`${appointment.patientName}'s profile`}
                className="w-16 h-16 rounded-full object-cover border-3 border-blue-200 shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center border-3 border-blue-200 shadow-lg ${appointment.patientProfile?.profileImage ? 'hidden' : ''}`}>
              <User className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Basic Patient Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-gray-900">{appointment.patientName}</h3>
              <button
                onClick={() => toggleAppointmentDetails(appointment.id)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
              >
                <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                <UserCheck className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
              <span className="flex items-center space-x-1">
                <span className="font-medium">ID:</span>
                <span className="bg-gray-100 px-2 py-1 rounded">{appointment.patientId}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Mail className="w-4 h-4" />
                <span>{appointment.patientEmail}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Phone className="w-4 h-4" />
                <span>{appointment.patientPhone}</span>
              </span>
            </div>

            {/* Expanded Patient Details */}
            {isExpanded && hasProfile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                      <UserCheck className="w-4 h-4 mr-2" />
                      Personal Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      {appointment.patientProfile.dateOfBirth && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date of Birth:</span>
                          <span className="font-medium">
                            {formatDate(appointment.patientProfile.dateOfBirth)} 
                            ({calculateAge(appointment.patientProfile.dateOfBirth)} years)
                          </span>
                        </div>
                      )}
                      {appointment.patientProfile.gender && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gender:</span>
                          <span className="font-medium capitalize">{appointment.patientProfile.gender}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address Information */}
                  {appointment.patientProfile.address && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                        <Home className="w-4 h-4 mr-2" />
                        Address
                      </h4>
                      <div className="text-sm text-gray-700">
                        <p>{appointment.patientProfile.address.street}</p>
                        <p>{appointment.patientProfile.address.city}, {appointment.patientProfile.address.state}</p>
                        <p>{appointment.patientProfile.address.pincode}, {appointment.patientProfile.address.country}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Emergency Contact */}
                {appointment.patientProfile.emergencyContact && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Emergency Contact
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium ml-2">{appointment.patientProfile.emergencyContact.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium ml-2">{appointment.patientProfile.emergencyContact.phone}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Relationship:</span>
                        <span className="font-medium ml-2">{appointment.patientProfile.emergencyContact.relationship}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Medical History */}
                {appointment.patientProfile.medicalHistory && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                      <Heart className="w-4 h-4 mr-2" />
                      Medical History
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 font-medium">Allergies:</span>
                        <div className="mt-1">
                          {appointment.patientProfile.medicalHistory.allergies && appointment.patientProfile.medicalHistory.allergies.length > 0 ? (
                            appointment.patientProfile.medicalHistory.allergies.map((allergy, index) => (
                              <span key={index} className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-xs mr-1 mb-1">
                                {allergy}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500">None reported</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">Conditions:</span>
                        <div className="mt-1">
                          {appointment.patientProfile.medicalHistory.conditions && appointment.patientProfile.medicalHistory.conditions.length > 0 ? (
                            appointment.patientProfile.medicalHistory.conditions.map((condition, index) => (
                              <span key={index} className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs mr-1 mb-1">
                                {condition}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500">None reported</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">Medications:</span>
                        <div className="mt-1">
                          {appointment.patientProfile.medicalHistory.medications && appointment.patientProfile.medicalHistory.medications.length > 0 ? (
                            appointment.patientProfile.medicalHistory.medications.map((medication, index) => (
                              <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-1 mb-1">
                                {medication}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500">None reported</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Symptoms and Notes */}
        {appointment.symptoms && (
          <div className="mt-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
            <p className="text-sm text-orange-800">
              <strong>Current Symptoms:</strong> {appointment.symptoms}
            </p>
          </div>
        )}
        
        {appointment.notes && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <p className="text-sm text-blue-700">
              <strong>Notes:</strong> {appointment.notes}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <DoctorLayout title="Appointments">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout title="Appointments">
      <div className="space-y-6">
        {/* Tab Navbar */}
        <div className="flex space-x-4 mb-4">
          <button
            className={`px-4 py-2 rounded-lg font-semibold focus:outline-none transition-colors ${activeTab === 'new' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('new')}
          >
            New Appointments
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold focus:outline-none transition-colors ${activeTab === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed Appointments
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold focus:outline-none transition-colors ${activeTab === 'cancelled' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('cancelled')}
          >
            Cancelled Appointments
          </button>
        </div>

        {/* Error Message */}
        {(error || hookError) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center"
          >
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="text-sm">{error || hookError}</span>
          </motion.div>
        )}

        {/* Appointments List by Tab */}
        {activeTab === 'new' && (
          <div className="space-y-4">
            {newAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No new appointments</h3>
                <p className="text-gray-600">You don't have any new appointments scheduled.</p>
              </div>
            ) : (
              newAppointments.map((appointment) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Patient Info */}
                    {renderPatientInfo(appointment)}

                    {/* Appointment Details */}
                    <div className="lg:text-right lg:min-w-[200px]">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            {appointment.date?.toDate ? 
                              appointment.date.toDate().toLocaleDateString() : 
                              new Date(appointment.date).toLocaleDateString()
                            }
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">{appointment.timeSlot}</span>
                        </div>
                        {appointment.timingSlot && (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">Timing: {appointment.timingSlot}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(appointment.type)}
                          <span className="text-sm font-medium capitalize">{appointment.type}</span>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 lg:ml-4 lg:min-w-[150px]">
                      {/* Join Meeting Button for Online Appointments */}
                      {appointment.type === 'online' && (appointment.status === 'scheduled' || appointment.status === 'in-progress') && (
                        <button
                          onClick={() => joinMeeting(appointment)}
                          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center justify-center space-x-2"
                        >
                          <Video className="w-4 h-4" />
                          <ExternalLink className="w-4 h-4" />
                          <span>{appointment.status === 'in-progress' ? 'Rejoin Meeting' : 'Join Meeting'}</span>
                        </button>
                      )}
                      
                      {/* Complete button for online (in-progress) and in-person (scheduled) */}
                      {((appointment.type === 'online' && appointment.status === 'in-progress') || (appointment.type === 'in-person' && appointment.status === 'scheduled')) && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                          className="px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm flex items-center justify-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Complete</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          const notes = prompt('Add notes for this appointment:', appointment.notes || '');
                          if (notes !== null) {
                            addNotes(appointment.id, notes);
                          }
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center space-x-2"
                      >
                        <span>{appointment.notes ? 'Edit Notes' : 'Add Notes'}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
        {activeTab === 'completed' && (
          <div className="space-y-4">
            {completedAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No completed appointments</h3>
                <p className="text-gray-600">No appointments have been completed yet.</p>
              </div>
            ) : (
              completedAppointments.map((appointment) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Patient Info */}
                    {renderPatientInfo(appointment)}

                    {/* Appointment Details */}
                    <div className="lg:text-right lg:min-w-[200px]">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            {appointment.date?.toDate ? 
                              appointment.date.toDate().toLocaleDateString() : 
                              new Date(appointment.date).toLocaleDateString()
                            }
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">{appointment.timeSlot}</span>
                        </div>
                        {appointment.timingSlot && (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">Timing: {appointment.timingSlot}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(appointment.type)}
                          <span className="text-sm font-medium capitalize">{appointment.type}</span>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 lg:ml-4 lg:min-w-[150px]">
                      <button
                        onClick={() => {
                          const notes = prompt('Add notes for this appointment:', appointment.notes || '');
                          if (notes !== null) {
                            addNotes(appointment.id, notes);
                          }
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center space-x-2"
                      >
                        <span>{appointment.notes ? 'Edit Notes' : 'Add Notes'}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
        {activeTab === 'cancelled' && (
          <div className="space-y-4">
            {cancelledAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No cancelled appointments</h3>
                <p className="text-gray-600">No appointments have been cancelled yet.</p>
              </div>
            ) : (
              cancelledAppointments.map((appointment) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Patient Info */}
                    {renderPatientInfo(appointment)}

                    {/* Appointment Details */}
                    <div className="lg:text-right lg:min-w-[200px]">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            {appointment.date?.toDate ? 
                              appointment.date.toDate().toLocaleDateString() : 
                              new Date(appointment.date).toLocaleDateString()
                            }
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">{appointment.timeSlot}</span>
                        </div>
                        {appointment.timingSlot && (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">Timing: {appointment.timingSlot}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(appointment.type)}
                          <span className="text-sm font-medium capitalize">{appointment.type}</span>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 lg:ml-4 lg:min-w-[150px]">
                      <button
                        onClick={() => {
                          const notes = prompt('Add notes for this appointment:', appointment.notes || '');
                          if (notes !== null) {
                            addNotes(appointment.id, notes);
                          }
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center space-x-2"
                      >
                        <span>{appointment.notes ? 'Edit Notes' : 'Add Notes'}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </DoctorLayout>
  );
};

export default Appointments;