/**
 * EXAMPLE: Category Filtering Usage
 * 
 * This file demonstrates how the category filtering works in WanderNear
 */

// =============================================================================
// 1. CATEGORY MAPPING CONFIGURATION
// =============================================================================

/**
 * Maps raw OSM tags to normalized filter categories
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


// =============================================================================
// 2. EXAMPLE PLACE OBJECTS
// =============================================================================

/**
 * Example of a parsed place object with category
 */
const examplePlaces = [
    {
        id: 1,
        name: "Annapurna Restaurant",
        address: "123 Anna Salai, Chennai",
        rawCategory: "restaurant",
        category: "restaurant",     // Normalized for filtering
        lat: 13.0827,
        lng: 80.2707
    },
    {
        id: 2,
        name: "Chennai Coffee House",
        address: "456 Mount Road, Chennai",
        rawCategory: "cafe",
        category: "cafe",
        lat: 13.0545,
        lng: 80.2511
    },
    {
        id: 3,
        name: "Marina Beach",
        address: "Marina Beach, Chennai",
        rawCategory: "park",
        category: "tourist_attraction",  // Mapped from 'park'
        lat: 13.0487,
        lng: 80.2825
    },
    {
        id: 4,
        name: "The Taj Hotel",
        address: "789 Park Street, Chennai",
        rawCategory: "hotel",
        category: "lodging",         // Mapped to 'lodging'
        lat: 13.0569,
        lng: 80.2425
    },
    {
        id: 5,
        name: "Government Museum",
        address: "Pantheon Road, Chennai",
        rawCategory: "museum",
        category: "museum",
        lat: 13.0732,
        lng: 80.2609
    }
];


// =============================================================================
// 3. FILTERING FUNCTION
// =============================================================================

/**
 * Filter places by category
 * @param {Array} places - Array of all places
 * @param {string} category - Category to filter by
 * @returns {Array} Filtered places
 */
function filterPlacesByCategory(places, category) {
    // If 'all', return all places
    if (category === 'all') {
        return places;
    }

    // Filter places that match the selected category
    return places.filter(place => place.category === category);
}


// =============================================================================
// 4. USAGE EXAMPLES
// =============================================================================

console.log('=== CATEGORY FILTERING EXAMPLES ===\n');

// Example 1: Filter all restaurants
console.log('1. Filter RESTAURANTS:');
const restaurants = filterPlacesByCategory(examplePlaces, 'restaurant');
console.log(`Found ${restaurants.length} restaurant(s):`);
restaurants.forEach(p => console.log(`   - ${p.name}`));
console.log('');

// Example 2: Filter all cafes
console.log('2. Filter CAFES:');
const cafes = filterPlacesByCategory(examplePlaces, 'cafe');
console.log(`Found ${cafes.length} cafe(s):`);
cafes.forEach(p => console.log(`   - ${p.name}`));
console.log('');

// Example 3: Filter all attractions
console.log('3. Filter ATTRACTIONS:');
const attractions = filterPlacesByCategory(examplePlaces, 'tourist_attraction');
console.log(`Found ${attractions.length} attraction(s):`);
attractions.forEach(p => console.log(`   - ${p.name}`));
console.log('');

// Example 4: Filter all hotels
console.log('4. Filter HOTELS:');
const hotels = filterPlacesByCategory(examplePlaces, 'lodging');
console.log(`Found ${hotels.length} hotel(s):`);
hotels.forEach(p => console.log(`   - ${p.name}`));
console.log('');

// Example 5: Filter all museums
console.log('5. Filter MUSEUMS:');
const museums = filterPlacesByCategory(examplePlaces, 'museum');
console.log(`Found ${museums.length} museum(s):`);
museums.forEach(p => console.log(`   - ${p.name}`));
console.log('');

// Example 6: Show all places
console.log('6. Show ALL:');
const all = filterPlacesByCategory(examplePlaces, 'all');
console.log(`Found ${all.length} place(s) total:`);
all.forEach(p => console.log(`   - ${p.name} [${p.category}]`));
console.log('');


// =============================================================================
// 5. UI UPDATE EXAMPLE
// =============================================================================

/**
 * Example of how the UI updates when a category is selected
 */
function applyFilterExample(category) {
    console.log(`\n=== APPLYING FILTER: ${category.toUpperCase()} ===`);

    // 1. Filter the places
    const filteredPlaces = filterPlacesByCategory(examplePlaces, category);
    console.log(`Step 1: Filtered to ${filteredPlaces.length} places`);

    // 2. Update button active state
    console.log(`Step 2: Set '${category}' button as active`);

    // 3. Clear and update map markers
    console.log(`Step 3: Clear existing map markers`);
    console.log(`Step 4: Add ${filteredPlaces.length} new markers to map`);

    // 4. Update grid view
    console.log(`Step 5: Update grid with ${filteredPlaces.length} cards`);

    // 5. Show notification
    const categoryName = category === 'all' ? 'all places' :
        category === 'tourist_attraction' ? 'attractions' :
            category === 'lodging' ? 'hotels' :
                category + 's';
    console.log(`Step 6: Show toast: "Showing ${filteredPlaces.length} ${categoryName}"`);
}

// Test the UI update flow
console.log('\n\n=== UI UPDATE FLOW EXAMPLES ===');
applyFilterExample('restaurant');
applyFilterExample('cafe');
applyFilterExample('tourist_attraction');
applyFilterExample('all');


// =============================================================================
// 6. HTML BUTTON STRUCTURE
// =============================================================================

console.log('\n\n=== HTML BUTTON STRUCTURE ===\n');
console.log(`
<div class="search-filters">
    <!-- All button - active by default -->
    <button class="filter-chip active" data-category="all">
        <i class="fas fa-globe"></i> All
    </button>
    
    <!-- Restaurant button -->
    <button class="filter-chip" data-category="restaurant">
        <i class="fas fa-utensils"></i> Restaurants
    </button>
    
    <!-- Attractions button -->
    <button class="filter-chip" data-category="tourist_attraction">
        <i class="fas fa-landmark"></i> Attractions
    </button>
    
    <!-- Hotels button -->
    <button class="filter-chip" data-category="lodging">
        <i class="fas fa-hotel"></i> Hotels
    </button>
    
    <!-- Cafes button -->
    <button class="filter-chip" data-category="cafe">
        <i class="fas fa-coffee"></i> Cafes
    </button>
    
    <!-- Museums button -->
    <button class="filter-chip" data-category="museum">
        <i class="fas fa-building-columns"></i> Museums
    </button>
</div>
`);


// =============================================================================
// 7. EVENT LISTENER SETUP
// =============================================================================

console.log('\n=== EVENT LISTENER SETUP ===\n');
console.log(`
// Select all filter buttons
const filterButtons = document.querySelectorAll('.filter-chip[data-category]');

// Add click listener to each button
filterButtons.forEach(button => {
    button.addEventListener('click', function() {
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
`);


// =============================================================================
// 8. EXPECTED OUTPUT SUMMARY
// =============================================================================

console.log('\n\n=== SUMMARY ===\n');
console.log('✅ Category mapping: OSM tags → filter categories');
console.log('✅ Filter function: Pure JavaScript, no page reload');
console.log('✅ UI updates: Active button, map markers, grid cards');
console.log('✅ Data structure: Each place has .category field');
console.log('✅ Empty states: Shows when no places match filter');
console.log('✅ Toast notifications: Shows count of filtered places');
console.log('\nThe category filtering system is fully functional! 🎉\n');
