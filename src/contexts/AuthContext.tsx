import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth, db, isFirebaseConnected } from '../firebase/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  userRole: string | null;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userRole: null,
  loading: true,
  error: null,
  isOffline: false,
  logout: async () => {},
  clearError: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setError(null);
      
      if (user) {
        try {
          // Check connection status
          const connected = isFirebaseConnected();
          setIsOffline(!connected);
          
          if (connected) {
            // Try to get admin document from server first, then cache
            let adminDoc;
            try {
              adminDoc = await getDoc(doc(db, 'admins', user.uid));
            } catch (serverError) {
              // Fallback to cache if server fails
              adminDoc = await getDoc(doc(db, 'admins', user.uid), { source: 'cache' });
            }
            
            if (adminDoc.exists()) {
              setUserRole('admin');
            } else {
              setUserRole(null);
            }
          } else {
            // Offline mode - try cache only
            try {
              const adminDoc = await getDoc(doc(db, 'admins', user.uid), { source: 'cache' });
              if (adminDoc.exists()) {
                setUserRole('admin');
              } else {
                setUserRole(null);
              }
            } catch (cacheError) {
              console.warn('No cached admin data available');
              setUserRole(null);
              setError('Operating in offline mode. Some features may be limited.');
            }
          }
        } catch (error: any) {
          console.error('Error checking user role:', error);
          setIsOffline(true);
          
          if (error.code === 'unavailable' || error.message?.includes('offline')) {
            setError('Connection lost. Operating in offline mode.');
          } else {
            setError('Failed to verify user permissions. Please try again.');
          }
          setUserRole(null);
        }
      } else {
        setUserRole(null);
        setIsOffline(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserRole(null);
      setError(null);
      setIsOffline(false);
    } catch (error: any) {
      console.error('Logout error:', error);
      setError('Failed to logout. Please try again.');
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    currentUser,
    userRole,
    loading,
    error,
    isOffline,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};