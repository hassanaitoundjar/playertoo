import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook that triggers a refresh when the user changes
 * @returns A refresh key that changes whenever the user changes
 */
export function useUserChange(): number {
  const [refreshKey, setRefreshKey] = useState(0);
  const { addUserChangeListener } = useAuth();

  useEffect(() => {
    // Function to handle user change events
    const handleUserChange = () => {
      // Increment refresh key to force reload of any components using this hook
      setRefreshKey(prev => prev + 1);
      console.log('User changed, triggering content refresh');
    };

    // Add listener for user changes and get unsubscribe function
    const unsubscribe = addUserChangeListener(handleUserChange);

    // Clean up listener on unmount
    return () => {
      unsubscribe();
    };
  }, [addUserChangeListener]);

  return refreshKey;
} 