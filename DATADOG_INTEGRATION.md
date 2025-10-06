# Datadog Integration Documentation

## Overview

The SU Recorder application includes comprehensive Datadog integration using the official `@datadog/browser-rum` and `@datadog/browser-logs` packages for Real User Monitoring (RUM), logging, and error tracking.

## Installation

The required Datadog packages are already installed:

```bash
npm install @datadog/browser-rum @datadog/browser-logs
```

## Implementation Details

The integration follows the official Datadog documentation pattern:

```javascript
import { datadogRum } from '@datadog/browser-rum';
import { datadogLogs } from '@datadog/browser-logs';

// Initialization (handled automatically by TrackingDatadog component)
datadogRum.init({
    applicationId: process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID,
    clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN,
    site: process.env.NEXT_PUBLIC_DATADOG_SITE,
    service: 'su-recorder',
    env: process.env.NEXT_PUBLIC_ENVIRONMENT,
    version: '0.1.0',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    defaultPrivacyLevel: 'mask-user-input',
});
```

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your Datadog configuration:

```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_DATADOG_CLIENT_TOKEN`: Your Datadog client token
- `NEXT_PUBLIC_DATADOG_APPLICATION_ID`: Your Datadog application ID
- `NEXT_PUBLIC_DATADOG_SITE`: Your Datadog site (default: datadoghq.com)
- `NEXT_PUBLIC_ENVIRONMENT`: Environment name (development, staging, production)

### 2. Getting Datadog Credentials

1. Log in to your Datadog dashboard
2. Go to **UX Monitoring** > **RUM Applications**
3. Create a new application or select an existing one
4. Copy the **Client Token** and **Application ID**

## Features

### Automatic Tracking

The TrackingDatadog component automatically tracks:

- **Page Views**: Automatically tracks route changes
- **User Interactions**: Clicks, form submissions, etc.
- **Performance Metrics**: Page load times, resource loading
- **Errors**: JavaScript errors and unhandled promise rejections
- **Session Replay**: User session recordings (20% sample rate)

### Custom Tracking

Use the exported `datadogUtils` for custom tracking:

```javascript
import { datadogUtils } from '@/app/components/TrackingDatadog';

// Track custom events
datadogUtils.trackEvent('button_clicked', {
  button_name: 'record_start',
  page: '/record'
});

// Track errors
try {
  // some operation
} catch (error) {
  datadogUtils.trackError(error, {
    context: 'audio_processing',
    user_id: userId
  });
}

// Track performance metrics
const startTime = Date.now();
// ... some operation
const duration = Date.now() - startTime;
datadogUtils.trackTiming('audio_process_time', duration);

// Log messages
datadogUtils.log('info', 'User started recording', {
  session_id: sessionId,
  quality: 'high'
});

// Set user context (typically after login)
datadogUtils.setUser({
  id: user.id,
  email: user.email,
  name: user.name
});
```

### SU Recorder Specific Tracking

Special utilities for recording application:

```javascript
// Track recording sessions
datadogUtils.trackRecordingSession({
  duration: 30000, // milliseconds
  quality: 'high',
  size: 1024000, // bytes
  success: true
});

// Track audio processing performance
datadogUtils.trackAudioProcessing({
  processingTime: 5000, // milliseconds
  fileSize: 2048000, // bytes
  format: 'wav',
  success: true
});
```

## Configuration

### Privacy Settings

The current configuration uses `mask-user-input` privacy level to protect sensitive user data while still capturing useful interactions.

### Sampling Rates

- **Session Sample Rate**: 100% (all sessions tracked)
- **Session Replay Sample Rate**: 20% (to balance storage costs)

### Error Handling

The integration includes global error handlers that automatically capture:
- JavaScript runtime errors
- Unhandled promise rejections
- Network request failures
- Custom application errors

## Monitoring Dashboard

Once configured, you can monitor your application in Datadog:

1. **RUM Dashboard**: Real-time user interactions and performance
2. **Error Tracking**: Centralized error reporting and stack traces
3. **Performance Monitoring**: Page load times, API response times
4. **Session Replay**: Visual recordings of user sessions
5. **Custom Metrics**: Application-specific metrics and events

## Best Practices

1. **Don't track sensitive data**: The integration is configured to mask user inputs by default
2. **Use structured logging**: Include relevant context in custom events
3. **Monitor performance impact**: The SDK is lightweight but monitor for any performance issues
4. **Set up alerts**: Configure Datadog alerts for critical errors or performance thresholds
5. **Regular review**: Periodically review tracked data and adjust configuration as needed

## Troubleshooting

### Common Issues

1. **Missing environment variables**: Check that all required env vars are set
2. **Script loading errors**: Ensure network access to Datadog CDN
3. **CORS issues**: Verify Datadog site configuration matches your region
4. **No data appearing**: Check client token and application ID are correct

### Debug Mode

To enable debug logging, add to your environment:
```bash
NEXT_PUBLIC_DATADOG_DEBUG=true
```

This will output additional console logs to help diagnose integration issues.