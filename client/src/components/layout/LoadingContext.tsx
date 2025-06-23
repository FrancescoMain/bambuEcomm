"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

interface LoadingContextType {
  loading: boolean;
  setLoading: (v: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType>({
  loading: false,
  setLoading: () => {},
});

export const useLoading = () => useContext(LoadingContext);

const LOADING_TIMEOUT = 5000; // 15 seconds timeout

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState(false);
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSetLoading = useCallback((isLoading: boolean) => {
    console.log("🔄 LoadingContext: setLoading called with:", isLoading);
    setLoading(isLoading);

    if (isLoading) {
      // Clear any existing timeout first
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Start new timeout
      timeoutRef.current = setTimeout(() => {
        console.log("⏰ Loading timeout reached, showing dialog");
        setShowTimeoutDialog(true);
      }, LOADING_TIMEOUT);
    } else {
      // Clear timeout timer
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setShowTimeoutDialog(false);
    }
  }, []); // Empty dependency array makes this function stable

  const handleRefresh = () => {
    console.log("User confirmed refresh due to loading timeout");
    window.location.reload();
  };
  const handleDismiss = () => {
    console.log("❌ User dismissed timeout dialog");
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowTimeoutDialog(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ loading, setLoading: handleSetLoading }}>
      {children}

      {/* Timeout Dialog */}
      {showTimeoutDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Caricamento Lento
              </h3>
              <p className="text-gray-600 mb-6">
                Il caricamento sta richiedendo più tempo del previsto. Questo
                potrebbe essere dovuto al server in standby. Vuoi ricaricare la
                pagina?
              </p>
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Continua ad Aspettare
                </button>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Ricarica Pagina
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};
