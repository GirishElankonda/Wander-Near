/**
 * WanderNear - Budget-Based Auto Trip Planner Module
 * 
 * Features:
 * - Budget allocation across categories (food, attractions, transport, buffer)
 * - Auto mode for intelligent itinerary generation
 * - Manual mode for user-selected places
 * - 1-day and multi-day planning support
 * - Time-ordered itinerary generation
 * - Regeneration capability
 */

const TripPlannerModule = (function () {
    'use strict';

    // State management
    let currentBudget = 0;
    let isAutoMode = false;
    let planDuration = 1; // days
    let currentItinerary = null;
    let availablePlaces = [];

    // Budget allocation percentages (can be adjusted)
    const BUDGET_ALLOCATION = {
        food: 0.40,           // 40%
        attractions: 0.35,    // 35%
        transport: 0.15,      // 15%
        buffer: 0.10          // 10%
    };

    // Average cost estimation (in local currency)
    const AVERAGE_COSTS = {
        restaurant: { min: 15, max: 50, avg: 30 },
        cafe: { min: 5, max: 20, avg: 10 },
        fast_food: { min: 8, max: 15, avg: 12 },
        tourist_attraction: { min: 10, max: 40, avg: 20 },
        museum: { min: 8, max: 25, avg: 15 },
        lodging: { min: 50, max: 200, avg: 100 },
        park: { min: 0, max: 10, avg: 5 }
    };

    // Time slots for itinerary
    const TIME_SLOTS = {
        morning: { start: '08:00', end: '12:00', label: 'Morning' },
        afternoon: { start: '12:00', end: '17:00', label: 'Afternoon' },
        evening: { start: '17:00', end: '22:00', label: 'Evening' }
    };

    /**
     * Initialize the trip planner module
     */
    function init() {
        console.log('Trip Planner Module initializing...');
        setupEventListeners();
        updateUIState();
    }

    /**
     * Setup event listeners for trip planner UI
     */
    function setupEventListeners() {
        // Budget input
        const budgetInput = document.getElementById('budgetInput');
        if (budgetInput) {
            budgetInput.addEventListener('input', handleBudgetChange);
        }

        // Auto mode toggle
        const autoToggle = document.getElementById('autoModeToggle');
        if (autoToggle) {
            autoToggle.addEventListener('change', handleAutoModeToggle);
        }

        // Plan duration selector
        const durationBtns = document.querySelectorAll('.duration-btn');
        durationBtns.forEach(btn => {
            btn.addEventListener('click', handleDurationSelect);
        });

        // Generate plan button
        const generateBtn = document.getElementById('generatePlanBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', handleGeneratePlan);
        }

        // Regenerate button
        const regenerateBtn = document.getElementById('regeneratePlanBtn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', handleRegeneratePlan);
        }

        console.log('Trip Planner event listeners setup complete');
    }

    /**
     * Handle budget input change
     */
    function handleBudgetChange(e) {
        currentBudget = parseFloat(e.target.value) || 0;
        updateBudgetDisplay();
        validateInputs();
    }

    /**
     * Handle auto mode toggle
     */
    function handleAutoModeToggle(e) {
        isAutoMode = e.target.checked;
        updateUIState();

        if (typeof showToast === 'function') {
            showToast(
                isAutoMode ? 'Auto mode enabled - AI will plan your trip!' : 'Manual mode - Select places yourself',
                'info'
            );
        }
    }

    /**
     * Handle duration selection
     */
    function handleDurationSelect(e) {
        const duration = parseInt(e.target.dataset.duration);
        planDuration = duration;

        // Update button states
        document.querySelectorAll('.duration-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');

        updateBudgetDisplay();
        validateInputs();
    }

    /**
     * Update budget display with allocation breakdown
     */
    function updateBudgetDisplay() {
        const display = document.getElementById('budgetBreakdown');
        if (!display || currentBudget === 0) {
            if (display) display.innerHTML = '';
            return;
        }

        const perDay = currentBudget / planDuration;
        const breakdown = {
            food: perDay * BUDGET_ALLOCATION.food,
            attractions: perDay * BUDGET_ALLOCATION.attractions,
            transport: perDay * BUDGET_ALLOCATION.transport,
            buffer: perDay * BUDGET_ALLOCATION.buffer
        };

        display.innerHTML = `
            <div class="budget-breakdown-card">
                <h4>Budget Allocation ${planDuration > 1 ? `(Per Day: $${perDay.toFixed(2)})` : ''}</h4>
                <div class="allocation-grid">
                    <div class="allocation-item">
                        <div class="allocation-icon">🍽️</div>
                        <div class="allocation-details">
                            <span class="allocation-label">Food</span>
                            <span class="allocation-value">$${breakdown.food.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="allocation-item">
                        <div class="allocation-icon">🎯</div>
                        <div class="allocation-details">
                            <span class="allocation-label">Attractions</span>
                            <span class="allocation-value">$${breakdown.attractions.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="allocation-item">
                        <div class="allocation-icon">🚗</div>
                        <div class="allocation-details">
                            <span class="allocation-label">Transport</span>
                            <span class="allocation-value">$${breakdown.transport.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="allocation-item">
                        <div class="allocation-icon">💰</div>
                        <div class="allocation-details">
                            <span class="allocation-label">Buffer</span>
                            <span class="allocation-value">$${breakdown.buffer.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Update UI state based on mode
     */
    function updateUIState() {
        const manualSection = document.getElementById('manualSelectionSection');
        const autoSection = document.getElementById('autoGenerationSection');

        if (isAutoMode) {
            if (manualSection) manualSection.style.display = 'none';
            if (autoSection) autoSection.style.display = 'block';
        } else {
            if (manualSection) manualSection.style.display = 'block';
            if (autoSection) autoSection.style.display = 'none';
        }
    }

    /**
     * Validate inputs before generating plan
     */
    function validateInputs() {
        const generateBtn = document.getElementById('generatePlanBtn');
        if (!generateBtn) return;

        const isValid = currentBudget > 0 && planDuration > 0;
        generateBtn.disabled = !isValid;

        if (isValid) {
            generateBtn.classList.remove('disabled');
        } else {
            generateBtn.classList.add('disabled');
        }
    }

    /**
     * Handle generate plan button click
     */
    function handleGeneratePlan() {
        if (!validateBeforeGeneration()) {
            return;
        }

        if (isAutoMode) {
            generateAutoPlan();
        } else {
            enableManualSelection();
        }
    }

    /**
     * Handle regenerate plan
     */
    function handleRegeneratePlan() {
        if (typeof showToast === 'function') {
            showToast('Generating a new plan...', 'info');
        }
        generateAutoPlan();
    }

    /**
     * Validate before generation
     */
    function validateBeforeGeneration() {
        if (currentBudget <= 0) {
            if (typeof showToast === 'function') {
                showToast('Please enter a valid budget', 'error');
            }
            return false;
        }

        if (planDuration <= 0) {
            if (typeof showToast === 'function') {
                showToast('Please select plan duration', 'error');
            }
            return false;
        }

        return true;
    }

    /**
     * Generate automatic trip plan
     */
    function generateAutoPlan() {
        // Show loading state
        showLoadingState();

        // Get available places from main app
        const places = getAvailablePlaces();

        if (!places || places.length === 0) {
            hideLoadingState();
            if (typeof showToast === 'function') {
                showToast('No places available. Please search for a location first.', 'warning');
            }
            return;
        }

        // Generate itinerary
        const itinerary = buildItinerary(places, currentBudget, planDuration);

        // Store current itinerary
        currentItinerary = itinerary;

        // Display itinerary
        displayItinerary(itinerary);

        // Hide loading state
        hideLoadingState();

        // Show success message
        if (typeof showToast === 'function') {
            showToast('Trip plan generated successfully!', 'success');
        }
    }

    /**
     * Get available places from the main app
     */
    function getAvailablePlaces() {
        // Try to get places from the global app state
        if (window.currentPlaces && window.currentPlaces.length > 0) {
            return window.currentPlaces;
        }

        // Try to get from app module
        if (window.allPlaces && window.allPlaces.length > 0) {
            return window.allPlaces;
        }

        // Return empty array if no places available
        return [];
    }

    /**
     * Build itinerary based on budget and duration
     */
    function buildItinerary(places, budget, days) {
        const itinerary = {
            totalBudget: budget,
            days: days,
            budgetPerDay: budget / days,
            dailyPlans: [],
            totalEstimatedCost: 0
        };

        const budgetPerDay = budget / days;
        const usedPlaces = new Set(); // Track used places to avoid repetition

        // Generate plan for each day
        for (let day = 1; day <= days; day++) {
            const dailyPlan = generateDailyPlan(places, budgetPerDay, day, usedPlaces);
            itinerary.dailyPlans.push(dailyPlan);
            itinerary.totalEstimatedCost += dailyPlan.estimatedCost;
        }

        return itinerary;
    }

    /**
     * Generate plan for a single day
     */
    function generateDailyPlan(places, dayBudget, dayNumber, usedPlaces) {
        const plan = {
            day: dayNumber,
            budget: dayBudget,
            estimatedCost: 0,
            slots: {
                morning: [],
                afternoon: [],
                evening: []
            }
        };

        // Calculate budget for each category
        const budgets = {
            food: dayBudget * BUDGET_ALLOCATION.food,
            attractions: dayBudget * BUDGET_ALLOCATION.attractions,
            transport: dayBudget * BUDGET_ALLOCATION.transport
        };

        // Separate places by category
        const restaurants = filterAndSortPlaces(places, ['restaurant', 'fast_food', 'cafe'], usedPlaces);
        const attractions = filterAndSortPlaces(places, ['tourist_attraction', 'museum', 'park'], usedPlaces);

        // Morning: Breakfast + Attraction
        const breakfast = selectPlace(restaurants, budgets.food * 0.25, usedPlaces);
        if (breakfast) {
            plan.slots.morning.push({
                time: '08:00',
                type: 'food',
                place: breakfast,
                estimatedCost: getEstimatedCost(breakfast)
            });
            plan.estimatedCost += getEstimatedCost(breakfast);
        }

        const morningAttraction = selectPlace(attractions, budgets.attractions * 0.4, usedPlaces);
        if (morningAttraction) {
            plan.slots.morning.push({
                time: '10:00',
                type: 'attraction',
                place: morningAttraction,
                estimatedCost: getEstimatedCost(morningAttraction)
            });
            plan.estimatedCost += getEstimatedCost(morningAttraction);
        }

        // Afternoon: Lunch + Attraction
        const lunch = selectPlace(restaurants, budgets.food * 0.40, usedPlaces);
        if (lunch) {
            plan.slots.afternoon.push({
                time: '13:00',
                type: 'food',
                place: lunch,
                estimatedCost: getEstimatedCost(lunch)
            });
            plan.estimatedCost += getEstimatedCost(lunch);
        }

        const afternoonAttraction = selectPlace(attractions, budgets.attractions * 0.4, usedPlaces);
        if (afternoonAttraction) {
            plan.slots.afternoon.push({
                time: '15:00',
                type: 'attraction',
                place: afternoonAttraction,
                estimatedCost: getEstimatedCost(afternoonAttraction)
            });
            plan.estimatedCost += getEstimatedCost(afternoonAttraction);
        }

        // Evening: Dinner + Optional Activity
        const dinner = selectPlace(restaurants, budgets.food * 0.35, usedPlaces);
        if (dinner) {
            plan.slots.evening.push({
                time: '19:00',
                type: 'food',
                place: dinner,
                estimatedCost: getEstimatedCost(dinner)
            });
            plan.estimatedCost += getEstimatedCost(dinner);
        }

        const eveningActivity = selectPlace(attractions, budgets.attractions * 0.2, usedPlaces);
        if (eveningActivity) {
            plan.slots.evening.push({
                time: '20:30',
                type: 'attraction',
                place: eveningActivity,
                estimatedCost: getEstimatedCost(eveningActivity)
            });
            plan.estimatedCost += getEstimatedCost(eveningActivity);
        }

        // Add transport cost
        plan.estimatedCost += budgets.transport;

        return plan;
    }

    /**
     * Filter and sort places by category
     */
    function filterAndSortPlaces(places, categories, usedPlaces) {
        return places
            .filter(place => {
                // Check if place matches any of the categories
                if (!place.category && !place.rawCategory) return false;
                const placeCategory = place.category || place.rawCategory;
                return categories.includes(placeCategory);
            })
            .filter(place => !usedPlaces.has(place.id)) // Exclude already used places
            .sort((a, b) => {
                // Sort by rating (if available), then by name
                if (a.rating && b.rating) {
                    return b.rating - a.rating;
                }
                return a.name.localeCompare(b.name);
            });
    }

    /**
     * Select a place within budget constraint
     */
    function selectPlace(places, maxBudget, usedPlaces) {
        for (const place of places) {
            const estimatedCost = getEstimatedCost(place);
            if (estimatedCost <= maxBudget && !usedPlaces.has(place.id)) {
                usedPlaces.add(place.id);
                return place;
            }
        }
        // If no place within budget, return cheapest available
        if (places.length > 0 && !usedPlaces.has(places[0].id)) {
            usedPlaces.add(places[0].id);
            return places[0];
        }
        return null;
    }

    /**
     * Get estimated cost for a place
     */
    function getEstimatedCost(place) {
        const category = place.category || place.rawCategory || 'restaurant';
        const costs = AVERAGE_COSTS[category] || AVERAGE_COSTS.restaurant;
        return costs.avg;
    }

    /**
     * Display generated itinerary
     */
    function displayItinerary(itinerary) {
        const container = document.getElementById('itineraryContainer');
        if (!container) return;

        container.innerHTML = '';

        // Show regenerate button
        const regenerateBtn = document.getElementById('regeneratePlanBtn');
        if (regenerateBtn) {
            regenerateBtn.style.display = 'inline-flex';
        }

        // Create summary card
        const summaryCard = createSummaryCard(itinerary);
        container.appendChild(summaryCard);

        // Create daily plan cards
        itinerary.dailyPlans.forEach(dailyPlan => {
            const dayCard = createDayCard(dailyPlan, itinerary.days);
            container.appendChild(dayCard);
        });

        // Scroll to itinerary
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Create summary card
     */
    function createSummaryCard(itinerary) {
        const card = document.createElement('div');
        card.className = 'itinerary-summary-card';

        const budgetUtilization = (itinerary.totalEstimatedCost / itinerary.totalBudget) * 100;
        const remaining = itinerary.totalBudget - itinerary.totalEstimatedCost;

        card.innerHTML = `
            <h3>Trip Summary</h3>
            <div class="summary-stats">
                <div class="summary-stat">
                    <div class="stat-icon">📅</div>
                    <div class="stat-content">
                        <span class="stat-label">Duration</span>
                        <span class="stat-value">${itinerary.days} ${itinerary.days === 1 ? 'Day' : 'Days'}</span>
                    </div>
                </div>
                <div class="summary-stat">
                    <div class="stat-icon">💵</div>
                    <div class="stat-content">
                        <span class="stat-label">Total Budget</span>
                        <span class="stat-value">$${itinerary.totalBudget.toFixed(2)}</span>
                    </div>
                </div>
                <div class="summary-stat">
                    <div class="stat-icon">💰</div>
                    <div class="stat-content">
                        <span class="stat-label">Estimated Cost</span>
                        <span class="stat-value">$${itinerary.totalEstimatedCost.toFixed(2)}</span>
                    </div>
                </div>
                <div class="summary-stat">
                    <div class="stat-icon">🏦</div>
                    <div class="stat-content">
                        <span class="stat-label">Remaining</span>
                        <span class="stat-value ${remaining >= 0 ? 'text-success' : 'text-error'}">$${Math.abs(remaining).toFixed(2)}</span>
                    </div>
                </div>
            </div>
            <div class="budget-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(budgetUtilization, 100)}%"></div>
                </div>
                <span class="progress-label">${budgetUtilization.toFixed(1)}% of budget utilized</span>
            </div>
        `;

        return card;
    }

    /**
     * Create day card
     */
    function createDayCard(dailyPlan, totalDays) {
        const card = document.createElement('div');
        card.className = 'day-card';

        let slotsHTML = '';

        // Morning
        if (dailyPlan.slots.morning.length > 0) {
            slotsHTML += createTimeSlotHTML('Morning', '08:00 - 12:00', dailyPlan.slots.morning);
        }

        // Afternoon
        if (dailyPlan.slots.afternoon.length > 0) {
            slotsHTML += createTimeSlotHTML('Afternoon', '12:00 - 17:00', dailyPlan.slots.afternoon);
        }

        // Evening
        if (dailyPlan.slots.evening.length > 0) {
            slotsHTML += createTimeSlotHTML('Evening', '17:00 - 22:00', dailyPlan.slots.evening);
        }

        card.innerHTML = `
            <div class="day-header">
                <h4>Day ${dailyPlan.day}${totalDays > 1 ? ` of ${totalDays}` : ''}</h4>
                <span class="day-budget">Budget: $${dailyPlan.budget.toFixed(2)} | Estimated: $${dailyPlan.estimatedCost.toFixed(2)}</span>
            </div>
            <div class="day-timeline">
                ${slotsHTML}
            </div>
        `;

        return card;
    }

    /**
     * Create time slot HTML
     */
    function createTimeSlotHTML(slotName, timeRange, activities) {
        let activitiesHTML = activities.map(activity => `
            <div class="activity-item" data-place-id="${activity.place.id}">
                <div class="activity-time">${activity.time}</div>
                <div class="activity-details">
                    <div class="activity-icon">${getActivityIcon(activity.type, activity.place.category)}</div>
                    <div class="activity-content">
                        <h5 class="activity-name">${activity.place.name}</h5>
                        <p class="activity-address">${activity.place.address || 'Address not available'}</p>
                        <div class="activity-meta">
                            ${activity.place.rating ? `<span class="activity-rating">⭐ ${activity.place.rating}</span>` : ''}
                            <span class="activity-cost">~$${activity.estimatedCost.toFixed(2)}</span>
                        </div>
                    </div>
                    <button class="btn-icon-small activity-action" onclick="TripPlannerModule.viewPlaceDetails(${activity.place.id})" title="View details">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
        `).join('');

        return `
            <div class="time-slot">
                <div class="slot-header">
                    <span class="slot-name">${slotName}</span>
                    <span class="slot-time">${timeRange}</span>
                </div>
                <div class="slot-activities">
                    ${activitiesHTML}
                </div>
            </div>
        `;
    }

    /**
     * Get activity icon based on type
     */
    function getActivityIcon(type, category) {
        if (type === 'food') {
            if (category === 'cafe') return '☕';
            if (category === 'fast_food') return '🍔';
            return '🍽️';
        }
        if (type === 'attraction') {
            if (category === 'museum') return '🏛️';
            if (category === 'park') return '🌳';
            return '🎯';
        }
        return '📍';
    }

    /**
     * Enable manual selection mode
     */
    function enableManualSelection() {
        if (typeof showToast === 'function') {
            showToast('Manual mode: Browse and select places to add to your itinerary', 'info');
        }

        // Highlight explore section
        const exploreSection = document.getElementById('explore');
        if (exploreSection) {
            exploreSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * Show loading state
     */
    function showLoadingState() {
        const container = document.getElementById('itineraryContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Generating your perfect trip plan...</p>
                </div>
            `;
        }
    }

    /**
     * Hide loading state
     */
    function hideLoadingState() {
        // Loading state will be replaced by itinerary content
    }

    /**
     * View place details
     */
    function viewPlaceDetails(placeId) {
        // Try to use existing place details function
        if (typeof window.openPlaceDetails === 'function') {
            window.openPlaceDetails(placeId);
        } else {
            console.log('View details for place:', placeId);
        }
    }

    /**
     * Export itinerary as PDF or share
     */
    function exportItinerary() {
        if (!currentItinerary) {
            if (typeof showToast === 'function') {
                showToast('No itinerary to export', 'warning');
            }
            return;
        }

        // TODO: Implement PDF export or sharing functionality
        if (typeof showToast === 'function') {
            showToast('Export feature coming soon!', 'info');
        }
    }

    // Public API
    return {
        init,
        generateAutoPlan,
        viewPlaceDetails,
        exportItinerary,
        getCurrentItinerary: () => currentItinerary
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        TripPlannerModule.init();
    });
} else {
    TripPlannerModule.init();
}

// Expose module globally
window.TripPlannerModule = TripPlannerModule;
