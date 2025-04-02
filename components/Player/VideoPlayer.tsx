import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useTheme } from '../../context/ThemeContext';
import { HistoryService } from '../../services/history';
import { xtreamApi } from '../../services/api';

interface VideoPlayerProps {
  source: { 
    uri: string;
    headers?: Record<string, string>;
  };
  posterSource?: { uri: string };
  title?: string;
  onClose?: () => void;
  onError?: (error: string) => void;
  initialPosition?: number;
  streamId?: number;
  streamType: 'live' | 'vod' | 'series';
  episodeInfo?: {
    seriesId: number;
    season: number;
    episodeNum: number;
  };
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  source,
  posterSource,
  title,
  onClose,
  onError,
  initialPosition = 0,
  streamId,
  streamType,
  episodeInfo,
}) => {
  const videoRef = useRef<Video>(null);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isInRetryFlow, setIsInRetryFlow] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<'m3u8' | 'mp4' | 'ts'>('m3u8');
  const [playbackAttempt, setPlaybackAttempt] = useState(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Configure stream with headers
  const getStreamWithHeaders = () => {
    const headers = xtreamApi.getStreamHeaders();
    return {
      uri: source.uri,
      headers: source.headers || headers,
    };
  };
  
  // Calculate video dimensions
  const { width, height } = Dimensions.get('window');
  const videoWidth = isFullscreen ? width : width;
  const videoHeight = isFullscreen ? height : width * 9 / 16; // 16:9 aspect ratio
  
  // Retry with different format when there's an error
  const retryWithDifferentFormat = () => {
    if (isInRetryFlow) return; // Prevent multiple retries at once
    
    setIsInRetryFlow(true);
    setIsBuffering(true);
    
    const formats: ('m3u8' | 'mp4' | 'ts')[] = ['m3u8', 'mp4', 'ts'];
    const currentIndex = formats.indexOf(currentFormat);
    const nextFormat = formats[(currentIndex + 1) % formats.length];
    
    // Construct new URL with different format
    let newUrl = '';
    if (streamType === 'live') {
      // For live, we only switch between m3u8 and ts
      newUrl = source.uri.replace(/\.(m3u8|ts)$/, nextFormat === 'mp4' ? '.ts' : `.${nextFormat}`);
    } else if (streamType === 'vod' && streamId) {
      newUrl = xtreamApi.getVodStreamingUrl(streamId, nextFormat);
    } else if (streamType === 'series' && streamId) {
      newUrl = xtreamApi.getSeriesStreamingUrl(streamId, nextFormat);
    } else {
      newUrl = source.uri.replace(/\.(m3u8|mp4|ts)$/, `.${nextFormat}`);
    }
    
    console.log(`Retrying with format ${nextFormat}, URL: ${newUrl}`);
    
    if (videoRef.current) {
      // Load new source
      videoRef.current.unloadAsync().then(() => {
        // Only update the format if a streamId is available
        if (streamId) {
          setCurrentFormat(nextFormat);
          source.uri = newUrl;
          
          // Small timeout before loading new source
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.loadAsync(
                getStreamWithHeaders(),
                { shouldPlay: true },
                false
              );
              setPlaybackAttempt(prev => prev + 1);
            }
            setIsInRetryFlow(false);
          }, 1000);
        } else {
          // If no streamId, cannot retry properly
          setIsInRetryFlow(false);
          if (onError) {
            onError('Failed to load with all formats. Please try again later.');
          }
        }
      });
    }
  };
  
  useEffect(() => {
    // Show status bar in portrait mode, hide in landscape
    StatusBar.setHidden(isFullscreen);
    
    // Set initial orientation
    if (isFullscreen) {
      lockToLandscape();
    } else {
      lockToPortrait();
    }
    
    return () => {
      // Reset orientation when component unmounts
      unlockOrientation();
      
      // Clear any pending timeouts
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      
      // Show status bar when component unmounts
      StatusBar.setHidden(false);
    };
  }, [isFullscreen]);
  
  useEffect(() => {
    // Set a timeout for loading to trigger retry
    loadTimeoutRef.current = setTimeout(() => {
      if (isBuffering && playbackAttempt === 0) {
        console.log('Loading timeout - attempting format switch');
        retryWithDifferentFormat();
      }
    }, 15000); // 15 seconds timeout
    
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    // Set initial position if any
    if (initialPosition > 0 && videoRef.current) {
      videoRef.current.setPositionAsync(initialPosition * 1000); // Convert to milliseconds
    }
  }, [initialPosition]);
  
  // Handle playback status updates
  const onPlaybackStatusUpdate = (playbackStatus: AVPlaybackStatus) => {
    setStatus(playbackStatus);
    
    if (playbackStatus.isLoaded) {
      // Update buffering state
      setIsBuffering(playbackStatus.isBuffering);
      
      // Clear loading timeout when playback starts
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      
      // Save playback position every 5 seconds
      if (playbackStatus.positionMillis % 5000 < 100 && playbackStatus.positionMillis > 0) {
        savePlaybackPosition(playbackStatus.positionMillis / 1000); // Convert to seconds
      }
    }
  };
  
  // Save video position to history
  const savePlaybackPosition = (position: number) => {
    if (!streamId || streamType === 'live') return;
    
    const historyItem = {
      id: streamType === 'series' && episodeInfo ? episodeInfo.seriesId : streamId,
      type: streamType,
      name: title || 'Unknown',
      position,
      timestamp: Date.now(),
      ...(streamType === 'series' && episodeInfo && {
        season: episodeInfo.season,
        episode_num: episodeInfo.episodeNum,
      }),
    };
    
    HistoryService.addToHistory(historyItem);
  };
  
  // Handle video errors
  const handleError = (error: any) => {
    console.error('Video playback error:', error);
    
    // If this is not the first attempt, try switching formats
    if (playbackAttempt < 2) {
      console.log(`Playback error occurred, attempt ${playbackAttempt + 1} - switching formats`);
      retryWithDifferentFormat();
    } else {
      if (onError) {
        onError(typeof error === 'string' ? error : 'An error occurred during playback');
      }
    }
  };
  
  // Toggle fullscreen mode
  const toggleFullscreen = async () => {
    setIsFullscreen(prev => !prev);
  };
  
  // Lock screen to landscape mode
  const lockToLandscape = async () => {
    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
    } catch (error) {
      console.log('Failed to lock orientation:', error);
    }
  };
  
  // Lock screen to portrait mode
  const lockToPortrait = async () => {
    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT
      );
    } catch (error) {
      console.error('Failed to lock orientation', error);
    }
  };
  
  // Unlock screen orientation
  const unlockOrientation = async () => {
    try {
      await ScreenOrientation.unlockAsync();
    } catch (error) {
      console.log('Failed to unlock orientation:', error);
    }
  };
  
  // Toggle playback
  const togglePlayPause = async () => {
    if (!videoRef.current || !status?.isLoaded) return;
    
    if (status.isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };
  
  // Show controls temporarily
  const showControlsTemporarily = () => {
    setControlsVisible(true);
    
    // Clear any existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Hide controls after 3 seconds
    controlsTimeoutRef.current = setTimeout(() => {
      if (status?.isLoaded && status.isPlaying) {
        setControlsVisible(false);
      }
    }, 3000);
  };
  
  // Format time (seconds to MM:SS or HH:MM:SS)
  const formatTime = (millis: number) => {
    if (!millis) return '00:00';
    
    const totalSeconds = Math.floor(millis / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle player touch
  const handlePlayerTouch = () => {
    if (controlsVisible) {
      setControlsVisible(false);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    } else {
      showControlsTemporarily();
    }
  };
  
  // Handle close
  const handleClose = () => {
    unlockOrientation();
    if (onClose) {
      onClose();
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity 
        activeOpacity={1} 
        style={[styles.videoContainer, { width: videoWidth, height: videoHeight }]}
        onPress={handlePlayerTouch}
      >
        <Video
          ref={videoRef}
          style={styles.video}
          source={getStreamWithHeaders()}
          posterSource={posterSource}
          posterStyle={styles.posterImage}
          usePoster={!!posterSource}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping={false}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          onError={handleError}
        />
        
        {/* Loading indicator */}
        {/* {isBuffering && (
          <View style={styles.bufferingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.bufferingText, { color: colors.text }]}>
              {isInRetryFlow ? `Trying different format (${currentFormat})...` : 'Loading...'}
            </Text>
          </View>
        )} */}
        
        {/* Player controls - only visible when controlsVisible is true */}
        {controlsVisible && (
          <View style={styles.controlsContainer}>
            {/* Top bar with title and close button */}
            <View style={[styles.topControls, { paddingTop: insets.top }]}>
              {onClose && (
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
              )}
              <Text style={styles.videoTitle} numberOfLines={1}>{title}</Text>
              <View style={{ width: 40 }} /> {/* Spacer for alignment */}
            </View>
            
            {/* Center play/pause button */}
            <TouchableOpacity 
              style={styles.centerButton}
              onPress={togglePlayPause}
            >
              <Ionicons 
                name={status?.isLoaded && status.isPlaying ? "pause" : "play"} 
                size={50} 
                color="white" 
              />
            </TouchableOpacity>
            
            {/* Bottom bar with position slider, time, and fullscreen button */}
            <View style={styles.bottomControls}>
              {/* Time display */}
              <Text style={styles.timeText}>
                {formatTime(status?.isLoaded ? status.positionMillis : 0)}
                {streamType !== 'live' && status?.isLoaded && status.durationMillis && (
                  ` / ${formatTime(status.durationMillis)}`
                )}
              </Text>
              
              {/* Format switcher button */}
              <TouchableOpacity 
                onPress={retryWithDifferentFormat} 
                style={styles.formatButton}
                disabled={isInRetryFlow}
              >
                <Ionicons name="swap-horizontal" size={22} color="white" />
              </TouchableOpacity>
              
              {/* Fullscreen button */}
              <TouchableOpacity onPress={toggleFullscreen} style={styles.fullscreenButton}>
                <Ionicons 
                  name={isFullscreen ? "contract" : "expand"} 
                  size={24} 
                  color="white" 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    position: 'relative',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  posterImage: {
    resizeMode: 'cover',
  },
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingTop: 20, // Will be adjusted by insets
  },
  closeButton: {
    padding: 8,
  },
  videoTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginHorizontal: 10,
    textAlign: 'center',
  },
  centerButton: {
    alignSelf: 'center',
    padding: 15,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  timeText: {
    color: 'white',
    fontSize: 14,
  },
  formatButton: {
    padding: 8,
    marginRight: 8,
  },
  fullscreenButton: {
    padding: 8,
  },
  bufferingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bufferingText: {
    color: 'white',
    marginTop: 10,
  },
}); 