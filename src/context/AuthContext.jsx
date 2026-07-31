import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

const SESSION_TIMEOUT = 30 * 60 * 1000;

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);

  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const fetchUserData = useCallback(async (user) => {
    if (!user) return null;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          role: data.role || null,
          status: data.status || 'unverified',
          companyId: data.companyId || null,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userData = await fetchUserData(user);
        if (userData) {
          setUserRole(userData.role);
          setUserStatus(userData.status);
          setCompanyId(userData.companyId);
        } else {
          // Could not fetch user data, sign out
          await signOut(auth);
          setCurrentUser(null);
          setUserRole(null);
          setUserStatus(null);
          setCompanyId(null);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setUserStatus(null);
        setCompanyId(null);
      }
      setLoading(false);
      lastActivityRef.current = Date.now();
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [resetTimer]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentUser && Date.now() - lastActivityRef.current > SESSION_TIMEOUT) {
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
