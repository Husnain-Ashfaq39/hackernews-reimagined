import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useState, useEffect } from "react";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useAuthStore } from "@/store/authStore";
import { presenceService } from "@/services/presenceService";

// Lazy load page components
const Index = lazy(() => import("./pages/Index"));
const Comments = lazy(() => import("./pages/Comments"));
const NotFound = lazy(() => import("./pages/NotFound"));
const UserDashboard = lazy(() => import("./pages/UserDashboard").then(module => ({ default: module.UserDashboard })));
const SharedSummary = lazy(() => import("./pages/SharedSummary").then(module => ({ default: module.SharedSummary })));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const UsersPage = lazy(() => import("./pages/UsersPage"));

// Create persister to store cache in localStorage
const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "HN_REACT_QUERY_CACHE",
  throttleTime: 1000, // Throttle writing to storage (ms)
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => JSON.parse(data),
});

const App = () => {
  // Track online status
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { user } = useAuthStore();

  useEffect(() => {
    // Update online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Initialize presence service when user changes
  useEffect(() => {
    // Initialize presence service with current user ID
    presenceService.initialize(user?.$id || null);
    
    // Handle any pending offline status from previous session
    if (user?.$id) {
      presenceService.handlePendingOfflineStatus();
    }
    
    // Clean up presence service when component unmounts
    return () => {
      presenceService.cleanup();
    };
  }, [user]);

  // Create a stable QueryClient instance that persists between renders
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes
          gcTime: 1000 * 60 * 10, // 10 minutes
          refetchOnWindowFocus: false,
          retry: isOnline ? 1 : false, // Don't retry when offline
          // Critically important for offline support
          networkMode: "always", // Continue showing cached data even offline
        },
      },
    });

    // Setup persistence after client creation
    persistQueryClient({
      queryClient: client,
      persister: localStoragePersister,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => {
          // Only cache successful queries
          return query.state.status === "success";
        },
      },
    });

    return client;
  });

  // Loading fallback component
  const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="h-8 w-8 border-4 border-t-hn-orange border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/newest" element={<Index />} />
              <Route path="/ask" element={<Index />} />
              <Route path="/show" element={<Index />} />
              <Route path="/jobs" element={<ComingSoon title="Jobs Coming Soon" message="We're working on bringing you the best tech job listings. Check back soon!" />} />
              <Route path="/dashboard" element={<ComingSoon title="Dashboard Under Development" message="Our user dashboard is currently being built with exciting new features. Please check back later." />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/item/:id" element={<Comments />} />
              <Route path="/user/:username" element={<Index />} />
              <Route path="/from/:domain" element={<Index />} />
              <Route path="/tag/:tag" element={<Index />} />
              <Route path="/summary/:id" element={<SharedSummary />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
      {/* Add React Query Devtools for development environment */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default App;
