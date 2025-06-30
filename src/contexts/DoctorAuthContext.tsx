import React, { createContext, useContext, useState } from 'react';

interface DoctorUser {
  id: string;
  name: string;
  specialization: string;
  email: string;
}

interface DoctorAuthContextType {
  doctorUser: DoctorUser | null;
  loginDoctor: (doctor: DoctorUser) => void;
  logoutDoctor: () => void;
}

const DoctorAuthContext = createContext<DoctorAuthContextType>({
  doctorUser: null,
  loginDoctor: () => {},
  logoutDoctor: () => {}
});

export const useDoctorAuth = () => useContext(DoctorAuthContext);

export const DoctorAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [doctorUser, setDoctorUser] = useState<DoctorUser | null>(() => {
    const saved = localStorage.getItem('doctorUser');
    return saved ? JSON.parse(saved) : null;
  });

  const loginDoctor = (doctor: DoctorUser) => {
    setDoctorUser(doctor);
    localStorage.setItem('doctorUser', JSON.stringify(doctor));
  };

  const logoutDoctor = () => {
    setDoctorUser(null);
    localStorage.removeItem('doctorUser');
  };

  const value = {
    doctorUser,
    loginDoctor,
    logoutDoctor
  };

  return (
    <DoctorAuthContext.Provider value={value}>
      {children}
    </DoctorAuthContext.Provider>
  );
};