/**
 * Application constants and configuration values
 * Centralizes magic numbers and configuration
 */

const AppConfig = {
  // Route building constraints
  MAX_POIS_PER_BLOCK: 3,
  
  // Typeahead behavior
  TYPEAHEAD_DEBOUNCE_MS: 250,
  TYPEAHEAD_MIN_QUERY_LENGTH: 2,
  
  // Map configuration
  DEFAULT_CENTER: [40.7359, -73.9911],
  DEFAULT_ZOOM: 15,
  
  // Marker styling
  MARKER_SIZE: 28,
  MARKER_OFFSET: 14, // MARKER_SIZE / 2
  MARKER_Z_INDEX: 651,
  
  // Route graphics styling
  ROUTE_COLOR: '#1a73e8',
  ROUTE_STROKE_WIDTH: 2,
  ROUTE_NODE_RADIUS: 4,
  
  // Sort orders
  DEFAULT_ROUTE_ID: 'zzz',
  DEFAULT_ORDER: 999999,
  
  // Error messages
  MESSAGES: {
    FAILED_TO_LOAD: 'Failed to load POIs',
    NO_RESULTS: 'No results',
    SEARCHING: 'Searching…',
    LOCATING: 'Locating…',
    LOCATION_UNAVAILABLE: 'Location unavailable.',
    USING_CURRENT_LOCATION: 'Using current location.',
    GEOCODER_ERROR: 'Error contacting geocoder',
    SELECT_FROM_TO: 'Select both From and To to see steps.',
    NO_MATCHING_ROUTE: 'No matching route segment.',
  },
  
  // Map event types for redraw
  MAP_REDRAW_EVENTS: ['move', 'zoom', 'resize'],
};
