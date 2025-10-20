# 🚀 API Optimization Strategy for FM-Tracker

## 📊 **API Limit: 100 calls/day**

### **Phase 1: Zero-API Migration** (Day 1)
- ✅ Migrate existing competitions to `apiCompetitions` collection
- ✅ Create initial structure without API calls
- ✅ Preserve all existing data

```bash
npx tsx src/scripts/migration/strategicApiMigration.ts
```

### **Phase 2: Priority-Based Team Fetching** (Days 1-N)
**Smart prioritization:**
1. **Competitions with existing teams** (1000+ priority)
2. **Top-tier leagues** (500+ priority)
3. **Major countries** (ES, EN, DE, IT, FR, BR, AR) (+100 priority)
4. **Leagues over cups** (+50 priority)

**Daily budget allocation:**
- 🎯 **80-90 calls**: Strategic migration
- 🔄 **10-20 calls**: Daily maintenance buffer

### **Phase 3: Ongoing Maintenance** (Daily)
**Smart updates (50 calls/day max):**
1. **User-active competitions** (leagues users actually play in)
2. **Stale data** (teams older than 30 days)
3. **Priority leagues** (missing data in top competitions)

## 🎯 **Optimization Features**

### **Rate Limiting**
- ✅ Built-in API call counter
- ✅ Daily reset mechanism
- ✅ Graceful degradation when limit reached

### **Data Persistence**
- ✅ Cache all API responses in Firestore
- ✅ Use cached data when API unavailable
- ✅ Track data freshness with timestamps

### **Smart Prioritization**
- ✅ Focus on competitions users actually use
- ✅ Prioritize complete league systems over fragments
- ✅ Update stale data before fetching new data

### **Continuation Strategy**
- ✅ Resume migration across multiple days
- ✅ Track completion status per competition
- ✅ Priority queue persists between runs

## 📋 **Execution Plan**

### **Week 1: Core Migration**
```bash
# Day 1: Structure migration + top priority leagues
npx tsx src/scripts/analysis/analyzeCurrentData.ts
npx tsx src/scripts/migration/strategicApiMigration.ts

# Day 2-7: Continue with remaining priorities
npx tsx src/scripts/migration/strategicApiMigration.ts
```

### **Ongoing: Daily Maintenance**
```bash
# Set up daily cron job or manual run
npx tsx src/scripts/maintenance/dailyMaintenance.ts
```

## 🎲 **Fallback Strategies**

### **When API Limit Reached**
1. ✅ Use existing cached team data
2. ✅ Allow manual team additions via admin panel
3. ✅ Display "data may be outdated" warnings
4. ✅ Queue updates for next day

### **Missing Team Data**
1. ✅ Show "Teams not loaded" message
2. ✅ Allow admin to trigger specific league updates
3. ✅ Estimate based on previous seasons
4. ✅ User can still create saves (manual team selection)

## 📈 **Expected Timeline**

### **Immediate (Day 1)**
- ✅ All existing competitions migrated
- ✅ 80-90 priority competitions with fresh team data

### **Week 1**
- ✅ All major European leagues complete
- ✅ Top South American leagues complete
- ✅ User-active competitions updated

### **Month 1**
- ✅ All inFootballManager=true competitions with teams
- ✅ Daily maintenance routine established
- ✅ GameCompetitions structure implemented

## 🔧 **Manual Override Options**

### **Admin Tools**
- 🛠️ Force update specific competition
- 🛠️ Bulk import team lists (manual)
- 🛠️ Mark competitions as priority
- 🛠️ API usage dashboard

### **Emergency Mode**
- 🆘 Use 2023 data as current (when API exhausted)
- 🆘 Allow community contributions for team lists
- 🆘 Fallback to manual team management

This strategy maximizes the value of your 100 daily API calls while ensuring the app remains functional even when limits are reached.