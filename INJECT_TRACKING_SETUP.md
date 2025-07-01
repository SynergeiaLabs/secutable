# Inject Tracking System Setup Guide

This guide explains the inject tracking system that persists inject activation and handling data to Supabase.

## Overview

The inject tracking system ensures that all inject interactions (activation, handling, timing) are persisted to the database, allowing for:
- Data persistence across page refreshes
- Multi-device synchronization
- Reliable reporting and analysis
- Exercise state recovery

## Database Schema

### New Fields Added to `injects` Table

```sql
ALTER TABLE injects 
ADD COLUMN activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN handled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN response_time INTEGER; -- in seconds
```

### Indexes for Performance

```sql
CREATE INDEX idx_injects_activated_at ON injects(activated_at);
CREATE INDEX idx_injects_handled_at ON injects(handled_at);
CREATE INDEX idx_injects_scenario_activated ON injects(scenario_id, activated_at);
```

## Core Functions

### 1. `activateInject(injectId: string)`
- Updates `activated_at` timestamp in Supabase
- Called when inject is triggered (manual or automatic)
- Returns success/error status

### 2. `handleInject(injectId: string)`
- Updates `handled_at` timestamp and calculates `response_time`
- Validates inject was previously activated
- Returns success/error status and calculated response time

### 3. `getInjectTracking(scenarioId: string)`
- Fetches all tracking data for a scenario
- Returns array of inject tracking records
- Used for loading existing exercise state

### 4. `resetInjectTracking(scenarioId: string)`
- Clears all tracking data for a scenario
- Used when starting/resetting exercises
- Sets all tracking fields to null

## Performance Evaluation

### Response Time Thresholds
- **Met Expectation**: ≤ 2 minutes (120 seconds)
- **Delayed**: > 2 minutes
- **Missed**: Not handled (null response_time)

### Status Calculation
```typescript
function calculatePerformanceStatus(responseTimeSeconds: number | null): 'met' | 'delayed' | 'missed' {
  if (responseTimeSeconds === null) return 'missed';
  const responseTimeMinutes = responseTimeSeconds / 60;
  return responseTimeMinutes <= 2 ? 'met' : 'delayed';
}
```

## Integration Points

### Exercise Control Panel (`/scenarios/[id]`)
- **Automatic Activation**: Injects triggered based on elapsed time
- **Manual Activation**: User clicks "Trigger Now" button
- **Handling**: User clicks "Mark as Handled" button
- **State Loading**: Loads existing tracking data on page load
- **Reset**: Clears tracking when starting/resetting exercise

### Report Page (`/report/[id]`)
- **Data Loading**: Fetches tracking data for analysis
- **Performance Analysis**: Uses tracking data for phase-based evaluation
- **AI Report**: Sends tracking data to GPT-4 for After Action Report

## Data Flow

### 1. Exercise Start
```
User clicks "Start Exercise" 
→ resetInjectTracking() 
→ Clear all tracking data
→ Initialize empty state
```

### 2. Inject Activation
```
Automatic: Timer triggers based on time_offset
Manual: User clicks "Trigger Now"
→ activateInject() 
→ Update Supabase
→ Update local state
```

### 3. Inject Handling
```
User clicks "Mark as Handled"
→ handleInject()
→ Calculate response_time
→ Update Supabase
→ Update local state
```

### 4. Page Refresh/Reload
```
Component loads
→ getInjectTracking()
→ Merge with inject data
→ Restore exercise state
```

## Error Handling

### Network Failures
- Local state updates immediately for UI responsiveness
- Supabase operations retry on failure
- Console logging for debugging
- Graceful fallbacks for missing data

### Data Validation
- Ensures inject is activated before handling
- Validates response time calculations
- Handles missing or corrupted tracking data

## Testing

### Manual Testing
1. **Start Exercise**: Verify tracking data is cleared
2. **Trigger Inject**: Check Supabase for activated_at timestamp
3. **Handle Inject**: Verify handled_at and response_time
4. **Refresh Page**: Confirm state is restored
5. **Reset Exercise**: Ensure all tracking is cleared

### Database Verification
```sql
-- Check tracking data for a scenario
SELECT id, content, activated_at, handled_at, response_time 
FROM injects 
WHERE scenario_id = 'your-scenario-id'
ORDER BY time_offset;
```

## Performance Considerations

### Database Indexes
- Indexes on `activated_at`, `handled_at`, and `scenario_id`
- Optimized queries for scenario-based data retrieval
- Efficient timestamp-based lookups

### Caching Strategy
- Local state for immediate UI updates
- Supabase as source of truth
- Minimal API calls for optimal performance

## Security

### Row Level Security (RLS)
Ensure your Supabase RLS policies allow:
- Read access to inject tracking data
- Update access for activation/handling
- Delete access for reset operations

### Data Integrity
- Timestamp validation
- Response time calculation verification
- Foreign key constraints maintained

## Migration

### Running the Migration
```bash
# Apply the migration to your Supabase database
psql -h your-project.supabase.co -U postgres -d postgres -f db/migrations/003_add_inject_tracking.sql
```

### Backward Compatibility
- Existing injects will have null tracking fields
- System gracefully handles missing tracking data
- No breaking changes to existing functionality

## Troubleshooting

### Common Issues

**"Inject must be activated before it can be handled"**
- Check if inject was properly activated
- Verify database connection and permissions

**"Failed to activate inject"**
- Check Supabase connection
- Verify inject ID exists
- Check RLS policies

**State not persisting on refresh**
- Verify `getInjectTracking()` is called
- Check for JavaScript errors
- Verify Supabase client configuration

### Debug Mode
Enable console logging for debugging:
```typescript
// In injectTracking.ts
console.log('Activating inject:', injectId);
console.log('Tracking result:', result);
```

## Future Enhancements

1. **Real-time Updates**: Supabase subscriptions for live updates
2. **Audit Trail**: Track who activated/handled each inject
3. **Advanced Analytics**: Response time trends and patterns
4. **Export Functionality**: Download tracking data for analysis
5. **Multi-user Support**: Handle concurrent exercise sessions 