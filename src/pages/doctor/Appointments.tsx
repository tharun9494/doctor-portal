import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Video, MapPin, Phone, Mail, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db, isFirebaseConnected } from '../../firebase/firebase';
import { useDoctorAuth } from '../../contexts/DoctorAuthContext';
import DoctorLayout from '../../components/doctor/DoctorLayout';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: any;
  timeSlot: string;
  timingSlot: string;
  type: 'in-person' | 'online';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  symptoms?: string;
  notes?: string;
  doctorId: string;
}

const Appointments: React.FC = () => {
  const { doctorUser } = useDoctorAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'new' | 'completed' | 'cancelled'>('new');

  useEffect(() => {
    fetchAppointments();
  }, [doctorUser]);

  const fetchAppointments = async () => {
    if (!doctorUser) return;

    try {
      setError(null);
      setLoading(true);
      
      if (!isFirebaseConnected()) {
        setError('Unable to connect to database. Please check your internet connection.');
        setAppointments([]);
        setLoading(false);
        return;
      }

      // Query appointments for this doctor
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('doctorId', '==', doctorUser.id)
      );
      
      const querySnapshot = await getDocs(appointmentsQuery);
      const appointmentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];

      // Sort by date in memory (newest first)
      const sortedAppointments = appointmentsData.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

      setAppointments(sortedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments. Please try again.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

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
      
      // Update local state immediately for better UX
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId ? { ...apt, status: newStatus as any } : apt
      ));
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
      
      // Update local state immediately for better UX
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId ? { ...apt, notes } : apt
      ));
    } catch (error) {
      console.error('Error saving notes:', error);
      setError('Failed to save notes. Please try again.');
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = appointment.date?.toDate ? 
      appointment.date.toDate().toISOString().split('T')[0] : 
      new Date(appointment.date).toISOString().split('T')[0];
    const matchesDate = selectedDate === 'all' || appointmentDate === selectedDate;
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    return matchesDate && matchesStatus;
  });

  const newAppointments = filteredAppointments.filter(
    (appointment) => appointment.status === 'scheduled' || appointment.status === 'no-show'
  );
  const completedAppointments = filteredAppointments.filter(
    (appointment) => appointment.status === 'completed'
  );
  const cancelledAppointments = filteredAppointments.filter(
    (appointment) => appointment.status === 'cancelled'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'online' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />;
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

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Date
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Dates</option>
                <option value={new Date().toISOString().split('T')[0]}>Today</option>
                <option value={new Date(Date.now() + 86400000).toISOString().split('T')[0]}>Tomorrow</option>
                <option value={new Date(Date.now() - 86400000).toISOString().split('T')[0]}>Yesterday</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

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
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Patient Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="bg-gradient-to-r from-blue-600 to-teal-600 w-10 h-10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{appointment.patientName}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <span className="font-medium">ID:</span>
                              <span>{appointment.patientId}</span>
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
                        </div>
                      </div>
                      
                      {appointment.symptoms && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Symptoms:</strong> {appointment.symptoms}
                          </p>
                        </div>
                      )}
                      
                      {appointment.notes && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">
                            <strong>Notes:</strong> {appointment.notes}
                          </p>
                        </div>
                      )}    
                    </div>

                    {/* Appointment Details */}
                    <div className="lg:text-right">
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
                    <div className="flex flex-col space-y-2 lg:ml-4">
                      {appointment.status === 'scheduled' && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                          className="px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Complete</span>
                        </button>
                      )}
                      
                      {appointment.type === 'online' && appointment.status === 'scheduled' && (
                        <button className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                          <Video className="w-4 h-4" />
                          <span>Start Call</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          const notes = prompt('Add notes for this appointment:', appointment.notes || '');
                          if (notes !== null) {
                            addNotes(appointment.id, notes);
                          }
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        {appointment.notes ? 'Edit Notes' : 'Add Notes'}
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
                <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Patient Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="bg-gradient-to-r from-blue-600 to-teal-600 w-10 h-10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{appointment.patientName}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <span className="font-medium">ID:</span>
                              <span>{appointment.patientId}</span>
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
                        </div>
                      </div>
                      
                      {appointment.symptoms && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Symptoms:</strong> {appointment.symptoms}
                          </p>
                        </div>
                      )}
                      
                      {appointment.notes && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">
                            <strong>Notes:</strong> {appointment.notes}
                          </p>
                        </div>
                      )}    
                    </div>

                    {/* Appointment Details */}
                    <div className="lg:text-right">
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
                    <div className="flex flex-col space-y-2 lg:ml-4">
                      {appointment.status === 'scheduled' && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                          className="px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Complete</span>
                        </button>
                      )}
                      
                      {appointment.type === 'online' && appointment.status === 'scheduled' && (
                        <button className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                          <Video className="w-4 h-4" />
                          <span>Start Call</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          const notes = prompt('Add notes for this appointment:', appointment.notes || '');
                          if (notes !== null) {
                            addNotes(appointment.id, notes);
                          }
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        {appointment.notes ? 'Edit Notes' : 'Add Notes'}
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
                <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Patient Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="bg-gradient-to-r from-blue-600 to-teal-600 w-10 h-10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{appointment.patientName}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <span className="font-medium">ID:</span>
                              <span>{appointment.patientId}</span>
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
                        </div>
                      </div>
                      
                      {appointment.symptoms && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Symptoms:</strong> {appointment.symptoms}
                          </p>
                        </div>
                      )}
                      
                      {appointment.notes && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">
                            <strong>Notes:</strong> {appointment.notes}
                          </p>
                        </div>
                      )}    
                    </div>

                    {/* Appointment Details */}
                    <div className="lg:text-right">
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
                    <div className="flex flex-col space-y-2 lg:ml-4">
                      {appointment.status === 'scheduled' && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                          className="px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Complete</span>
                        </button>
                      )}
                      
                      {appointment.type === 'online' && appointment.status === 'scheduled' && (
                        <button className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                          <Video className="w-4 h-4" />
                          <span>Start Call</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          const notes = prompt('Add notes for this appointment:', appointment.notes || '');
                          if (notes !== null) {
                            addNotes(appointment.id, notes);
                          }
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        {appointment.notes ? 'Edit Notes' : 'Add Notes'}
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