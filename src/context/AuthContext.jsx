```jsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Refs for the idle timer
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Fetch user data from Firestore
  const fetchUserData = useCallback(async (user) => {
    if (!user) return null;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          role: data.role || 'client',
          status: data.status || 'unverified',
          companyId: data.companyId || null,
        };
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
    // Defaults if document missing or error
    return { role: 'client', status: 'unverified', companyId: null };
  }, []);

  // Handle authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userData = await fetchUserData(user);
        setUserRole(userData.role);
        setUserStatus(userData.status);
        setCompanyId(userData.companyId);
      } else {
        setUserRole(null);
        setUserStatus(null);
        setCompanyId(null);
      }
      setLoading(false);
      // Reset idle timer when auth state changes
      lastActivityRef.current = Date.now();
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);

  // Reset the inactivity timer
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Listen for user activity to reset timer
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [resetTimer]);

  // Check for session timeout every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentUser && Date.now() - lastActivityRef.current > SESSION_TIMEOUT) {
        // Auto logout after 30 min of inactivity
        signOut(auth).catch(console.error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const value = {
    currentUser,
    userRole,
    userStatus,
    loading,
    companyId,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for consuming AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
```
