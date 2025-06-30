import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Video, Users, Clock, FileText, Bell, Shield, Smartphone } from 'lucide-react';

const Services: React.FC = () => {
  const services = [
    {
      icon: Calendar,
      title: 'Smart Appointment Booking',
      description: 'Book appointments with your preferred doctors based on availability, specialization, and location. Our intelligent system suggests the best time slots.',
      features: ['Real-time doctor availability', 'Automated reminders', 'Easy rescheduling', 'Multi-language support']
    },
    {
      icon: Video,
      title: 'Virtual Video Consultations',
      description: 'Connect with healthcare professionals through secure, high-quality video calls from the comfort of your home.',
      features: ['HD video quality', 'Screen sharing', 'Digital prescriptions', 'Session recordings']
    },
    {
      icon: Users,
      title: 'Hospital Queue Management',
      description: 'Eliminate waiting rooms with our smart queue system. Get real-time updates on your position and estimated wait time.',
      features: ['Live queue tracking', 'SMS notifications', 'Priority queuing', 'No-show management']
    },
    {
      icon: FileText,
      title: 'Digital Health Records',
      description: 'Secure, centralized storage of all your medical records, accessible anytime, anywhere with proper authentication.',
      features: ['Cloud storage', 'Easy sharing', 'Version control', 'Backup & restore']
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Stay informed with intelligent notifications about appointments, medication reminders, and health tips.',
      features: ['Appointment alerts', 'Medication reminders', 'Health tips', 'Emergency notifications']
    },
    {
      icon: Shield,
      title: 'Data Security & Privacy',
      description: 'Your health data is protected with enterprise-grade security measures and HIPAA compliance.',
      features: ['End-to-end encryption', 'HIPAA compliant', 'Regular audits', 'Access controls']
    }
  ];

  return (
    <div className="pt-20">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-blue-50 to-teal-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Our <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">Services</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive healthcare solutions designed to make medical care more accessible, 
              efficient, and patient-centered.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 group"
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-r from-blue-600 to-teal-600 w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <service.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {service.description}
                    </p>
                    <ul className="space-y-2">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-gray-700">
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full mr-3"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Getting started with MediConnect is simple and straightforward
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Register & Verify',
                description: 'Create your account and verify your identity for secure access to our platform.',
                icon: Smartphone
              },
              {
                step: '2',
                title: 'Book Appointment',
                description: 'Search for doctors, check availability, and book appointments that fit your schedule.',
                icon: Calendar
              },
              {
                step: '3',
                title: 'Connect & Consult',
                description: 'Meet your doctor virtually or in-person, receive care, and manage follow-ups.',
                icon: Video
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="relative mb-6">
                  <div className="bg-gradient-to-r from-blue-600 to-teal-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                    <item.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-white w-8 h-8 rounded-full flex items-center justify-center text-blue-600 font-bold border-2 border-blue-600">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;