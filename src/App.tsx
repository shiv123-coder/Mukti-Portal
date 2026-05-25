import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";

import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { toast as sonnerToast } from "sonner";
import { useEffect, useRef } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/AdminLayout";
import ErrorBoundary from "@/components/ErrorBoundary";

import LoginPage from "@/pages/LoginPage";
import WorkerDashboard from "@/pages/WorkerDashboard";
import CustomerDashboard from "@/pages/CustomerDashboard";
import AdminOverview from "@/pages/admin/AdminOverview";
import OnboardingPage from "@/pages/OnboardingPage";

// Lazy-load secondary pages for better initial performance
const WorkerProfile = lazy(() => import("@/pages/WorkerProfile"));
const QRScreen = lazy(() => import("@/pages/QRScreen"));
const CustomerVerification = lazy(() => import("@/pages/CustomerVerification"));
const CustomerActivity = lazy(() => import("@/pages/CustomerActivity"));
const LiveTracking = lazy(() => import("@/pages/LiveTracking"));
const ReportPreview = lazy(() => import("@/pages/ReportPreview"));
const EmployerVerificationPage = lazy(() => import("@/pages/EmployerVerificationPage"));
const AdminWorkers = lazy(() => import("@/pages/admin/AdminWorkers"));
const AdminCustomers = lazy(() => import("@/pages/admin/AdminCustomers"));
const AdminFraud = lazy(() => import("@/pages/admin/AdminFraud"));
const AdminReviews = lazy(() => import("@/pages/admin/AdminReviews"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));
const AdminRequests = lazy(() => import("@/pages/admin/AdminRequests"));
const AdminWorkerDetail = lazy(() => import("@/pages/admin/AdminWorkerDetail"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const LiveImpact = lazy(() => import("@/pages/LiveImpact"));
const SchemesMatcher = lazy(() => import("@/pages/SchemesMatcher"));
const JobMap = lazy(() => import("@/pages/JobMap"));
const AdminJobs = lazy(() => import("@/pages/admin/AdminJobs"));
const AdminManagement = lazy(() => import("@/pages/admin/AdminManagement"));
const PublicReport = lazy(() => import("@/pages/PublicReport"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex h-[60vh] w-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
);

const queryClient = new QueryClient();

import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./components/PageTransition";

const MainLayout = () => {
  const { user } = useAuth();
  const showBottomNav = !!user;
  const location = useLocation();

  return (
    <>
      <div className="flex flex-col min-h-screen overflow-hidden relative">
        {user?.role !== "admin" && <AppHeader />}
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition><LoginPage /></PageTransition>} />
              
              {/* Worker Routes */}
              <Route path="/onboarding" element={<ProtectedRoute allowedRoles={["worker"]}><PageTransition><OnboardingPage /></PageTransition></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["worker"]}><PageTransition><WorkerDashboard /></PageTransition></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute allowedRoles={["worker"]}><PageTransition><WorkerProfile /></PageTransition></ProtectedRoute>} />
              <Route path="/qr" element={<ProtectedRoute allowedRoles={["worker"]}><PageTransition><QRScreen /></PageTransition></ProtectedRoute>} />
              <Route path="/schemes" element={<ProtectedRoute allowedRoles={["worker"]}><PageTransition><SchemesMatcher /></PageTransition></ProtectedRoute>} />
              <Route path="/jobs/map" element={<ProtectedRoute allowedRoles={["worker"]}><PageTransition><JobMap /></PageTransition></ProtectedRoute>} />
              
              {/* Customer Routes */}
              <Route path="/customer" element={<ProtectedRoute allowedRoles={["customer"]}><PageTransition><CustomerDashboard /></PageTransition></ProtectedRoute>} />
              <Route path="/verify/:workerId?/:jobId?" element={<ProtectedRoute allowedRoles={["customer"]}><PageTransition><CustomerVerification /></PageTransition></ProtectedRoute>} />
              <Route path="/activity" element={<ProtectedRoute allowedRoles={["customer"]}><PageTransition><CustomerActivity /></PageTransition></ProtectedRoute>} />
              <Route path="/tracking/:jobId" element={<ProtectedRoute allowedRoles={["customer"]}><PageTransition><LiveTracking /></PageTransition></ProtectedRoute>} />
              <Route path="/verify/job-complete/:jobId" element={<ProtectedRoute allowedRoles={["customer"]}><PageTransition><LiveTracking /></PageTransition></ProtectedRoute>} />
              <Route path="/report" element={<ProtectedRoute allowedRoles={["worker", "customer"]}><PageTransition><ReportPreview /></PageTransition></ProtectedRoute>} />
              <Route path="/employer-verify/:workerId" element={<ProtectedRoute allowedRoles={["customer"]}><PageTransition><EmployerVerificationPage /></PageTransition></ProtectedRoute>} />

              {/* Public Routes */}
              <Route path="/leaderboard" element={<PageTransition><Leaderboard /></PageTransition>} />
              <Route path="/impact" element={<PageTransition><LiveImpact /></PageTransition>} />
              <Route path="/report/public/:reportId" element={<PageTransition><PublicReport /></PageTransition>} />

              {/* Admin Routes */}
              <Route path="/admin/*" element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <PageTransition>
                    <AdminLayout>
                      <Routes>
                        <Route path="dashboard" element={<AdminOverview />} />
                        <Route path="workers" element={<AdminWorkers />} />
                        <Route path="customers" element={<AdminCustomers />} />
                        <Route path="jobs" element={<AdminJobs />} />
                        <Route path="management" element={<AdminManagement />} />
                        <Route path="fraud" element={<AdminFraud />} />
                        <Route path="reviews" element={<AdminReviews />} />
                        <Route path="requests" element={<AdminRequests />} />
                        <Route path="worker/:workerId" element={<AdminWorkerDetail />} />
                        <Route path="settings" element={<AdminSettings />} />
                        {/* Fallback for anything else */}
                        <Route path="*" element={<AdminOverview />} />
                      </Routes>
                    </AdminLayout>
                  </PageTransition>
                </ProtectedRoute>
              } />

              <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
        {showBottomNav && user?.role !== "admin" && <BottomNav />}
      </div>
    </>
  );
};

const ConnectivityListener = () => {
  const isOnline = useOnlineStatus();
  const prevStatus = useRef(isOnline);

  useEffect(() => {
    if (prevStatus.current !== isOnline) {
      if (isOnline) {
        sonnerToast.success("Back Online", {
          description: "Your changes are being synced to the server.",
          duration: 3000,
        });
      } else {
        sonnerToast.warning("Offline Mode", {
          description: "You're working offline. Changes will sync when reconnected.",
          duration: 5000,
        });
      }
      prevStatus.current = isOnline;
    }
  }, [isOnline]);

  return null;
};

import { ThemeProvider } from "next-themes";

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ConnectivityListener />
        <AuthProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <MainLayout />
            </ErrorBoundary>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
