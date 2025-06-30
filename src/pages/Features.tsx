import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, BarChart3, Shield, Smartphone, Bell, 
  FileText, Users, Video, Calendar, MapPin, 
  Zap, Heart 
} from 'lucide-react';

const Features: React.FC = () => {
  const realTimeFeatures = [
    {
      icon: Clock,
      title: 'Real-Time Queue Updates',
      description: 'Get live updates on waiting times and queue positions'
    },
    {
      icon: Bell,
      title: 'Instant Notifications',
      description: 'Receive immediate alerts for appointments and updates'
    },
    {
      icon: MapPin,
      title: 'Live Doctor Tracking',
      description: 'Track doctor availability and location in real-time'
    },
    {
      icon: Zap,
      title: 'Quick Response System',
      description: 'Emergency alerts and rapid response coordination'
    }
  ];

  const analyticsFeatures = [
    {
      icon: BarChart3,
      title: 'Healthcare Analytics',
      description: 'Comprehensive insights into patient flow and doctor performance'
    },
    {
      icon: FileText,
      title: 'Patient Data Management',
      description: 'Secure storage and easy access to medical records'
    },
    {
      icon: Users,
      title: 'Population Health Insights',
      description: 'Track health trends and outcomes across patient populations'
    },
    {
      icon: Heart,
      title: 'Health Monitoring',
      description: 'Continuous monitoring of vital health metrics'
    }
  ];

  const doctorFeatures = [
    {
      title: 'Doctor Availability System',
      description: 'Real-time status updates showing when doctors are available for consultations',
      icon: Users,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Smart Scheduling',
      description: 'AI-powered scheduling that optimizes doctor time and patient wait times',
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Video Consultation Platform',
      description: 'High-quality, secure video calls with screen sharing and digital prescriptions',
      icon: Video,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Mobile-First Design',
      description: 'Fully responsive platform optimized for smartphones and tablets',
      icon: Smartphone,
      color: 'from-orange-500 to-red-500'
    }
  ];

  const securityFeatures = [
    'HIPAA Compliant Infrastructure',
    'End-to-End Data Encryption',
    'Multi-Factor Authentication',
    'Regular Security Audits',
    'Secure Cloud Storage',
    'Access Control Management'
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
              Advanced <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">Features</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the cutting-edge technology and innovative features that make 
              MediConnect the future of healthcare management.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Real-Time Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Real-Time Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience healthcare with instant updates and real-time connectivity
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {realTimeFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 group hover:scale-105"
              >
                <div className="bg-gradient-to-r from-blue-600 to-teal-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Core Platform Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful tools designed to transform healthcare delivery
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {doctorFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 group"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`bg-gradient-to-r ${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Advanced Analytics & Insights
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Make data-driven decisions with comprehensive analytics and reporting tools 
                that provide deep insights into healthcare operations.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {analyticsFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <div className="bg-gradient-to-r from-blue-600 to-teal-600 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-600/10 to-teal-600/10 rounded-3xl p-8">
                <img
                  src="https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Analytics dashboard"
                  className="rounded-2xl shadow-2xl w-full"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-600">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Enterprise-Grade Security
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Your healthcare data is protected with the highest security standards 
              and compliance measures in the industry.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 flex items-center space-x-3 hover:bg-white/20 transition-colors duration-300"
              >
                <Shield className="w-6 h-6 text-white flex-shrink-0" />
                <span className="text-white font-medium">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;