import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Calendar, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, isFirebaseConnected } from '../../firebase/firebase';
import { useDoctorAuth } from '../../contexts/DoctorAuthContext';
import DoctorLayout from '../../components/doctor/DoctorLayout';

interface Consultation {
  id: string;
  patientName: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  joinUrl?: string;
}

const OnlineConsultations: React.FC = () => {
  const { doctorUser } = useDoctorAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for offline mode
  const mockConsultations: Consultation[] = [
    {
      id: '1',
      patientName: 'John Doe',
      date: '2024-06-10',
      time: '10:00 AM',
      status: 'upcoming',
      joinUrl: '#'
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      date: '2024-06-09',
      time: '2:00 PM',
      status: 'completed',
      joinUrl: '#'
    },
    {
      id: '3',
      patientName: 'Alice Brown',
      date: '2024-06-08',
      time: '11:30 AM',
      status: 'cancelled',
      joinUrl: '#'
    }
  ];

  useEffect(() => {
    fetchConsultations();
    // eslint-disable-next-line
  }, [doctorUser]);

  const fetchConsultations = async () => {
    if (!doctorUser) return;
    setLoading(true);
    setError(null);
    try {
      if (!isFirebaseConnected()) {
        setConsultations(mockConsultations);
        setError('Offline mode: showing sample data.');
        setLoading(false);
        return;
      }
      const q = query(
        collection(db, 'appointments'),
        where('doctorId', '==', doctorUser.id),
        where('type', '==', 'online')
      );
      const querySnapshot = await getDocs(q);
      const data: Consultation[] = querySnapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          patientName: d.patientName || 'Unknown',
          date: d.date ? d.date.toDate().toISOString().split('T')[0] : '',
          time: d.time || '',
          status: d.status || 'upcoming',
          joinUrl: d.joinUrl || '#'
        };
      });
      setConsultations(data);
    } catch (err) {
      console.error('Error fetching consultations:', err);
      setError('Unable to load consultations. Showing sample data.');
      setConsultations(mockConsultations);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DoctorLayout title="Online Consultations">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-3 mb-4">
          <Video className="w-7 h-7 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Online Consultations</h2>
        </div>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4"
          >
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-600 text-sm">
                <th className="py-2">Patient</th>
                <th className="py-2">Date</th>
                <th className="py-2">Time</th>
                <th className="py-2">Status</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {consultations.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">No online consultations found.</td>
                </tr>
              )}
              {consultations.map((c) => (
                <tr key={c.id} className="border-b last:border-b-0">
                  <td className="py-3 flex items-center space-x-2">
                    <User className="w-5 h-5 text-blue-400" />
                    <span>{c.patientName}</span>
                  </td>
                  <td className="py-3">
                    <Calendar className="inline w-4 h-4 mr-1 text-gray-400" />
                    {c.date}
                  </td>
                  <td className="py-3">
                    <Clock className="inline w-4 h-4 mr-1 text-gray-400" />
                    {c.time}
                  </td>
                  <td className="py-3">
                    {c.status === 'upcoming' && <span className="flex items-center text-blue-600"><CheckCircle className="w-4 h-4 mr-1" />Upcoming</span>}
                    {c.status === 'completed' && <span className="flex items-center text-green-600"><CheckCircle className="w-4 h-4 mr-1" />Completed</span>}
                    {c.status === 'cancelled' && <span className="flex items-center text-red-600"><XCircle className="w-4 h-4 mr-1" />Cancelled</span>}
                  </td>
                  <td className="py-3">
                    {c.status === 'upcoming' ? (
                      <a
                        href={c.joinUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                      >
                        Join
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
};

export default OnlineConsultations;