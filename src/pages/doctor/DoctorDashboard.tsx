import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Video, Clock, TrendingUp, CheckCircle, AlertCircle, Activity, Heart, ArrowUp, ArrowDown } from 'lucide-react';
import { useDoctorAuth } from '../../contexts/DoctorAuthContext';
import { useAppointmentCounts } from '../../hooks/useAppointmentCounts';
import DoctorLayout from '../../components/doctor/DoctorLayout';
import { Line, Doughnut } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard: React.FC = () => {
  const { doctorUser } = useDoctorAuth();
  const { appointments, counts, loading, error: hookError } = useAppointmentCounts();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Helper to robustly get a date string from Firestore Timestamp, string, Date, or undefined
  const getDateString = (dateValue: any) => {
    if (!dateValue) return null;
    if (typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toDateString();
    }
    try {
      return new Date(dateValue).toDateString();
    } catch {
      return null;
    }
  };

  const today = new Date().toDateString();
  const todaysAppointments = appointments
    .filter(apt => getDateString(apt.date) === today)
    .sort((a, b) => {
      const aTime = a.timeSlot || (a.date && new Date(a.date).getTime()) || 0;
      const bTime = b.timeSlot || (b.date && new Date(b.date).getTime()) || 0;
      return aTime - bTime;
    });

  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  
  const appointmentTrendsData = {
    labels: daysOfWeek.map(d => d.toLocaleDateString('en-US', { weekday: 'short' })),
    datasets: [
      {
        label: 'Appointments',
        data: daysOfWeek.map(day =>
          appointments.filter(apt => getDateString(apt.date) === day.toDateString()).length
        ),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ],
  };

  const typeCounts: Record<string, number> = {};
  appointments.forEach(apt => {
    const type = apt.type || 'Unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  const patientTypeData = {
    labels: Object.keys(typeCounts),
    datasets: [
      {
        data: Object.values(typeCounts),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const statCards = [
    {
      title: 'Today\'s Appointments',
      value: counts.today,
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Total Patients',
      value: new Set(appointments.map(apt => apt.patientId)).size,
      icon: Users,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Online Consultations',
      value: appointments.filter(apt => apt.type === 'online').length,
      icon: Video,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      change: '+23%',
      changeType: 'positive'
    },
    {
      title: 'Completed Today',
      value: counts.completed,
      icon: CheckCircle,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
      change: '+5%',
      changeType: 'positive'
    }
  ];

  if (loading) {
    return (
      <DoctorLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout title="Dashboard">
      <div className="space-y-8">
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

        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                  Welcome back, Dr. {doctorUser?.name}!
                </h2>
                <p className="text-blue-100 text-lg">
                  You have {counts.today} appointments scheduled for today.
                </p>
                <div className="flex flex-wrap items-center gap-6 mt-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-blue-200" />
                    <span className="text-blue-100">Status: Active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-red-300" />
                    <span className="text-blue-100">Specialization: {doctorUser?.specialization}</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                  <Users className="w-16 h-16 text-white/80" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`${card.bgColor} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`bg-gradient-to-r ${card.color} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center space-x-1 text-xs font-semibold px-2 py-1 rounded-full ${
                  card.changeType === 'positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {card.changeType === 'positive' ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                  <span>{card.change}</span>
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts and Schedule */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Appointment Trends */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Weekly Appointment Trends</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Appointments</span>
              </div>
            </div>
            <div className="h-64">
              <Line 
                data={appointmentTrendsData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                      },
                    },
                    x: {
                      grid: {
                        display: false,
                      },
                    },
                  },
                }}
              />
            </div>
          </motion.div>

          {/* Patient Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">Patient Types</h3>
            <div className="h-64 flex justify-center">
              <Doughnut 
                data={patientTypeData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                  },
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Today's Schedule and Quick Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Today's Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Today's Schedule</h3>
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <div className="space-y-4">
              {todaysAppointments.length === 0 ? (
                <div className="text-gray-500 text-center">No appointments scheduled for today.</div>
              ) : (
                todaysAppointments.map((appointment, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900">{appointment.patientName || appointment.patientId}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          appointment.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {appointment.status || 'upcoming'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{appointment.type || 'Consultation'}</p>
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {appointment.timeSlot || (appointment.date ? new Date(appointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                { icon: Calendar, label: 'View All Appointments', color: 'bg-blue-500', path: '/doctor/appointments' },
                { icon: Clock, label: 'Manage Time Slots', color: 'bg-green-500', path: '/doctor/slots' },
                { icon: Video, label: 'Start Online Consultation', color: 'bg-purple-500', path: '/doctor/consult' },
                { icon: Users, label: 'Update Profile', color: 'bg-teal-500', path: '/doctor/profile' }
              ].map((action, index) => (
                <button
                  key={index}
                  className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group text-left w-full"
                  onClick={() => navigate(action.path)}
                  type="button"
                >
                  <div className={`${action.color} p-3 rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-900 group-hover:text-gray-700">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorDashboard;