/**
 * Shared utility functions used across the application
 */

const Utils = {
  /**
   * Normalizes a string value for comparison
   */
  normalize(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
  },

  /**
   * Checks if a POI has valid coordinates
   */
  hasCoords(poi) {
    return Boolean(
      poi &&
      poi.coords &&
      typeof poi.coords.lat === 'number' &&
      typeof poi.coords.lng === 'number'
    );
  },

  /**
   * Gets the route_id from a POI if it exists
   */
  hasRouteId(poi) {
    if (!poi || typeof poi.route_id !== 'string') return null;
    const value = poi.route_id.trim();
    return value.length ? value : null;
  },

  /**
   * Compares two POIs by their route order
   */
  compareRouteOrder(a, b) {
    const orderA = typeof a.order === 'number' ? a.order : Number.POSITIVE_INFINITY;
    const orderB = typeof b.order === 'number' ? b.order : Number.POSITIVE_INFINITY;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    return (a.name ?? '').toString().localeCompare((b.name ?? '').toString());
  },

  /**
   * Checks if a POI matches a search value (by id or name)
   */
  matchesValue(poi, raw) {
    const value = this.normalize(raw);
    if (!value) return false;
    
    if (typeof poi.id === 'string' && poi.id.toLowerCase() === value) {
      return true;
    }
    
    if (typeof poi.name === 'string' && poi.name.toLowerCase() === value) {
      return true;
    }
    
    return false;
  },

  /**
   * Parses a geo coordinate tuple string like "40.7,-73.9"
   */
  parseGeoTuple(value) {
    if (typeof value !== 'string') return null;
    
    const trimmed = value.trim();
    if (!trimmed.length) return null;
    
    const parts = trimmed.split(',');
    if (parts.length !== 2) return null;
    
    const lat = Number.parseFloat(parts[0]);
    const lng = Number.parseFloat(parts[1]);
    
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    
    return { lat, lng };
  },

  /**
   * Converts input element to geo point object
   */
  toGeoPoint(input) {
    return {
      lat: +(input?.dataset?.geoLat ?? NaN),
      lng: +(input?.dataset?.geoLng ?? NaN),
      label: input?.dataset?.geoLabel ?? input?.value ?? '',
    };
  },

  /**
   * Checks if input has valid geo selection
   */
  hasGeoSelection(input) {
    return Boolean(input?.dataset?.geoLat && input?.dataset?.geoLng);
  },

  /**
   * Sets geo selection on an input element
   */
  setGeoSelection(geoField, plainField, point, label) {
    if (!geoField || !point) return;
    
    const rawLabel = typeof label === 'string' ? label.trim() : '';
    const finalLabel = rawLabel.length ? rawLabel : `${point.lat},${point.lng}`;
    
    geoField.value = finalLabel;
    geoField.dataset.geoLat = String(point.lat);
    geoField.dataset.geoLng = String(point.lng);
    geoField.dataset.geoLabel = finalLabel;
    
    if (plainField) {
      plainField.value = finalLabel;
    }
  },

  /**
   * Clears geo data from input element
   */
  clearGeoInputValues(geoField) {
    if (!geoField) return;
    
    delete geoField.dataset.geoLat;
    delete geoField.dataset.geoLng;
    delete geoField.dataset.geoLabel;
    geoField.value = '';
  },
};
