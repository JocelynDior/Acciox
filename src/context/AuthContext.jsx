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
  const [agentRole, setAgentRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const broadcastChannelRef = useRef(null);

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
          agentRole: data.agentRole || null,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }, []);

  // BroadcastChannel for cross-tab state sync
  useEffect(() => {
    const channel = new BroadcastChannel('acciox_auth');
    broadcastChannelRef.current = channel;

    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'AUTH_STATE_UPDATE') {
        setCurrentUser(payload.currentUser);
        setUserRole(payload.userRole);
        setUserStatus(payload.userStatus);
        setCompanyId(payload.companyId);
        setAgentRole(payload.agentRole);
        setLoading(payload.loading);
        lastActivityRef.current = Date.now();
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  // Broadcast state changes to other tabs
  const broadcastState = useCallback(() => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'AUTH_STATE_UPDATE',
        payload: {
          currentUser,
          userRole,
          userStatus,
          companyId,
          agentRole,
          loading,
        },
      });
    }
  }, [currentUser, userRole, userStatus, companyId, agentRole, loading]);

  // Broadcast whenever auth state changes
  useEffect(() => {
    broadcastState();
  }, [broadcastState]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userData = await fetchUserData(user);
        if (userData) {
          setUserRole(userData.role);
          setUserStatus(userData.status);
          setCompanyId(userData.companyId);
          setAgentRole(userData.agentRole);
        } else {
          // Could not fetch user data, sign out
          await signOut(auth);
          setCurrentUser(null);
          setUserRole(null);
          setUserStatus(null);
          setCompanyId(null);
          setAgentRole(null);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setUserStatus(null);
        setCompanyId(null);
        setAgentRole(null);
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
    agentRole,
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
