# Google Maps to Leaflet.js Conversion Analysis

## 1. Google Maps Features Used

Based on codebase analysis, the following Google Maps features are being used:

### Current Implementation:
1. **Google Maps JavaScript API** - Map rendering
   - `google.maps.Map()` - Map initialization
   - Map container with id="map"
   - Map controls (zoom, pan)

2. **Google Places API** - Place search and details
   - `PlacesService` - For searching nearby places
   - `nearbySearch()` - Find places near location
   - `getDetails()` - Get place details
   - Place data (name, rating, photos, address, etc.)

3. **Google Geocoding API** - Reverse geocoding
   - Converting lat/lng to city name
   - Used in `geolocation.js`

4. **Google Maps UI Components**
   - `InfoWindow` - Popups for place details
   - `Marker` - Markers for places on map
   - Map controls (zoom, pan, recenter)

5. **Map Features Expected**
   - Map view toggle (grid/map)
   - Recenter button
   - Filter button
   - Place markers with popups
   - User location marker

## 2. Leaflet.js Equivalents

| Google Maps Feature | Leaflet Equivalent | Notes |
|---------------------|---------------------|-------|
| `google.maps.Map()` | `L.map()` | Map initialization |
| `google.maps.LatLng()` | `L.latLng()` | Coordinate creation |
| `google.maps.Marker()` | `L.marker()` | Place markers |
| `InfoWindow` | `L.popup()` | Popups for place info |
| `PlacesService.nearbySearch()` | **No direct equivalent** | Need alternative API |
| `Geocoder.geocode()` | **Nominatim API** | OpenStreetMap geocoding |
| Map controls | Built-in controls | Zoom, pan included |
| Custom controls | `L.control` | For recenter/filter buttons |

## 3. Limitations & Changes Required

### Critical Changes:

1. **Places API Replacement**
   - **Issue**: Leaflet doesn't have a built-in Places API
   - **Solution**: Use **Overpass API** or **Nominatim** for POI search
   - **Alternative**: Use **Mapbox Geocoding API** (requires API key) or **Foursquare API**
   - **Best Option**: **Overpass API** (free, no key needed) for OpenStreetMap POI data

2. **Geocoding API Replacement**
   - **Current**: Google Geocoding API (requires key)
   - **Solution**: **Nominatim API** (free, no key, rate-limited)
   - **Limitation**: 1 request/second rate limit (can be cached)

3. **Reverse Geocoding**
   - **Current**: Google Geocoding API
   - **Solution**: Nominatim reverse geocoding
   - **URL**: `https://nominatim.openstreetmap.org/reverse`

4. **Place Details**
   - **Current**: Google Places `getDetails()`
   - **Solution**: Use Overpass API or Nominatim to get place details from OSM

5. **Map Tiles**
   - **Current**: Google Maps tiles (requires API key)
   - **Solution**: OpenStreetMap tiles (free, no key)
   - **Provider**: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`

6. **Place Photos**
   - **Current**: Google Places photos
   - **Solution**: Use Wikimedia Commons or remove photo feature
   - **Alternative**: Use placeholder images

### Implementation Strategy:

1. **Geocoding**: Replace Google Geocoding with Nominatim
2. **Places Search**: Use Overpass API for POI search
3. **Map Rendering**: Use Leaflet with OSM tiles
4. **Markers**: Use Leaflet markers
5. **Popups**: Use Leaflet popups instead of InfoWindows
6. **Controls**: Use Leaflet built-in controls + custom controls

### API Endpoints to Use:

1. **Nominatim Reverse Geocoding**:
   ```
   https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}
   ```

2. **Overpass API for Places**:
   ```
   https://overpass-api.de/api/interpreter
   ```
   Query format: Overpass QL for POI search

3. **Nominatim Search** (alternative for places):
   ```
   https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=10
   ```

### Rate Limiting Considerations:

- **Nominatim**: 1 request/second (strict)
- **Overpass**: More lenient, but should still be respectful
- **Solution**: Implement aggressive caching and request throttling

### Code Structure Changes:

1. Remove Google Maps API loading script
2. Add Leaflet CSS and JS CDN links
3. Replace `initMap()` with Leaflet map initialization
4. Replace Google Places calls with Overpass/Nominatim
5. Replace InfoWindows with Leaflet popups
6. Update geolocation.js to use Nominatim


