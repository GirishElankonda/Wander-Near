/**
 * WanderNear App - Leaflet.js Implementation
 * 
 * This file replaces Google Maps with Leaflet.js and OpenStreetMap
 * 
 * Features:
 * - Map rendering with OpenStreetMap tiles
 * - User geolocation
 * - Place markers with popups
 * - Place search using Overpass API
 * - Map controls (zoom, pan, recenter)
 * - Grid/Map view toggle
 */

(function () {
    'use strict';

    // Global map instance
    let map = null;
    let userMarker = null;
    let placeMarkers = [];
    let currentUserLocation = null;
    let currentPlaces = [];
    let allPlaces = []; // Master array to store all fetched places
    let activeCategory = 'all'; // Currently selected category

    // Overpass API endpoint (free, no key needed)
    const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

    // Cache for place searches
    const placesCache = new Map();
    const PLACES_CACHE_AGE = 10 * 60 * 1000; // 10 minutes

    /**
     * Category mapping configuration
     * Maps OSM tags to our filter categories
     */
    const CATEGORY_MAPPING = {
        // Restaurant category
        'restaurant': 'restaurant',
        'fast_food': 'restaurant',
        'bar': 'restaurant',

        // Cafe category
        'cafe': 'cafe',

        // Hotel/Lodging category
        'hotel': 'lodging',

        // Museum category
        'museum': 'museum',
        'gallery': 'museum',

        // Tourist attraction category
        'attraction': 'tourist_attraction',
        'park': 'tourist_attraction',
        'stadium': 'tourist_attraction',
        'swimming_pool': 'tourist_attraction',
        'tourism': 'tourist_attraction'
    };

    /**
     * Initialize Leaflet map
     * Replaces Google Maps initialization
     */
    function initMap() {
        // Check if map container exists
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.warn('Map container not found');
            return;
        }

        // Initialize Leaflet map with default center (can be updated when user location is available)
        // Leaflet uses L.map() instead of google.maps.Map()
        map = L.map('map', {
            center: [40.7128, -74.0060], // Default: New York (will be updated to user location)
            zoom: 13,
            zoomControl: true // Leaflet has built-in zoom controls
        });

        // Add OpenStreetMap tiles
        // Leaflet uses L.tileLayer() instead of Google Maps tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);

        console.log('Leaflet map initialized successfully');

        // Setup map controls
        setupMapControls();

        // Setup view toggle
        setupViewToggle();

        // Try to get user location and update map
        if (typeof GeolocationModule !== 'undefined' && GeolocationModule.getCurrentLocation) {
            GeolocationModule.getCurrentLocation()
                .then(coords => {
                    currentUserLocation = coords;
                    updateMapCenter(coords.lat, coords.lng);
                    addUserMarker(coords.lat, coords.lng);
                    searchNearbyPlaces(coords.lat, coords.lng);
                })
                .catch(error => {
                    console.log('Could not get user location:', error.message);
                    // Map will use default center
                });
        }
    }

    /**
     * Update map center to user location
     * Leaflet equivalent: map.setView() instead of map.setCenter()
     */
    function updateMapCenter(lat, lng) {
        if (map) {
            map.setView([lat, lng], 13);
        }
    }

    /**
     * Add user location marker
     * Leaflet uses L.marker() instead of google.maps.Marker()
     */
    function addUserMarker(lat, lng) {
        // Remove existing user marker if any
        if (userMarker) {
            map.removeLayer(userMarker);
        }

        // Create custom icon for user location (blue circle)
        const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: '<div style="width: 20px; height: 20px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        // Add marker to map
        userMarker = L.marker([lat, lng], { icon: userIcon })
            .addTo(map)
            .bindPopup('Your Location')
            .openPopup();

        // Update map center
        updateMapCenter(lat, lng);
    }

    /**
     * Search for nearby places using Overpass API
     * Replaces Google Places API nearbySearch()
     * 
     * NOTE: Overpass API uses Overpass QL query language
     */
    function searchNearbyPlaces(lat, lng, radius = 2000) {
        // Check cache first
        const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)},${radius}`;
        const cached = placesCache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp) < PLACES_CACHE_AGE) {
            displayPlaces(cached.places);
            return;
        }

        // Show loading state
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.style.display = 'block';
        }

        // Build Overpass QL query
        // This searches for restaurants, cafes, tourist attractions, hotels, museums within radius
        const query = `
            [out:json][timeout:25];
            (
              node["amenity"~"^(restaurant|cafe|fast_food|bar)$"](around:${radius},${lat},${lng});
              node["tourism"~"^(attraction|hotel|museum|gallery)$"](around:${radius},${lat},${lng});
              node["leisure"~"^(park|stadium|swimming_pool)$"](around:${radius},${lat},${lng});
            );
            out body;
            >;
            out skel qt;
        `;

        // Make request to Overpass API
        fetch(OVERPASS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `data=${encodeURIComponent(query)}`
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Overpass API error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Parse Overpass API response
                const places = parseOverpassResults(data);

                // Cache results
                placesCache.set(cacheKey, {
                    places: places,
                    timestamp: Date.now()
                });

                // Display places
                displayPlaces(places);
            })
            .catch(error => {
                console.error('Error searching places:', error);

                // Hide loading state
                if (loadingState) {
                    loadingState.style.display = 'none';
                }

                // Show error message
                if (typeof showToast === 'function') {
                    showToast('Failed to load places. Please try again.', 'error');
                }

                // Fallback to mock places if available
                if (typeof generateMockPlaces === 'function') {
                    generateMockPlaces();
                }
            });
    }

    /**
     * Parse Overpass API results into place objects
     * Converts OSM data structure to our app's place format
     */
    function parseOverpassResults(data) {
        const places = [];

        if (!data || !data.elements) {
            return places;
        }

        data.elements.forEach(element => {
            if (element.type === 'node' && element.lat && element.lon) {
                const place = {
                    id: element.id,
                    name: element.tags?.name || 'Unnamed Place',
                    lat: element.lat,
                    lng: element.lon,
                    address: element.tags?.['addr:full'] ||
                        `${element.tags?.['addr:street'] || ''} ${element.tags?.['addr:city'] || ''}`.trim() ||
                        'Address not available',
                    rating: null, // OSM doesn't have ratings, would need separate API
                    ratingCount: null,
                    types: [],
                    photo: null, // Would need separate API for photos
                    website: element.tags?.website || null,
                    phone: element.tags?.phone || null,
                    rawCategory: null, // Store original OSM category
                    category: null // Normalized category for filtering
                };

                // Determine place type/category and map to our filter categories
                if (element.tags?.amenity) {
                    place.types.push(element.tags.amenity);
                    place.rawCategory = element.tags.amenity;
                    // Map to our filter category
                    place.category = CATEGORY_MAPPING[element.tags.amenity] || element.tags.amenity;
                } else if (element.tags?.tourism) {
                    place.types.push(element.tags.tourism);
                    place.rawCategory = element.tags.tourism;
                    // Map to our filter category
                    place.category = CATEGORY_MAPPING[element.tags.tourism] || 'tourist_attraction';
                } else if (element.tags?.leisure) {
                    place.types.push(element.tags.leisure);
                    place.rawCategory = element.tags.leisure;
                    // Map to our filter category (most leisure activities are attractions)
                    place.category = CATEGORY_MAPPING[element.tags.leisure] || 'tourist_attraction';
                }

                // Add description if available
                place.description = element.tags?.description ||
                    element.tags?.['addr:housenumber'] ?
                    `${element.tags['addr:housenumber']} ${element.tags['addr:street']}` :
                    '';

                places.push(place);
            }
        });

        return places;
    }

    /**
     * Display places on map and in grid
     * Replaces Google Maps marker creation
     */
    function displayPlaces(places) {
        // Store all places in master array
        allPlaces = places;
        currentPlaces = places;

        // Hide loading state
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.style.display = 'none';
        }

        // Clear existing markers
        clearPlaceMarkers();

        // Add markers to map
        places.forEach(place => {
            addPlaceMarker(place);
        });

        // Update grid view
        updatePlacesGrid(places);

        // Show success message
        if (typeof showToast === 'function') {
            showToast(`Found ${places.length} places nearby`, 'success');
        }
    }

    /**
     * Add a place marker to the map
     * Leaflet uses L.marker() with L.popup() instead of Google's Marker and InfoWindow
     */
    function addPlaceMarker(place) {
        // Create marker
        const marker = L.marker([place.lat, place.lng])
            .addTo(map);

        // Create popup content
        // Leaflet popups are simpler than Google InfoWindows - just HTML strings
        const popupContent = createPlacePopupContent(place);

        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'place-popup'
        });

        // Add click handler to open place details
        marker.on('click', function () {
            // Could trigger a modal or side panel here
            if (typeof showPlaceDetails === 'function') {
                showPlaceDetails(place);
            }
        });

        placeMarkers.push(marker);
    }

    /**
     * Create popup content HTML for a place
     * Replaces Google InfoWindow content
     */
    function createPlacePopupContent(place) {
        const categoryIcon = getCategoryIcon(place.category);
        const ratingHtml = place.rating ?
            `<div style="margin-top: 8px;">
                <span style="color: #fbbf24;">★</span> 
                <strong>${place.rating}</strong>
                ${place.ratingCount ? ` (${place.ratingCount})` : ''}
            </div>` : '';

        return `
            <div style="padding: 8px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
                    ${categoryIcon} ${place.name}
                </h3>
                <p style="margin: 4px 0; color: #666; font-size: 14px;">
                    ${place.address}
                </p>
                ${ratingHtml}
                <button onclick="window.openPlaceDetails && window.openPlaceDetails(${place.id})" 
                        style="margin-top: 8px; padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    View Details
                </button>
            </div>
        `;
    }

    /**
     * Get icon for place category
     * Works with both raw OSM categories and normalized filter categories
     */
    function getCategoryIcon(category) {
        const icons = {
            // Normalized categories
            'restaurant': '🍽️',
            'cafe': '☕',
            'lodging': '🏨',
            'museum': '🏛️',
            'tourist_attraction': '🎯',

            // Raw OSM categories
            'fast_food': '🍔',
            'bar': '🍺',
            'hotel': '🏨',
            'gallery': '🖼️',
            'attraction': '🎯',
            'park': '🌳',
            'stadium': '🏟️',
            'swimming_pool': '🏊'
        };
        return icons[category] || '📍';
    }

    /**
     * Clear all place markers from map
     */
    function clearPlaceMarkers() {
        placeMarkers.forEach(marker => {
            map.removeLayer(marker);
        });
        placeMarkers = [];
    }

    /**
     * Update places grid view
     */
    function updatePlacesGrid(places) {
        const placesGrid = document.getElementById('placesGrid');
        if (!placesGrid) return;

        // Clear existing content (except loading state)
        const loadingState = placesGrid.querySelector('.loading-state');
        placesGrid.innerHTML = '';
        if (loadingState) {
            placesGrid.appendChild(loadingState);
        }

        if (places.length === 0) {
            // Show category-specific empty state message
            const categoryName = activeCategory === 'all' ? 'places' :
                activeCategory === 'tourist_attraction' ? 'attractions' :
                    activeCategory === 'lodging' ? 'hotels' :
                        activeCategory + 's';

            placesGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-map-marker-alt" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h3>No ${categoryName} found</h3>
                    <p>${activeCategory === 'all' ? 'Try adjusting your search or location' : 'Try selecting a different category or location'}</p>
                </div>
            `;
            return;
        }

        // Create place cards
        places.forEach(place => {
            const card = createPlaceCard(place);
            placesGrid.appendChild(card);
        });
    }

    /**
     * Create a place card element for grid view
     */
    function createPlaceCard(place) {
        const card = document.createElement('div');
        card.className = 'place-card';
        card.onclick = () => {
            if (typeof showPlaceDetails === 'function') {
                showPlaceDetails(place);
            }
        };

        const categoryIcon = getCategoryIcon(place.category);
        const ratingHtml = place.rating ?
            `<div class="place-rating">
                <i class="fas fa-star"></i>
                <span>${place.rating}</span>
                ${place.ratingCount ? ` <span class="rating-count">(${place.ratingCount})</span>` : ''}
            </div>` : '';

        card.innerHTML = `
            <div class="place-image">
                <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;">
                    ${categoryIcon}
                </div>
            </div>
            <div class="place-content">
                <h3 class="place-name">${place.name}</h3>
                <p class="place-address">${place.address}</p>
                ${ratingHtml}
                <div class="place-actions">
                    <button class="btn-icon-small" onclick="event.stopPropagation(); addToFavorites(${place.id})" title="Add to favorites">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="btn-primary btn-small book-btn" 
                            data-place-id="${place.id}" 
                            data-place='${JSON.stringify(place).replace(/'/g, "&apos;")}' 
                            onclick="event.stopPropagation(); handleBookPlace(this)">
                        <i class="fas fa-calendar-plus"></i> Book
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    /**
     * Setup map controls (recenter, filter)
     * Leaflet allows custom controls using L.control
     */
    function setupMapControls() {
        // Recenter button
        const recenterBtn = document.getElementById('recenterBtn');
        if (recenterBtn) {
            recenterBtn.addEventListener('click', function () {
                if (currentUserLocation) {
                    updateMapCenter(currentUserLocation.lat, currentUserLocation.lng);
                    if (userMarker) {
                        userMarker.openPopup();
                    }
                } else if (typeof GeolocationModule !== 'undefined' && GeolocationModule.getCurrentLocation) {
                    GeolocationModule.getCurrentLocation()
                        .then(coords => {
                            currentUserLocation = coords;
                            updateMapCenter(coords.lat, coords.lng);
                            addUserMarker(coords.lat, coords.lng);
                        })
                        .catch(error => {
                            if (typeof showToast === 'function') {
                                showToast('Could not get your location', 'error');
                            }
                        });
                }
            });
        }

        // Filter button (placeholder - can be extended)
        const filterBtn = document.getElementById('filterMapBtn');
        if (filterBtn) {
            filterBtn.addEventListener('click', function () {
                // TODO: Implement filter functionality
                if (typeof showToast === 'function') {
                    showToast('Filter feature coming soon', 'info');
                }
            });
        }
    }

    /**
     * Setup view toggle between grid and map
     */
    function setupViewToggle() {
        const toggleButtons = document.querySelectorAll('.toggle-btn[data-view]');
        const mapContainer = document.getElementById('mapContainer');
        const placesGrid = document.getElementById('placesGrid');

        toggleButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                const view = this.dataset.view;

                // Update active state
                toggleButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                // Toggle views
                if (view === 'map') {
                    if (mapContainer) mapContainer.style.display = 'block';
                    if (placesGrid) placesGrid.style.display = 'none';

                    // Invalidate map size when switching to map view
                    // Leaflet needs this to render correctly after being hidden
                    setTimeout(() => {
                        if (map) {
                            map.invalidateSize();
                        }
                    }, 100);
                } else {
                    if (mapContainer) mapContainer.style.display = 'none';
                    if (placesGrid) placesGrid.style.display = 'grid';
                }
            });
        });
    }

    /**
     * Handle location input changes
     */
    function setupLocationSearch() {
        const locationInput = document.getElementById('locationInput');
        const searchBtn = document.getElementById('searchBtn');

        if (searchBtn) {
            searchBtn.addEventListener('click', function () {
                const query = locationInput?.value?.trim();
                if (query) {
                    searchPlacesByQuery(query);
                }
            });
        }

        if (locationInput) {
            locationInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    const query = this.value.trim();
                    if (query) {
                        searchPlacesByQuery(query);
                    }
                }
            });
        }
    }

    /**
     * Search places by query using Nominatim
     */
    function searchPlacesByQuery(query) {
        // Use Nominatim to geocode the query
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

        fetch(url, {
            headers: {
                'User-Agent': 'WanderNear/1.0'
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const result = data[0];
                    const lat = parseFloat(result.lat);
                    const lng = parseFloat(result.lon);

                    currentUserLocation = { lat, lng };
                    updateMapCenter(lat, lng);
                    addUserMarker(lat, lng);
                    searchNearbyPlaces(lat, lng);
                } else {
                    if (typeof showToast === 'function') {
                        showToast('Location not found', 'error');
                    }
                }
            })
            .catch(error => {
                console.error('Error searching location:', error);
                if (typeof showToast === 'function') {
                    showToast('Failed to search location', 'error');
                }
            });
    }

    /**
     * Filter places by category
     * @param {string} category - Category to filter by ('all', 'restaurant', 'cafe', 'lodging', 'museum', 'tourist_attraction')
     * @returns {Array} Filtered places array
     */
    function filterPlacesByCategory(category) {
        // If 'all', return all places
        if (category === 'all') {
            return allPlaces;
        }

        // Filter places that match the selected category
        return allPlaces.filter(place => place.category === category);
    }

    /**
     * Update display with filtered places
     * @param {string} category - Category to filter and display
     */
    function applyFilter(category) {
        // Update active category
        activeCategory = category;

        // Filter places
        const filteredPlaces = filterPlacesByCategory(category);

        // Update current places (for map and grid)
        currentPlaces = filteredPlaces;

        // Clear existing markers
        clearPlaceMarkers();

        // Add markers for filtered places
        filteredPlaces.forEach(place => {
            addPlaceMarker(place);
        });

        // Update grid view
        updatePlacesGrid(filteredPlaces);

        // Show toast message
        if (typeof showToast === 'function') {
            const categoryName = category === 'all' ? 'all places' :
                category === 'tourist_attraction' ? 'attractions' :
                    category === 'lodging' ? 'hotels' :
                        category + 's';
            showToast(`Showing ${filteredPlaces.length} ${categoryName}`, 'info');
        }
    }

    /**
     * Setup category filter buttons
     * Adds event listeners to all filter chip buttons
     */
    function setupCategoryFilters() {
        const filterButtons = document.querySelectorAll('.filter-chip[data-category]');

        filterButtons.forEach(button => {
            button.addEventListener('click', function () {
                // Get category from data attribute
                const category = this.dataset.category;

                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));

                // Add active class to clicked button
                this.classList.add('active');

                // Apply filter
                applyFilter(category);
            });
        });

        console.log('Category filters initialized:', filterButtons.length, 'buttons');
    }


    /**
     * Initialize app when DOM is ready
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Wait a bit for Leaflet to be available
        if (typeof L === 'undefined') {
            console.error('Leaflet.js is not loaded. Make sure Leaflet CSS and JS are included.');
            return;
        }

        // Initialize map
        initMap();

        // Setup location search
        setupLocationSearch();

        // Setup category filters
        setupCategoryFilters();

        // Setup Hero Buttons
        setupHeroButtons();
    }

    /**
     * Setup "Get Started" and "Watch Video" buttons
     */
    function setupHeroButtons() {
        // Get Started Button - Scroll to Explore
        const getStartedBtn = document.getElementById('getStartedBtn');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', function () {
                const exploreSection = document.getElementById('explore');
                if (exploreSection) {
                    exploreSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Watch Demo Button - Open Video Modal
        const watchVideoBtn = document.getElementById('watchVideoBtn');
        const videoModal = document.getElementById('videoModal');
        const videoModalClose = document.getElementById('videoModalClose');
        const videoModalOverlay = document.getElementById('videoModalOverlay');
        const demoVideo = document.getElementById('demoVideo');

        if (watchVideoBtn && videoModal) {
            watchVideoBtn.addEventListener('click', function () {
                videoModal.classList.add('active');
                // Auto-play video if desired (already handled by iframe src in HTML, but here we can ensure)
                if (demoVideo && demoVideo.src.indexOf('autoplay=1') === -1) {
                    demoVideo.src += "&autoplay=1";
                }
            });
        }

        // Close Video Modal
        function closeVideoModal() {
            if (videoModal) {
                videoModal.classList.remove('active');
                // Stop video by resetting src (or posting message)
                if (demoVideo) {
                    const src = demoVideo.src;
                    demoVideo.src = src.replace('&autoplay=1', ''); // Stop autoplay on close
                    // Trigger stop via API or just reload it to stop sound
                    demoVideo.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
                }
            }
        }

        if (videoModalClose) {
            videoModalClose.addEventListener('click', closeVideoModal);
        }

        if (videoModalOverlay) {
            videoModalOverlay.addEventListener('click', closeVideoModal);
        }
    }

    // Export functions for global access
    window.openPlaceDetails = function (placeId) {
        const place = currentPlaces.find(p => p.id === placeId);
        if (place && typeof showPlaceDetails === 'function') {
            showPlaceDetails(place);
        }
    };

    /**
     * Handle booking a place
     * Integrates with BookingsModule
     */
    window.handleBookPlace = function (button) {
        try {
            // Get place data from button's data attribute
            const placeData = button.dataset.place;
            const place = JSON.parse(placeData);

            // Use BookingsModule if available
            if (typeof BookingsModule !== 'undefined' && BookingsModule.addBooking) {
                BookingsModule.addBooking(place);
            } else {
                console.error('BookingsModule not loaded');
                showToast('Bookings system not available', 'error');
            }
        } catch (error) {
            console.error('Error booking place:', error);
            showToast('Failed to book place', 'error');
        }
    };

    /**
     * Add to favorites (placeholder for future implementation)
     */
    window.addToFavorites = function (placeId) {
        const place = currentPlaces.find(p => p.id === placeId);
        if (place) {
            showToast(`${place.name} added to favorites!`, 'success');
            console.log('Add to favorites:', place);
        }
    };

    // Initialize when script loads
    init();

    // Make initMap available globally (for callback if needed)
    window.initMap = initMap;

    // Expose places data for trip planner module
    window.currentPlaces = currentPlaces;
    window.allPlaces = allPlaces;

    // Update window.currentPlaces and window.allPlaces whenever they change
    const originalDisplayPlaces = displayPlaces;
    displayPlaces = function (places) {
        originalDisplayPlaces(places);
        window.currentPlaces = currentPlaces;
        window.allPlaces = allPlaces;
    };
})();


