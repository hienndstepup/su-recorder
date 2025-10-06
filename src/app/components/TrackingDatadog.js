'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { datadogRum } from '@datadog/browser-rum';
import { reactPlugin } from '@datadog/browser-rum-react';
import { datadogLogs } from '@datadog/browser-logs';

const TrackingDatadog = () => {
  const pathname = usePathname();
  const { user } = useAuth(); // Get user from AuthContext

  useEffect(() => {
    // Initialize Datadog RUM and Logs only on client side
    if (typeof window !== 'undefined') {
      initializeDatadog();
      
      // Make datadogUtils available globally cho AuthContext
      window.datadogUtils = datadogUtils;
    }
  }, []);

  useEffect(() => {
    // Track page changes
    if (typeof window !== 'undefined' && datadogRum.getInitConfiguration()) {
      datadogRum.startView({
        name: pathname,
      });
    }
  }, [pathname]);

  useEffect(() => {
    // Set user context when user changes
    if (typeof window !== 'undefined' && datadogRum.getInitConfiguration() && user) {
      setUserContext(user);
    }
  }, [user]);

  const initializeDatadog = () => {
    try {
      // Initialize Datadog RUM with exact configuration from documentation
      if (!datadogRum.getInitConfiguration()) {
        datadogRum.init({
          applicationId: '37ed14be-ede1-4ed4-94f2-efebfc23963c',
          clientToken: 'pub6e2f57eae60c87ddafb5576d51dd02b0',
          site: 'us5.datadoghq.com',
          service: 'su-recorder',
          env: 'development',
          // Specify a version number to identify the deployed version of your application in Datadog
          version: '1.0.0',
          sessionSampleRate: 100,
          sessionReplaySampleRate: 100,
          defaultPrivacyLevel: 'mask-user-input',
          plugins: [reactPlugin({ router: false })],
        });
        
        console.log('Datadog RUM initialized successfully');
      }

      // Initialize Datadog Logs
      if (!datadogLogs.getInitConfiguration()) {
        datadogLogs.init({
          clientToken: 'pub6e2f57eae60c87ddafb5576d51dd02b0',
          site: 'us5.datadoghq.com',
          service: 'su-recorder',
          env: 'development',
          version: '1.0.0',
          sessionSampleRate: 100,
          silentMultipleInit: true,
        });
        
        console.log('Datadog Logs initialized successfully');
      }

    } catch (error) {
      console.error('Error initializing Datadog:', error);
    }
  };

  const setUserContext = (currentUser) => {
    // Set user context using Datadog setUser function
    try {
      if (currentUser?.id && datadogRum.getInitConfiguration()) {
        const userData = {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.user_metadata?.full_name || currentUser.email,
        };
        
        datadogRum.setUser(userData);
        
        // Also log the user identification for debugging
        if (datadogLogs.getInitConfiguration()) {
          datadogLogs.logger.info('User identified', {
            user_id: currentUser.id,
            user_email: currentUser.email,
            user_name: currentUser.user_metadata?.full_name || 'Not set',
          });
        }
      }
    } catch (error) {
      console.warn('Could not set user context:', error);
    }
  };

  // Global error handler
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      if (datadogLogs.getInitConfiguration()) {
        datadogLogs.logger.error('Unhandled promise rejection', {
          error: event.reason,
          stack: event.reason?.stack,
        });
      }
    };

    const handleError = (event) => {
      if (datadogLogs.getInitConfiguration()) {
        datadogLogs.logger.error('Global error', {
          error: event.error,
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
};

// Export utility functions for custom tracking
export const datadogUtils = {
  // Clear user context and stop session (for logout)
  clearUserAndStopSession: () => {
    if (typeof window !== 'undefined' && datadogRum.getInitConfiguration()) {
      try {
        // Log before clearing
        if (datadogLogs.getInitConfiguration()) {
          datadogLogs.logger.info('Clearing user context and stopping session', {
            timestamp: new Date().toISOString(),
            action: 'logout'
          });
        }

        // Remove user context từ Datadog RUM
        if (typeof datadogRum.removeUser === 'function') {
          datadogRum.removeUser();
        } else if (typeof datadogRum.clearUser === 'function') {
          datadogRum.clearUser();
        } else {
          // Fallback for older versions
          datadogRum.setUser({});
        }

        // Stop current session để kết thúc session hiện tại
        if (typeof datadogRum.stopSession === 'function') {
          datadogRum.stopSession();
        }

        console.log('Datadog user removed and session stopped');
      } catch (error) {
        console.error('Error clearing user context and stopping session:', error);
      }
    }
  },

  // Track custom events
  trackEvent: (name, properties = {}) => {
    if (typeof window !== 'undefined' && datadogRum.getInitConfiguration()) {
      datadogRum.addAction(name, properties);
    }
  },

  // Track custom errors
  trackError: (error, context = {}) => {
    if (typeof window !== 'undefined') {
      if (datadogRum.getInitConfiguration()) {
        datadogRum.addError(error, context);
      }
      if (datadogLogs.getInitConfiguration()) {
        datadogLogs.logger.error(error.message || error, {
          error: error,
          ...context,
        });
      }
    }
  },

  // Track custom metrics
  trackTiming: (name, duration, tags = {}) => {
    if (typeof window !== 'undefined' && datadogRum.getInitConfiguration()) {
      datadogRum.addTiming(name, duration, tags);
    }
  },

  // Log custom messages
  log: (level, message, context = {}) => {
    if (typeof window !== 'undefined' && datadogLogs.getInitConfiguration()) {
      datadogLogs.logger[level](message, context);
    }
  },

  // Set user context
  setUser: (user) => {
    if (typeof window !== 'undefined' && datadogRum.getInitConfiguration()) {
      datadogRum.setUser(user);
    }
  },

  // Set global context
  setGlobalContext: (context) => {
    if (typeof window !== 'undefined' && datadogRum.getInitConfiguration()) {
      datadogRum.setGlobalContext(context);
    }
  },

  // Start custom view
  startView: (name, context = {}) => {
    if (typeof window !== 'undefined' && datadogRum.getInitConfiguration()) {
      datadogRum.startView({ name, ...context });
    }
  },

  // Track recording sessions (specific to SU Recorder)
  trackRecordingSession: (sessionData) => {
    if (typeof window !== 'undefined') {
      const event = {
        name: 'recording_session',
        duration: sessionData.duration,
        quality: sessionData.quality,
        size: sessionData.size,
        success: sessionData.success,
      };
      
      if (datadogRum.getInitConfiguration()) {
        datadogRum.addAction('recording_session', event);
      }
      
      if (datadogLogs.getInitConfiguration()) {
        datadogLogs.logger.info('Recording session completed', event);
      }
    }
  },

  // Track audio processing performance
  trackAudioProcessing: (processingData) => {
    if (typeof window !== 'undefined') {
      const event = {
        name: 'audio_processing',
        processing_time: processingData.processingTime,
        file_size: processingData.fileSize,
        format: processingData.format,
        success: processingData.success,
      };
      
      if (datadogRum.getInitConfiguration()) {
        datadogRum.addTiming('audio_processing_time', processingData.processingTime);
        datadogRum.addAction('audio_processing', event);
      }
    }
  },
};

export default TrackingDatadog; 