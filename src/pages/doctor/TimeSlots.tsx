import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, Edit, Trash2, Calendar, Save, X, AlertCircle } from 'lucide-react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConnected } from '../../firebase/firebase';
import { useDoctorAuth } from '../../contexts/DoctorAuthContext';
import DoctorLayout from '../../components/doctor/DoctorLayout';

interface TimeSlot {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  timingSlot: string;
  isAvailable: boolean;
  maxPatients: number;
  bookedPatients: number;
  type: 'in-person' | 'online';
  meetingLink?: string;
}

const TimeSlots: React.FC = () => {
  const { doctorUser } = useDoctorAuth();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    timingSlot: '',
    maxPatients: 1,
    type: 'in-person' as 'in-person' | 'online',
    bookedPatients: 0,
    meetingLink: '',
  });

  // Mock data for offline mode
  const mockTimeSlots: TimeSlot[] = [
    {
      id: '1',
      doctorId: doctorUser?.id || '1',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00 AM',
      endTime: '10:00 AM',
      timingSlot: 'Morning Session',
      isAvailable: true,
      maxPatients: 3,
      bookedPatients: 1,
      type: 'in-person'
    },
    {
      id: '2',
      doctorId: doctorUser?.id || '1',
      date: new Date().toISOString().split('T')[0],
      startTime: '10:30 AM',
      endTime: '11:30 AM',
      timingSlot: 'Online Consultation',
      isAvailable: true,
      maxPatients: 2,
      bookedPatients: 0,
      type: 'online',
      meetingLink: 'https://meet.google.com/abc-defg-hij'
    },
    {
      id: '3',
      doctorId: doctorUser?.id || '1',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      startTime: '02:00 PM',
      endTime: '03:00 PM',
      timingSlot: 'Afternoon Session',
      isAvailable: true,
      maxPatients: 4,
      bookedPatients: 2,
      type: 'in-person'
    },
    {
      id: '4',
      doctorId: doctorUser?.id || '1',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      startTime: '04:00 PM',
      endTime: '05:00 PM',
      timingSlot: 'Evening Online',
      isAvailable: true,
      maxPatients: 3,
      bookedPatients: 1,
      type: 'online',
      meetingLink: 'https://zoom.us/j/123456789'
    }
  ];

  // Helper functions for time format conversion
  const convertTo24Hour = (time12h: string): string => {
    if (!time12h || !time12h.includes(' ')) return '00:00';
    
    try {
      const [time, modifier] = time12h.split(' ');
      let [hours, minutes] = time.split(':');
      
      if (!hours || !minutes || !modifier) return '00:00';
      
      if (hours === '12') {
        hours = modifier === 'PM' ? '12' : '00';
      } else if (modifier === 'PM') {
        hours = (parseInt(hours) + 12).toString();
      }
      
      return `${hours.padStart(2, '0')}:${minutes}`;
    } catch (error) {
      return '00:00';
    }
  };

  const convertTo12Hour = (time24h: string): string => {
    if (!time24h || !time24h.includes(':')) return '12:00 AM';
    
    try {
      const [hours, minutes] = time24h.split(':');
      if (!hours || !minutes) return '12:00 AM';
      
      const hour = parseInt(hours);
      if (isNaN(hour)) return '12:00 AM';
      
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    } catch (error) {
      return '12:00 AM';
    }
  };

  // Calculate duration between two times
  const calculateDuration = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) return 'Invalid time';
    
    try {
      const start24 = convertTo24Hour(startTime);
      const end24 = convertTo24Hour(endTime);
      
      const [startHour, startMin] = start24.split(':').map(Number);
      const [endHour, endMin] = end24.split(':').map(Number);
      
      if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
        return 'Invalid time format';
      }
      
      let startTotal = startHour * 60 + startMin;
      let endTotal = endHour * 60 + endMin;
      
      // Handle overnight (end time is next day)
      if (endTotal < startTotal) {
        endTotal += 24 * 60;
      }
      
      const durationMinutes = endTotal - startTotal;
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      
      if (hours === 0) {
        return `${minutes} min`;
      } else if (minutes === 0) {
        return `${hours} hr`;
      } else {
        return `${hours} hr ${minutes} min`;
      }
    } catch (error) {
      return 'Invalid time format';
    }
  };

  // Function to check if a time slot is in the past
  const isSlotInPast = (slot: TimeSlot): boolean => {
    if (!slot.date || !slot.startTime) return false;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      if (slot.date < today) return true;
      
      if (slot.date === today) {
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        const slotStartTime24 = convertTo24Hour(slot.startTime);
        return slotStartTime24 < currentTime;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  };

  // Function to clean up past time slots
  const cleanupPastSlots = async (slots: TimeSlot[]) => {
    const currentSlots = slots.filter(slot => !isSlotInPast(slot));
    const pastSlots = slots.filter(slot => isSlotInPast(slot));
    
    if (pastSlots.length > 0) {
      console.log(`Removing ${pastSlots.length} past time slots`);
      await saveTimeSlots(currentSlots);
    }
    
    return currentSlots;
  };

  useEffect(() => {
    fetchTimeSlots();
  }, [doctorUser]);

  const fetchTimeSlots = async () => {
    if (!doctorUser) return;

    try {
      setError(null);
      setLoading(true);
      if (!isFirebaseConnected()) {
        setError('Operating in offline mode. Showing sample data.');
        const cleanedSlots = await cleanupPastSlots(mockTimeSlots);
        setTimeSlots(cleanedSlots);
        setLoading(false);
        return;
      }
      const doctorDoc = await getDoc(doc(db, 'doctors', doctorUser.id));
      if (doctorDoc.exists()) {
        const data = doctorDoc.data();
        const slots = data.timeSlots || [];
        const cleanedSlots = await cleanupPastSlots(slots);
        setTimeSlots(cleanedSlots);
      } else {
        setTimeSlots([]);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      setError('Unable to load time slots. Showing sample data.');
      const cleanedSlots = await cleanupPastSlots(mockTimeSlots);
      setTimeSlots(cleanedSlots);
    } finally {
      setLoading(false);
    }
  };

  // Utility to recalculate isAvailable for all slots
  const recalculateAvailability = (slots: TimeSlot[]): TimeSlot[] =>
    slots.map(slot => ({
      ...slot,
      bookedPatients: slot.bookedPatients || 0,
      maxPatients: slot.maxPatients || 1,
      isAvailable: (slot.bookedPatients || 0) < (slot.maxPatients || 1)
    }));

  // Update saveTimeSlots to always recalculate isAvailable
  const saveTimeSlots = async (newSlots: TimeSlot[]) => {
    if (!doctorUser) return;
    const recalculated = recalculateAvailability(newSlots);
    
    // Clean up any undefined values before saving to Firebase
    const cleanedSlots = recalculated.map(slot => {
      const cleanedSlot = { ...slot };
      if (cleanedSlot.meetingLink === undefined) {
        delete cleanedSlot.meetingLink;
      }
      return cleanedSlot;
    });
    
    if (!isFirebaseConnected()) {
      setTimeSlots(cleanedSlots);
      setError('Changes saved locally. Will sync when connection is restored.');
      return;
    }
    await updateDoc(doc(db, 'doctors', doctorUser.id), { timeSlots: cleanedSlots });
    setTimeSlots(cleanedSlots);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorUser) return;
    
    // Validate form data
    if (!formData.date || !formData.startTime || !formData.endTime) {
      setError('Please fill in all required fields.');
      return;
    }
    
    if (formData.maxPatients < 1 || formData.maxPatients > 10) {
      setError('Max patients must be between 1 and 10.');
      setSuccessMessage(null);
      return;
    }
    
    if (formData.type === 'online') {
      if (!formData.meetingLink.trim()) {
        setError('Meeting link is required for online slots.');
        setSuccessMessage(null);
        return;
      }
      
      // Validate URL format
      try {
        const url = new URL(formData.meetingLink);
        if (!url.protocol.startsWith('http')) {
          setError('Meeting link must be a valid URL starting with http:// or https://');
          setSuccessMessage(null);
          return;
        }
      } catch (error) {
        setError('Please enter a valid meeting link URL.');
        setSuccessMessage(null);
        return;
      }
    }
    
    // Validate that end time is after start time
    if (formData.startTime && formData.endTime) {
      const start24 = convertTo24Hour(formData.startTime);
      const end24 = convertTo24Hour(formData.endTime);
      if (start24 >= end24) {
        setError('End time must be after start time.');
        setSuccessMessage(null);
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      let newSlots: TimeSlot[];
      if (editingSlot) {
        // Edit existing slot
        newSlots = timeSlots.map(slot =>
          slot.id === editingSlot.id ? { 
            ...slot, 
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            timingSlot: formData.timingSlot,
            maxPatients: formData.maxPatients || 1,
            type: formData.type,
            bookedPatients: formData.bookedPatients || 0,
            isAvailable: (formData.bookedPatients || 0) < (formData.maxPatients || 1),
            ...(formData.type === 'online' && formData.meetingLink ? { meetingLink: formData.meetingLink } : {})
          } : slot
        );
      } else {
        // Add new slot
        const newSlot: TimeSlot = {
          id: Date.now().toString(),
          doctorId: doctorUser.id,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          timingSlot: formData.timingSlot,
          isAvailable: (formData.bookedPatients || 0) < (formData.maxPatients || 1),
          maxPatients: formData.maxPatients || 1,
          bookedPatients: formData.bookedPatients || 0,
          type: formData.type,
          ...(formData.type === 'online' && formData.meetingLink ? { meetingLink: formData.meetingLink } : {})
        };
        newSlots = [...timeSlots, newSlot];
      }
      await saveTimeSlots(newSlots);
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving time slot:', error);
      setError('Failed to save time slot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setFormData({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      timingSlot: slot.timingSlot || generateTimingSlot(slot.endTime),
      maxPatients: slot.maxPatients || 1,
      type: slot.type,
      bookedPatients: slot.bookedPatients || 0,
      meetingLink: slot.meetingLink || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (slotId: string) => {
    if (!doctorUser) return;
    if (window.confirm('Are you sure you want to delete this time slot?')) {
      try {
        const newSlots = timeSlots.filter(slot => slot.id !== slotId);
        await saveTimeSlots(newSlots);
      } catch (error) {
        console.error('Error deleting time slot:', error);
        setError('Failed to delete time slot. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      startTime: '',
      endTime: '',
      timingSlot: '',
      maxPatients: 1,
      type: 'in-person' as 'in-person' | 'online',
      bookedPatients: 0,
      meetingLink: '',
    });
    setEditingSlot(null);
  };

  const handleNewSlot = () => {
    resetForm();
    setFormData(prev => ({
      ...prev,
      date: selectedDate
    }));
    setShowModal(true);
  };

  // Remove increment logic from toggleAvailability, just toggle isAvailable manually (for admin override)
  const toggleAvailability = async (slot: TimeSlot) => {
    try {
      const newSlots = timeSlots.map(s =>
        s.id === slot.id ? { ...s, isAvailable: !s.isAvailable } : s
      );
      await saveTimeSlots(newSlots);
    } catch (error) {
      console.error('Error updating availability:', error);
      setError('Failed to update availability. Please try again.');
    }
  };

  // Add a function to increment bookedPatients for a slot (for testing/demo)
  const incrementBookedPatients = async (slot: TimeSlot) => {
    try {
      const newSlots = timeSlots.map(s =>
        s.id === slot.id
          ? { ...s, bookedPatients: s.bookedPatients + 1 }
          : s
      );
      await saveTimeSlots(newSlots);
    } catch (error) {
      console.error('Error incrementing booked patients:', error);
      setError('Failed to increment booked patients.');
    }
  };

  const filteredSlots = timeSlots.filter(slot => slot.date === selectedDate);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'online': return 'bg-blue-100 text-blue-800';
      case 'in-person': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Generate timing slot based on end time
  const generateTimingSlot = (endTime: string): string => {
    if (!endTime) return '';
    
    const end24 = convertTo24Hour(endTime);
    const [hours] = end24.split(':').map(Number);
    
    if (hours < 12) {
      return `Morning Session (Ends at ${endTime})`;
    } else if (hours < 17) {
      return `Afternoon Session (Ends at ${endTime})`;
    } else {
      return `Evening Session (Ends at ${endTime})`;
    }
  };

  // Generate time options for 12-hour format
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time24h = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const time12h = convertTo12Hour(time24h);
        options.push({ value: time12h, label: time12h });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Function to generate a sample meeting link for testing
  const generateSampleMeetingLink = () => {
    const platforms = [
      'https://meet.google.com/abc-defg-hij',
      'https://zoom.us/j/123456789',
      'https://teams.microsoft.com/l/meetup-join/123456789',
      'https://us02web.zoom.us/j/987654321'
    ];
    return platforms[Math.floor(Math.random() * platforms.length)];
  };

  // Function to copy meeting link to clipboard
  const copyMeetingLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setSuccessMessage('Meeting link copied to clipboard!');
      // Clear the success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to copy meeting link:', error);
      setError('Failed to copy meeting link to clipboard.');
    }
  };

  if (loading && timeSlots.length === 0) {
    return (
      <DoctorLayout title="Time Slots Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout title="Time Slots Management">
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center"
          >
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="text-xs">{error}</span>
          </motion.div>
        )}

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center"
          >
            <span className="text-xs">{successMessage}</span>
          </motion.div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={handleNewSlot}
            className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span className="text-sm">Add Time Slot</span>
          </button>
        </div>

        {/* Time Slots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSlots.map((slot) => (
            <motion.div
              key={slot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-2xl shadow-lg p-4 border-l-4 ${
                slot.isAvailable ? 'border-green-500' : 'border-red-500'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">
                      {slot.startTime} - {slot.endTime}
                    </span>
                    <div className="text-xs text-gray-600 mt-1">
                      Duration: {calculateDuration(slot.startTime, slot.endTime)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(slot.type)}`}>
                    {slot.type}
                  </span>
                  {slot.type === 'online' && slot.meetingLink && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Link Ready
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {slot.timingSlot && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-blue-700">Timing Slot:</span>
                      <span className="text-xs font-semibold text-blue-800">{slot.timingSlot}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium">{slot.bookedPatients}/{slot.maxPatients}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    slot.bookedPatients < slot.maxPatients ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {slot.bookedPatients < slot.maxPatients ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                {slot.type === 'online' && slot.meetingLink && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-blue-700">Meeting Link:</span>
                        <a
                          href={slot.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 underline truncate"
                          title={slot.meetingLink}
                        >
                          {slot.meetingLink.length > 30 ? `${slot.meetingLink.substring(0, 30)}...` : slot.meetingLink}
                        </a>
                      </div>
                      <button
                        onClick={() => copyMeetingLink(slot.meetingLink!)}
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                        title="Copy meeting link"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(slot)}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(slot.id)}
                    className="text-red-600 hover:text-red-800 p-1 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredSlots.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No time slots for this date</h3>
            <p className="text-sm text-gray-600 mb-4">Create your first time slot to start accepting appointments.</p>
            <button
              onClick={handleNewSlot}
              className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Add Time Slot
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-4 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingSlot ? 'Edit Time Slot' : 'Add New Time Slot'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <select
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Start Time</option>
                      {timeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <select
                      value={formData.endTime}
                      onChange={(e) => {
                        const newEndTime = e.target.value;
                        setFormData({
                          ...formData,
                          endTime: newEndTime,
                          timingSlot: generateTimingSlot(newEndTime)
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select End Time</option>
                      {timeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Timing Slot (Auto-generated from End Time)
                  </label>
                  <input
                    type="text"
                    value={formData.timingSlot}
                    onChange={(e) => setFormData({...formData, timingSlot: e.target.value})}
                    placeholder="Will be auto-generated based on end time"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Timing slot will be automatically set based on your end time selection
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Max Patients
                  </label>
                  <input
                    type="number"
                    value={formData.maxPatients || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setFormData({...formData, maxPatients: isNaN(value) ? 1 : value});
                    }}
                    min="1"
                    max="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Hidden field for bookedPatients - managed internally */}
                <input
                  type="hidden"
                  value={formData.bookedPatients || 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setFormData({...formData, bookedPatients: isNaN(value) ? 0 : value});
                  }}
                />

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Consultation Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value as 'in-person' | 'online';
                      setFormData({
                        ...formData, 
                        type: newType,
                        // Clear meeting link when switching to in-person
                        meetingLink: newType === 'in-person' ? '' : formData.meetingLink
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="in-person">In-person Only</option>
                    <option value="online">Online Only</option>
                  </select>
                </div>

                {formData.type === 'online' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Meeting Link <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        value={formData.meetingLink}
                        onChange={(e) => setFormData({...formData, meetingLink: e.target.value})}
                        placeholder="https://meet.google.com/abc-defg-hij or https://zoom.us/j/123456789"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required={formData.type === 'online'}
                      />
                      
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a valid meeting link for online consultation(google meet)
                    </p>
                  </div>
                )}

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
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Save size={16} />
                    <span className="text-xs">{loading ? 'Saving...' : editingSlot ? 'Update' : 'Create'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
};

export default TimeSlots;