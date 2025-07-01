import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConnected } from '../firebase/firebase';
import { useDoctorAuth } from '../contexts/DoctorAuthContext';

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
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show' | 'in-progress';
  symptoms?: string;
  notes?: string;
  doctorId: string;
}

interface AppointmentCounts {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  noShow: number;
  today: number;
  pending: number;
  notifications: number;
}

export const useAppointmentCounts = () => {
  const { doctorUser } = useDoctorAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [counts, setCounts] = useState<AppointmentCounts>({
    total: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
    today: 0,
    pending: 0,
    notifications: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!doctorUser) {
      setAppointments([]);
      setCounts({
        total: 0,
        scheduled: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        today: 0,
        pending: 0,
        notifications: 0
      });
      setLoading(false);
      return;
    }

    const fetchAppointments = async () => {
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

        setAppointments(appointmentsData);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setError('Failed to load appointments. Please try again.');
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();

    // Set up real-time listener for appointment updates
    if (isFirebaseConnected()) {
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('doctorId', '==', doctorUser.id)
      );

      const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
        const appointmentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Appointment[];
        
        setAppointments(appointmentsData);
      }, (error) => {
        console.error('Error listening to appointments:', error);
      });

      return () => unsubscribe();
    }
  }, [doctorUser]);

  useEffect(() => {
    if (!appointments.length) {
      setCounts({
        total: 0,
        scheduled: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        today: 0,
        pending: 0,
        notifications: 0
      });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const counts = appointments.reduce((acc, appointment) => {
      const appointmentDate = appointment.date?.toDate ? appointment.date.toDate() : new Date(appointment.date);
      const isToday = appointmentDate >= today && appointmentDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);

      acc.total++;
      
      switch (appointment.status) {
        case 'scheduled':
          acc.scheduled++;
          if (isToday) acc.today++;
          acc.pending++;
          break;
        case 'in-progress':
          acc.inProgress++;
          if (isToday) acc.today++;
          acc.pending++;
          break;
        case 'completed':
          acc.completed++;
          break;
        case 'cancelled':
          acc.cancelled++;
          break;
        case 'no-show':
          acc.noShow++;
          break;
      }

      // Count notifications (scheduled appointments for today and upcoming)
      if (appointment.status === 'scheduled' && isToday) {
        acc.notifications++;
      }

      return acc;
    }, {
      total: 0,
      scheduled: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      today: 0,
      pending: 0,
      notifications: 0
    });

    setCounts(counts);
  }, [appointments]);

  return {
    appointments,
    counts,
    loading,
    error
  };
}; 