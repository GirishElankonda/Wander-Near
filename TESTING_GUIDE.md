# 🧪 Testing Guide - Category Filtering

## Quick Test Checklist

### ✅ Pre-Test Setup
1. Open `index.html` in a web browser
2. Open browser DevTools Console (F12)
3. Grant location permissions if prompted

---

## 🎯 Test Scenarios

### Test 1: Initial State
**Expected Result:**
- ✅ "All" button should have `active` class
- ✅ All places should be visible on map and grid
- ✅ Console shows: "Category filters initialized: 6 buttons"

---

### Test 2: Filter by Restaurants
**Steps:**
1. Search for "Chennai" or any location
2. Wait for places to load
3. Click on "Restaurants" button

**Expected Result:**
- ✅ "Restaurants" button becomes active (highlighted)
- ✅ Other buttons lose active state
- ✅ Map shows only restaurant markers
- ✅ Grid shows only restaurant cards
- ✅ Toast shows: "Showing X restaurants"
- ✅ Console shows filtered count

---

### Test 3: Filter by Cafes
**Steps:**
1. Click on "Cafes" button

**Expected Result:**
- ✅ "Cafes" button becomes active
- ✅ Map updates to show only cafe markers
- ✅ Grid updates to show only cafe cards
- ✅ Toast shows: "Showing X cafes"
- ✅ No page reload occurs

---

### Test 4: Filter by Attractions
**Steps:**
1. Click on "Attractions" button

**Expected Result:**
- ✅ "Attractions" button becomes active
- ✅ Shows tourist attractions, parks, stadiums
- ✅ Toast shows: "Showing X attractions"
- ✅ Empty state if no attractions found

---

### Test 5: Filter by Hotels
**Steps:**
1. Click on "Hotels" button

**Expected Result:**
- ✅ "Hotels" button becomes active
- ✅ Shows only hotels/lodging
- ✅ Toast shows: "Showing X hotels"

---

### Test 6: Filter by Museums
**Steps:**
1. Click on "Museums" button

**Expected Result:**
- ✅ "Museums" button becomes active
- ✅ Shows museums and galleries
- ✅ Toast shows: "Showing X museums"

---

### Test 7: Return to All
**Steps:**
1. Click on "All" button

**Expected Result:**
- ✅ "All" button becomes active
- ✅ All places shown again
- ✅ Toast shows: "Showing X all places"
- ✅ Count matches original total

---

### Test 8: Empty State
**Steps:**
1. Search for a location with limited places
2. Filter by a category with 0 results (e.g., Museums in a small town)

**Expected Result:**
- ✅ Shows empty state message
- ✅ Message says "No museums found"
- ✅ Suggests trying different category
- ✅ Map has no markers
- ✅ Grid shows empty state UI

---

### Test 9: Rapid Switching
**Steps:**
1. Quickly click: Restaurants → Cafes → Hotels → All

**Expected Result:**
- ✅ No UI glitches
- ✅ Active button always updates correctly
- ✅ Display always matches selected category
- ✅ No console errors

---

### Test 10: Category Before Load
**Steps:**
1. Refresh page
2. Immediately click "Restaurants" before places load
3. Enter location and search

**Expected Result:**
- ✅ "Restaurants" button stays active
- ✅ When places load, only restaurants appear
- ✅ No errors in console

---

## 🔍 Console Debugging

### Check Master Array
```javascript
// In browser console
console.log('All places:', allPlaces);
console.log('Current places:', currentPlaces);
console.log('Active category:', activeCategory);
```

### Manual Filter Test
```javascript
// Test filtering manually
const restaurants = allPlaces.filter(p => p.category === 'restaurant');
console.log('Restaurants:', restaurants.length);

const cafes = allPlaces.filter(p => p.category === 'cafe');
console.log('Cafes:', cafes.length);
```

### Check Place Categories
```javascript
// View all unique categories
const categories = [...new Set(allPlaces.map(p => p.category))];
console.log('Available categories:', categories);
```

---

## 📊 Expected Category Distribution (Chennai Example)

Typical results for "Chennai":
- **Restaurants**: 20-30 places
- **Cafes**: 10-15 places
- **Attractions**: 15-20 places
- **Hotels**: 5-10 places
- **Museums**: 3-5 places
- **Total**: 50-80 places

---

## 🐛 Common Issues & Solutions

### Issue 1: No filtering happens
**Check:**
- Console shows "Category filters initialized: 6 buttons"?
- Buttons have `data-category` attribute?
- `setupCategoryFilters()` is called in `init()`?

### Issue 2: Wrong places shown
**Check:**
- `place.category` field exists on all places?
- `CATEGORY_MAPPING` is correct?
- `filterPlacesByCategory()` uses correct field?

### Issue 3: Active button not updating
**Check:**
- CSS for `.filter-chip.active` exists?
- Event listener removes/adds class correctly?
- No CSS override preventing visibility?

### Issue 4: Empty state not showing
**Check:**
- `activeCategory` is set before calling `updatePlacesGrid()`?
- Empty state HTML is correct?
- Grid container isn't hidden?

---

## ✨ Success Indicators

Your implementation is working correctly if:

1. ✅ All 6 category buttons are clickable
2. ✅ Only one button is active at a time
3. ✅ Map and grid both update on filter
4. ✅ Filter works without API calls (uses cache)
5. ✅ Empty states show appropriate messages
6. ✅ Toast notifications show correct counts
7. ✅ No page reloads occur
8. ✅ Console shows no errors

---

## 📝 Sample Test Log

```
=== WanderNear Category Filtering Test ===

[✓] Loaded index.html
[✓] Location: Chennai
[✓] Fetched 52 places
[✓] All categories initialized

Test 1: Filter Restaurants
  [✓] Button active: Restaurants
  [✓] Map markers: 18
  [✓] Grid cards: 18
  [✓] Toast: "Showing 18 restaurants"

Test 2: Filter Cafes
  [✓] Button active: Cafes
  [✓] Map markers: 12
  [✓] Grid cards: 12
  [✓] Toast: "Showing 12 cafes"

Test 3: Filter Attractions
  [✓] Button active: Attractions
  [✓] Map markers: 15
  [✓] Grid cards: 15
  [✓] Toast: "Showing 15 attractions"

Test 4: Return to All
  [✓] Button active: All
  [✓] Map markers: 52
  [✓] Grid cards: 52
  [✓] Toast: "Showing 52 all places"

=== ALL TESTS PASSED ✅ ===
```

---

## 🎓 Understanding the Flow

### Data Flow
```
API Response → parseOverpassResults() 
           → Adds .category field
           → Stored in allPlaces[]
           → User clicks category button
           → filterPlacesByCategory()
           → Returns filtered array
           → Updates map & grid
```

### UI Update Flow
```
Button Click → Get data-category
            → Remove all .active classes
            → Add .active to clicked
            → Call applyFilter(category)
            → Filter allPlaces
            → Clear markers
            → Add new markers
            → Update grid
            → Show toast
```

---

## 🎉 Ready to Test!

Your category filtering implementation is complete and ready for testing. Follow the scenarios above to ensure everything works as expected!
