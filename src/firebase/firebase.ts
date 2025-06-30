import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Connection state management
let isConnected = true;
let connectionAttempts = 0;
const maxConnectionAttempts = 3;

// Initialize Firestore connection with retry logic
const initializeFirestore = async () => {
  try {
    await enableNetwork(db);
    isConnected = true;
    connectionAttempts = 0;
    console.log('Firebase connected successfully');
  } catch (error) {
    console.warn('Firebase connection issue:', error);
    isConnected = false;
    
    // Retry connection with exponential backoff
    if (connectionAttempts < maxConnectionAttempts) {
      connectionAttempts++;
      const delay = Math.pow(2, connectionAttempts) * 1000; // 2s, 4s, 8s
      
      setTimeout(async () => {
        try {
          await enableNetwork(db);
          isConnected = true;
          connectionAttempts = 0;
          console.log('Firebase reconnected successfully');
        } catch (retryError) {
          console.error('Failed to reconnect to Firebase:', retryError);
          if (connectionAttempts >= maxConnectionAttempts) {
            console.log('Max connection attempts reached. Operating in offline mode.');
          }
        }
      }, delay);
    }
  }
};

// Initialize Firestore connection
initializeFirestore();

// Handle online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    try {
      await enableNetwork(db);
      isConnected = true;
      connectionAttempts = 0;
      console.log('Network restored, Firebase reconnected');
    } catch (error) {
      console.error('Failed to reconnect Firebase after network restore:', error);
      isConnected = false;
    }
  });

  window.addEventListener('offline', async () => {
    try {
      await disableNetwork(db);
      isConnected = false;
      console.log('Network lost, Firebase offline mode enabled');
    } catch (error) {
      console.error('Failed to enable Firebase offline mode:', error);
    }
  });
}

// Export connection status checker
export const isFirebaseConnected = () => isConnected;

export default app;