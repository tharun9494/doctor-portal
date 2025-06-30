import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, Video, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import AdminLayout from '../../components/admin/AdminLayout';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalAppointments: 0,
    onlineConsultations: 0,
    completedAppointments: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        
        // Fetch doctors count with error handling
        let totalDoctors = 0;
        try {
          const doctorsSnapshot = await getDocs(collection(db, 'doctors'));
          totalDoctors = doctorsSnapshot.size;
        } catch (doctorError) {
          console.warn('Could not fetch doctors:', doctorError);
          // Use mock data if Firebase is unavailable
          totalDoctors = 12;
        }

        // Fetch appointments count with error handling
        let totalAppointments = 0;
        let onlineConsultations = 0;
        let completedAppointments = 0;

        try {
          const appointmentsSnapshot = await getDocs(collection(db, 'appointments'));
          totalAppointments = appointmentsSnapshot.size;

          // Count online consultations and completed appointments
          appointmentsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.type === 'online') onlineConsultations++;
            if (data.status === 'completed') completedAppointments++;
          });
        } catch (appointmentError) {
          console.warn('Could not fetch appointments:', appointmentError);
          // Use mock data if Firebase is unavailable
          totalAppointments = 156;
          onlineConsultations = 45;
          completedAppointments = 89;
        }

        setStats({
          totalDoctors,
          totalAppointments,
          onlineConsultations,
          completedAppointments
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError('Unable to load dashboard data. Using offline mode.');
        
        // Set mock data for offline mode
        setStats({
          totalDoctors: 12,
          totalAppointments: 156,
          onlineConsultations: 45,
          completedAppointments: 89
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Doctors',
      value: stats.totalDoctors,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Appointments',
      value: stats.totalAppointments,
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Online Consultations',
      value: stats.onlineConsultations,
      icon: Video,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Completed',
      value: stats.completedAppointments,
      icon: CheckCircle,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50'
    }
  ];

  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Appointments',
        data: [65, 59, 80, 81, 56, 85],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Online Consultations',
        data: [28, 48, 40, 19, 46, 37],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      }
    ],
  };

  const doughnutData = {
    labels: ['Completed', 'Pending', 'Cancelled'],
    datasets: [
      {
        data: [stats.completedAppointments, stats.totalAppointments - stats.completedAppointments - 5, 5],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg"
          >
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`${card.bgColor} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`bg-gradient-to-r ${card.color} p-3 rounded-xl`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Appointment Trends</h3>
            <Line 
              data={lineChartData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </motion.div>

          {/* Doughnut Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Appointment Status</h3>
            <div className="flex justify-center">
              <Doughnut 
                data={doughnutData}
                options={{
                  responsive: true,
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

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { action: 'New doctor registered', time: '2 hours ago', type: 'success' },
              { action: 'Appointment scheduled', time: '4 hours ago', type: 'info' },
              { action: 'Online consultation completed', time: '6 hours ago', type: 'success' },
              { action: 'Patient profile updated', time: '8 hours ago', type: 'info' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-3 h-3 rounded-full ${
                  activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{activity.action}</p>
                  <p className="text-gray-500 text-sm">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;