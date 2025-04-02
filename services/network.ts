import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// Singleton to track network status
class NetworkManager {
  private static instance: NetworkManager;
  private isConnected: boolean = true;
  private listeners: ((isConnected: boolean) => void)[] = [];

  private constructor() {
    // Subscribe to network info updates
    NetInfo.addEventListener(this.handleNetInfoChange);
    
    // Initialize connection state
    this.updateConnectionStatus();
  }

  public static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  private handleNetInfoChange = (state: NetInfoState) => {
    const newConnectionStatus = Boolean(state.isConnected);
    
    if (this.isConnected !== newConnectionStatus) {
      this.isConnected = newConnectionStatus;
      
      // Notify listeners
      this.notifyListeners();
    }
  };

  private async updateConnectionStatus() {
    const state = await NetInfo.fetch();
    this.isConnected = Boolean(state.isConnected);
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isConnected));
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public addListener(listener: (isConnected: boolean) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

// Export singleton instance
export const networkManager = NetworkManager.getInstance();

// React hook for network status
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean>(
    networkManager.getConnectionStatus()
  );

  useEffect(() => {
    const unsubscribe = networkManager.addListener((connected) => {
      setIsConnected(connected);
    });
    
    return unsubscribe;
  }, []);

  return {
    isConnected,
    isOffline: !isConnected,
  };
}

// Utility function to handle API errors
export function handleApiError(error: any): string {
  if (!networkManager.getConnectionStatus()) {
    return 'No internet connection. Please check your network settings and try again.';
  }
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const status = error.response.status;
    
    if (status === 401 || status === 403) {
      return 'Authentication error. Please login again.';
    } else if (status === 404) {
      return 'The requested resource was not found.';
    } else if (status >= 500) {
      return 'Server error. Please try again later.';
    }
    
    return `Error: ${error.response.data.message || 'Unknown error occurred'}`;
  } else if (error.request) {
    // The request was made but no response was received
    return 'No response from server. Please try again later.';
  } else {
    // Something happened in setting up the request that triggered an Error
    return error.message || 'An unexpected error occurred.';
  }
} 