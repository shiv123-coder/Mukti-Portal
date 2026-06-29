import React, { createContext, useState, ReactNode, useEffect } from "react";
import { auth, db, googleProvider } from "@/lib/firebase";
import { getDeviceId, isSessionValid } from "@/utils/device";
import { getCurrentPosition, reverseGeocode } from "@/utils/geoValidator";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithCustomToken
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  updateDoc, 
  increment, 
  arrayUnion,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { User, UserRole, WorkerType } from "@/types/auth";
import { logActivity } from "@/utils/activityLogger";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (userData: Partial<User>, password?: string) => Promise<void>;
  signInWithGoogle: (role: UserRole, accessToken: string) => Promise<any>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  addPoints: (amount: number, badgeStr?: string) => Promise<void>;
  logout: () => Promise<void>;
  syncLocation: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const cleanObject = (obj: any) => {
  const newObj = { ...obj };
  Object.keys(newObj).forEach(key => {
    if (newObj[key] === undefined) delete newObj[key];
  });
  return newObj;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // --- Vercel Reliability Hotfix: Loading Safety Timeout ---
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("Auth initialization timed out (5s). Forcing load sequence...");
        if (!import.meta.env.VITE_FIREBASE_API_KEY) {
          setInitError("Firebase Config Missing: Please add VITE_FIREBASE_API_KEY to Vercel Environment Variables.");
        }
        setLoading(false);
      }
    }, 5000);

    // Listen to Firebase Auth
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      clearTimeout(timeoutId);
      if (firebaseUser) {
        localStorage.removeItem("mukti_demo_user");
        
        const userDocRef = doc(db, "users", firebaseUser.uid);
        
        const syncUser = async () => {
          try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              const lastOtp = data.lastOtpDate ? (data.lastOtpDate as Timestamp).toDate() : null;
              
              const adminPhone = import.meta.env.VITE_ADMIN_PHONE;
              const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
              const isAdmin = Boolean((adminEmail && firebaseUser.email === adminEmail) || (adminPhone && data.phone === adminPhone));
              
              setUser({
                ...data,
                id: firebaseUser.uid,
                role: isAdmin ? "admin" : data.role,
                isDemo: false,
                lastActive: data.lastActive ? (data.lastActive as Timestamp).toDate() : new Date(),
                lastOtpDate: lastOtp,
              } as User);
            }
          } catch (err) {
            console.warn("Initial user fetch failed, trying listener...", err);
          } finally {
            setLoading(false);
          }
        };

        syncUser();

        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser(prev => prev ? { ...prev, ...data } : { ...data, id: firebaseUser.uid } as User);
          }
        }, (err) => {
          console.warn("User profile sync listener inhibited (Permission/Rule):", err.message);
        });

        return () => unsubscribeUser();
      } else if (!localStorage.getItem("mukti_demo_user") && !localStorage.getItem("mukti_google_session")) {
        setUser(null);
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  // Auto-sync location when user is loaded
  useEffect(() => {
    if (user && !user.isDemo) {
      syncLocation();
    }
  }, [user?.id]);

  async function syncLocation() {
    if (!user || user.isDemo) return;
    try {
      const pos = await getCurrentPosition();
      const city = await reverseGeocode(pos.lat, pos.lng);
      
      await updateDoc(doc(db, "users", user.id), {
        location: city,
        location_coords: { lat: pos.lat, lng: pos.lng },
        lastActive: serverTimestamp()
      });
      
      setUser(prev => prev ? { ...prev, location: city, location_coords: { lat: pos.lat, lng: pos.lng } } : null);
    } catch (err) {
      console.warn("Location sync failed:", err);
    }
  }

  async function login(email: string, password?: string) {
    // Demo login removed
    if (!password) throw new Error("Password is required");
    
    let result;
    try {
      result = await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (
        (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") &&
        email === import.meta.env.VITE_ADMIN_EMAIL &&
        password === import.meta.env.VITE_ADMIN_PASSWORD
      ) {
        await signup({ email, phone: import.meta.env.VITE_ADMIN_PHONE, name: import.meta.env.VITE_ADMIN_NAME || "Admin", role: "admin" }, password);
        return;
      }
      throw err;
    }
    
    // Update device ID on successful login if it's a customer
    const userDoc = await getDoc(doc(db, "users", result.user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.role === "customer") {
        const currentDeviceId = getDeviceId();
        await updateDoc(doc(db, "users", result.user.uid), {
          deviceId: currentDeviceId,
          lastOtpDate: serverTimestamp(),
          otpVerified: true // Set to true since they just logged in with password/google
        });
      }
      
      await logActivity({
        title: `${data.role === 'admin' ? 'Admin' : 'User'} Login`,
        description: `${data.name || 'User'} logged in successfully.`,
        type: 'Auth',
        priority: 'info'
      });
    } else {
      await signOut(auth);
      throw new Error("User profile not found. Please create an account first.");
    }
  }

  async function signInWithGoogle(role: UserRole, accessToken: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, selectedRole: role })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Failed to authenticate with Google");
      }

      if (resData.exists) {
        await signInWithCustomToken(auth, resData.customToken);

        setUser({ 
          ...resData.user, 
          isDemo: false,
          lastActive: new Date(),
        } as User);
        
        await logActivity({
          title: `${resData.role === 'admin' ? 'Admin' : 'User'} Login (Google)`,
          description: `${resData.user.name || 'User'} logged in via Google.`,
          type: 'Auth',
          priority: 'info'
        });

        return { exists: true, user: resData.user, role: resData.role };
      }

      return {
        exists: false,
        ...resData.googleData
      };

    } catch (error: any) {
      console.error("Google Sign In Error:", error);
      throw error;
    }
  }

  async function signup(userData: Partial<User>, password?: string) {
    let firebaseUser;
    
    if (!userData.email || !userData.phone || !userData.role || !userData.name) {
      throw new Error("Missing required fields for signup");
    }

    try {
      if (!password) throw new Error("Password is required for signup");
      const email = userData.email;
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUser = result.user;
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        if (!password) throw new Error("Password is required");
        try {
          const result = await signInWithEmailAndPassword(auth, email, password);
          firebaseUser = result.user;
        } catch (loginErr: any) {
          if (loginErr.code === "auth/invalid-credential" || loginErr.code === "auth/wrong-password") {
            throw new Error("Phone number already registered. Please use the correct password or go to Log In.");
          }
          throw loginErr;
        }
      } else {
        throw err;
      }
    }

    const adminPhone = import.meta.env.VITE_ADMIN_PHONE;
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    const isAdmin = Boolean((adminEmail && userData.email === adminEmail) || (adminPhone && userData.phone === adminPhone));
    const finalRole = isAdmin ? "admin" : userData.role;

    const firestoreUser = cleanObject({
      ...userData,
      id: firebaseUser.uid,
      role: finalRole,
      otpVerified: true,
      lastActive: Timestamp.fromDate(new Date()),
      muktiScore: 0,
      points: finalRole === "customer" ? 0 : undefined,
      badges: finalRole === "customer" ? [] : undefined,
      status: finalRole === "worker" ? "not verified" : undefined,
      isVerifiedByAdmin: finalRole === "worker" ? false : undefined,
      isProfileComplete: true // Mark as true since they filled out the massive form
    });

    try {
      await setDoc(doc(db, "users", firebaseUser.uid), firestoreUser);
      console.log("✅ Firestore registration successful");
    } catch (err) {
      console.error("❌ Firestore registration failed:", err);
    }

    try {
      const token = await firebaseUser.getIdToken();
      fetch(`${API_BASE_URL}/api/worker/register`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(firestoreUser),
      }).catch(err => console.warn("Backend sync failed (non-critical):", err));
    } catch (err) {
      console.warn("Backend sync suppressed:", err);
    }

    setUser({ ...firestoreUser, isDemo: false } as User);
  }

  async function updateUser(updates: Partial<User>) {
    if (!user) return;
    const firestoreUpdates = { ...updates };
    if (updates.lastActive) firestoreUpdates.lastActive = Timestamp.fromDate(updates.lastActive) as any;
    await updateDoc(doc(db, "users", user.id), cleanObject(firestoreUpdates));
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }

  async function addPoints(amount: number, badgeStr?: string) {
    if (!user || user.role !== "customer") return;
    const updates: any = { points: increment(amount) };
    if (badgeStr && !user.badges?.includes(badgeStr)) updates.badges = arrayUnion(badgeStr);
    await updateDoc(doc(db, "users", user.id), updates);
    setUser(prev => {
      if (!prev) return null;
      const newBadges = prev.badges ? [...prev.badges] : [];
      if (badgeStr && !newBadges.includes(badgeStr)) newBadges.push(badgeStr);
      return { ...prev, points: (prev.points || 0) + amount, badges: newBadges };
    });
  }

  async function logout() {
    await signOut(auth);
    localStorage.removeItem("mukti_demo_user");
    localStorage.removeItem("mukti_google_session");
    setUser(null);
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-6 max-w-sm px-6 text-center">
          <div className="relative">
            <div className={`h-16 w-16 animate-spin rounded-full border-4 ${initError ? 'border-red-500/20 border-t-red-500' : 'border-primary/20 border-t-orange-500Shadow-[0_0_20px_rgba(249,115,22,0.3)]'}`}></div>
            <div className={`absolute inset-0 h-16 w-16 animate-pulse rounded-full ${initError ? 'bg-red-500/10' : 'bg-primary/10'} blur-xl`}></div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-lg font-black text-primary-foreground tracking-wider uppercase">MuktiPortal</h2>
            <p className={`text-[10px] font-bold ${initError ? 'text-red-500' : 'text-muted-foreground'} uppercase tracking-[0.2em] animate-pulse`}>
              {initError || "Initialising Secure Session"}
            </p>
            {initError && (
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 rounded-xl bg-card/5 border border-border text-[9px] font-black text-primary-foreground uppercase tracking-widest hover:bg-card/10 transition-all"
              >
                Retry Connection
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, signInWithGoogle, updateUser, addPoints, logout, syncLocation, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
