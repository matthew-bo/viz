# 🚀 Implementation Plan - Canton Visualizer Fixes & Enhancements

**Created:** 2025-01-22  
**Timeline:** 3 weeks  
**Priority:** Critical → Important → Enhancement

---

## 📊 Overview

**Total Issues to Address:** 19 items  
- 🔴 Critical: 3 issues (Week 1)
- 🟡 Important: 7 issues (Week 1-2)
- 🟢 Enhancement: 9 items (Week 2-3)

**Exclusions (as requested):**
- ❌ Browser notifications (not implementing)
- ✅ Export functionality (verify existing, enhance if needed)
- ✅ Metrics dashboard (verify existing, enhance)

---

## 🗓️ WEEK 1: CRITICAL ISSUES (Days 1-5)

### Day 1-2: SSE Data Loss Fix 🔴 CRITICAL
**Issue:** Users miss transactions during network disconnections

**High-Level Approach:**

**Phase 1: Track Last Event (2 hours)**
- Modify SSE connection handler to track `lastEventId` or timestamp
- Store in React state (not persisted - intentionally ephemeral)
- Update on every successful SSE message received

**Phase 2: Implement Reconnection Recovery (3 hours)**
- Add `onopen` event listener to SSE connection
- When connection re-establishes, detect if it's a reconnection (not initial)
- Fetch missed transactions via polling endpoint with timestamp filter
- Backend needs to accept `?since=timestamp` query parameter
- Merge fetched transactions into Zustand store using `addOrUpdateTransaction`

**Phase 3: Fallback Polling Mechanism (2 hours)**
- Create polling service that activates when `connectionStatus === 'disconnected'`
- Poll every 30 seconds while disconnected
- Automatically disable when SSE reconnects
- Add exponential backoff if polling fails repeatedly

**Phase 4: User Feedback (1 hour)**
- Toast notification: "Reconnected. Loaded X missed updates."
- Visual indicator in header showing "Syncing..." during recovery
- Activity log entry for reconnection events

**Backend Changes Required:**
- Add `since` parameter to `/api/contracts` endpoint
- Add `since` parameter to `/api/exchanges` endpoint
- Filter results by `recordTime > since` or `submittedAt > since`

**Testing Strategy:**
- Simulate network disconnect (DevTools → Network → Offline)
- Create transactions while offline
- Reconnect and verify all transactions appear
- Test with laptop sleep/wake cycle
- Test WiFi → Cellular switching (mobile)

**Success Criteria:**
- Zero data loss during 30-second disconnection
- Reconnection completes in < 2 seconds
- User sees clear "Reconnected" feedback
- Activity log shows reconnection events

---

### Day 2-3: Race Condition Prevention 🔴 CRITICAL
**Issue:** Double-click on "Accept" sends duplicate API calls

**High-Level Approach:**

**Phase 1: Create Reusable Hook (1 hour)**
- Build `useTransactionAction` custom hook
- Manages loading state per transaction ID (not global)
- Prevents duplicate submissions via Set of active IDs
- Returns: `{ isProcessing, executeAction }` functions

**Phase 2: Update All Accept Handlers (3 hours)**
- Identify all components with accept logic:
  - `MainContent.tsx` (handleAccept)
  - `SynchronizerFooter.tsx` (handleAccept)
  - `TransactionGrid.tsx` (handleAccept)
  - `TransactionCard.tsx` (already has loading state - verify correctness)
- Replace manual try/catch with hook-based approach
- Ensure consistent error handling across all locations

**Phase 3: Visual Feedback Enhancement (2 hours)**
- Disabled button state (opacity + cursor-not-allowed)
- Loading spinner inside button
- Button text changes: "Accept" → "Accepting..."
- Prevent pointer events on loading cards
- Add semi-transparent overlay on processing items

**Phase 4: Mobile Touch Handling (1 hour)**
- Prevent touch event propagation during processing
- Add haptic feedback on action start (if available)
- Ensure FAB can't trigger multiple creates

**Implementation Pattern:**
```
Hook handles:
- State management (loading states)
- Duplicate prevention (Set of active IDs)
- Error handling consistency
- Automatic cleanup on unmount

Components use hook for:
- All transaction mutations (accept, create, cancel)
- Loading state queries
- Action execution with automatic guards
```

**Testing Strategy:**
- Rapid double-click on Accept button
- Click Accept on multiple transactions simultaneously
- Slow network simulation (throttle to 3G)
- Mobile tap testing with fast taps
- Keyboard accessibility (Enter key spam)

**Success Criteria:**
- Only one API call per user action
- Clear loading feedback appears < 50ms
- Button disabled state prevents all interactions
- Works consistently across all components

---

### Day 3-5: Inventory Validation & Transaction Safety 🔴 CRITICAL
**Issue:** Race conditions, no rollback, silent failures in inventory management

**High-Level Approach:**

**Phase 1: Add Exception-Based Error Handling (2 hours)**
- Replace all `boolean` returns with proper exceptions
- Create custom error classes:
  - `InsufficientFundsError`
  - `AssetNotFoundError`
  - `InventoryLockError`
- Update all inventory methods to throw instead of return false
- Propagate errors to API layer with proper HTTP status codes

**Phase 2: Implement Pessimistic Locking (4 hours)**
- Create `InventoryLock` class to manage party-level locks
- Use promise-based mutex pattern
- Lock party inventory before validation
- Release lock after transaction completes or fails
- Add timeout to prevent deadlocks (30 second max)
- Log all lock acquisitions and releases

**Phase 3: Transaction Rollback System (6 hours)**
- Create `InventoryTransaction` class with ACID-like properties
- Each operation paired with compensating rollback
- Execute operations sequentially
- On failure, rollback in reverse order
- Log all operations for debugging
- Add transaction ID for traceability

**Phase 4: Validation Improvements (3 hours)**
- Move validation inside lock scope (prevent TOCTOU)
- Check available + escrowed balances holistically
- Validate both parties atomically
- Add validation for edge cases:
  - Negative amounts
  - NaN values
  - Asset ownership double-check
  - Escrow consistency

**Phase 5: Add Transaction Logging (2 hours)**
- Log every inventory operation with:
  - Transaction ID
  - Party ID
  - Operation type
  - Before/after balances
  - Success/failure
  - Stack trace on error
- Store in memory (circular buffer) for debugging
- Expose via admin endpoint: `/api/admin/inventory-log`

**Architectural Pattern:**
```
Exchange Flow:
1. Acquire lock on both parties (order by ID to prevent deadlock)
2. Start transaction
3. Validate both parties' resources
4. Execute transfer operations with rollback handlers
5. Commit transaction
6. Release locks
7. Broadcast SSE event

If any step fails:
- Execute rollbacks in reverse
- Release locks
- Return detailed error
- Log failure with context
```

**Testing Strategy:**
- Concurrent exchange attempts on same party
- Simulate mid-transaction failures
- Test lock timeout scenarios
- Verify rollback correctness
- Load test with 10+ simultaneous exchanges
- Crash recovery testing (kill server mid-transaction)

**Success Criteria:**
- Zero race conditions in concurrent operations
- All failures roll back completely
- No orphaned escrow balances
- Detailed error messages for debugging
- Transaction logs accessible via admin endpoint

---

## 🗓️ WEEK 2: IMPORTANT ISSUES (Days 6-10)

### Day 6: Enhanced Health Monitoring 🟡 IMPORTANT
**Issue:** Health dropdown lacks actionable details

**High-Level Approach:**

**Phase 1: Backend Health Enhancement (3 hours)**
- Add response time measurements to each service check
- Add uptime tracking (process start time)
- Add last successful connection timestamp
- Add error count with sliding window (last 5 minutes)
- Add system metrics:
  - Memory usage (used/total/percentage)
  - Active SSE connections
  - Requests per minute
  - Average response time
- Return detailed error context:
  - Full error message
  - Error timestamp
  - Suggested action (human-readable fix)

**Phase 2: Frontend Health Display (2 hours)**
- Show response time next to each service ("Canton: 245ms")
- Color-code latency (green < 500ms, yellow < 1000ms, red > 1000ms)
- Add "Last Error" section with timestamp and message
- Show uptime in human-readable format ("3h 45m")
- Add collapsible "System Resources" section
- Display active connections and request rate

**Phase 3: Historical Status Tracking (3 hours)**
- Store last 10 status changes in memory
- Show recent status timeline in dropdown
- Visual timeline with colored dots
- Timestamp each status change
- Calculate downtime percentage (last hour)

**Phase 4: Actionable Suggestions (2 hours)**
- Map error types to suggested actions:
  - "ECONNREFUSED" → "Check if Canton container is running: docker ps"
  - "Timeout" → "Canton may be overloaded. Check logs: docker logs canton"
  - "No participants" → "Run initialization: npm run init-canton"
- Add "Copy Command" button next to suggestions
- Link to troubleshooting docs

**UI Enhancements:**
- Add mini-graphs for response time trends
- "Run Diagnostics" button (runs health check manually)
- "View Full Report" expands to dedicated page
- Export health snapshot as JSON

**Testing Strategy:**
- Simulate various failure modes
- Verify suggested actions are correct
- Test on mobile (full-screen modal)
- Measure health check overhead (< 100ms)

**Success Criteria:**
- Users can diagnose issues without backend access
- Clear, actionable error messages
- Response times visible for all services
- Historical context shows trends

---

### Day 7: Fix Zustand Persistence Issue 🟡 IMPORTANT
**Issue:** Stale filters from previous sessions confuse users

**High-Level Approach:**

**Phase 1: Clear Filters on Init (1 hour)**
- In `App.tsx` initial data load, reset filters
- Clear `selectedBusiness`, `selectedRWA` before loading data
- Only preserve `activeView` across sessions
- Document why in code comments

**Phase 2: Visual Filter Indicators (2 hours)**
- Create prominent "Active Filters" banner
- Show banner when any filter active
- Display each active filter as a pill/badge
- Add "Clear All Filters" button
- Position above transaction list (can't be missed)
- Animate in/out with Framer Motion

**Phase 3: Filter Persistence Options (2 hours)**
- Add user preference: "Remember my filters" checkbox
- Store preference in localStorage
- If unchecked, clear filters on session end
- Add tooltip explaining the feature
- Default to OFF for new users

**Phase 4: Session Restore Notification (1 hour)**
- If filters were restored from previous session, show toast
- Toast message: "Restored filters from previous session: [Bank A] [Clear]"
- Auto-dismiss after 5 seconds
- Click to clear immediately

**Testing Strategy:**
- Close/reopen browser multiple times
- Test with various filter combinations
- Verify mobile behavior
- Test with empty filter state

**Success Criteria:**
- New sessions start with no filters (unless user opted in)
- Filters always clearly visible when active
- Users can clear filters in one click
- No confusion about missing transactions

---

### Day 7-8: API Timeout & Error Handling 🟡 IMPORTANT
**Issue:** Requests hang indefinitely, no timeout

**High-Level Approach:**

**Phase 1: Create Fetch Wrapper (2 hours)**
- Build `fetchWithTimeout` utility function
- Accepts URL, options, timeout (default 15s)
- Uses AbortController for cancellation
- Handles timeout errors gracefully
- Returns enhanced error messages

**Phase 2: Update All API Calls (2 hours)**
- Replace all `fetch()` calls with `fetchWithTimeout()`
- Set appropriate timeouts per endpoint:
  - GET requests: 15 seconds
  - POST requests: 30 seconds
  - Health check: 5 seconds
- Add retry logic for critical endpoints (parties, initial load)

**Phase 3: Enhanced Error Messages (2 hours)**
- Map error types to user-friendly messages:
  - Timeout: "The server is taking too long. Please try again."
  - Network error: "Connection lost. Check your internet."
  - 500 error: "Server error. Please try again later."
  - 404 error: "Resource not found."
- Include error code for support
- Add "Retry" button on error toasts

**Phase 4: Loading State Improvements (2 hours)**
- Show elapsed time on loading spinners (> 3 seconds)
- Add "Still working..." message after 5 seconds
- Option to cancel long-running requests
- Show "Slow connection detected" after 10 seconds

**Testing Strategy:**
- Network throttling (Slow 3G)
- Backend sleep endpoints for testing
- Disconnect during requests
- Concurrent timeout scenarios

**Success Criteria:**
- No infinite loading states
- Clear error messages for all failures
- Users can retry failed requests
- Timeout values appropriate for each endpoint

---

### Day 8-9: Fix Memory Leaks & Input Validation 🟡 IMPORTANT
**Issue 1:** Activity log grows unbounded  
**Issue 2:** Transaction sorting breaks on invalid dates  
**Issue 3:** No input sanitization

**High-Level Approach:**

**Memory Leak Fix (3 hours):**
- Implement circular buffer for activity logs
- Limit to last 500 entries (configurable)
- Add "Clear Logs" button in dropdown
- Periodic cleanup on timer (every 5 minutes)
- Warning toast when approaching limit
- Consider LRU cache pattern for other large datasets

**Date Sorting Fix (1 hour):**
- Add validation in `getFilteredTransactions`
- Handle `NaN` from invalid dates
- Push invalid dates to end of list
- Log warning for malformed dates
- Add backend validation to prevent bad dates

**Input Sanitization (4 hours):**
- Install DOMPurify library
- Create validation utility functions
- Sanitize all user inputs in CreateExchangeModal:
  - Description: strip HTML, limit 500 chars
  - Amounts: validate as positive finite numbers
  - Asset IDs: alphanumeric only
- Backend validation (mirror frontend rules)
- Add field-level error messages
- Show character count for description field

**Testing Strategy:**
- Long-running app session (memory profiling)
- Inject malformed dates from backend
- XSS attack vectors in forms
- SQL injection attempts (shouldn't reach DB, but validate)
- Extremely large input values

**Success Criteria:**
- Memory usage stays flat over 8+ hours
- App never crashes on bad data
- All user inputs properly sanitized
- Clear validation error messages

---

### Day 9-10: Optimistic UI Updates 🟡 IMPORTANT
**Issue:** 2+ second perceived latency on actions

**High-Level Approach:**

**Phase 1: Optimistic Update Pattern (3 hours)**
- Create `useOptimisticUpdate` hook
- Handles optimistic state changes
- Automatic rollback on error
- Queues multiple optimistic updates
- Resolves when SSE confirms or timeout (10s)

**Phase 2: Transaction Acceptance (2 hours)**
- Immediately update transaction status to "committed"
- Close detail view
- Show success toast
- Scroll to updated transaction in list
- Highlight with animation
- If error: rollback, reopen detail, show error

**Phase 3: Exchange Creation (2 hours)**
- Generate temporary ID for new exchange
- Add to transaction list immediately with "pending" status
- Show in timeline with "Creating..." label
- Replace temp ID with real ID from API response
- If error: remove optimistic entry, show error modal

**Phase 4: Visual Feedback (2 hours)**
- Add "pulsing" animation to optimistic items
- Subtle indicator: "Confirming..." badge
- Fade out on SSE confirmation
- Smooth transition animations
- Loading skeleton for pending items

**Rollback Strategy:**
- Store original state before optimistic update
- On error, restore original state
- Animate rollback (don't just pop)
- Show clear error explanation
- Option to retry action

**Testing Strategy:**
- Accept transaction with slow network
- Create exchange with backend error
- Multiple simultaneous optimistic updates
- SSE message arrives before API response
- API success but SSE never arrives (timeout)

**Success Criteria:**
- Perceived latency < 100ms
- Smooth animations throughout
- Clear rollback on errors
- No inconsistent states

---

## 🗓️ WEEK 3: ENHANCEMENTS (Days 11-15)

### Day 11-12: Transaction Search & Filter 🟢 ENHANCEMENT

**High-Level Approach:**

**Phase 1: Search Bar Component (2 hours)**
- Create `TransactionSearch` component
- Position above transaction list
- Text input with search icon
- Clear button (X) when text entered
- Auto-focus on keyboard shortcut (/)
- Debounced search (300ms delay)

**Phase 2: Search Logic (3 hours)**
- Search across multiple fields:
  - Sender name
  - Receiver name
  - Amount (exact or range)
  - Description
  - RWA type
  - Contract ID
- Fuzzy matching for names
- Support operators: `>500`, `<1000`, `"exact phrase"`
- Highlight matching text in results

**Phase 3: Advanced Filters (4 hours)**
- Status filter dropdown (All/Pending/Committed)
- Date range filter (Today/Week/Month/Custom)
- Amount range filter (slider or inputs)
- RWA type filter (multi-select)
- Party filter (multi-select)
- "Save Filter" presets for common queries

**Phase 4: Filter UI (3 hours)**
- Filter panel (collapsible)
- Active filters shown as removable pills
- Filter count badge on filter button
- "Clear All" button
- Filter state persisted during session
- Mobile-friendly filter drawer

**Testing Strategy:**
- Search performance with 1000+ transactions
- Various search queries
- Filter combinations
- Mobile filter drawer UX
- Keyboard navigation

**Success Criteria:**
- Results appear instantly (< 50ms)
- Intuitive filter interface
- Works seamlessly on mobile
- Filters are clearly visible when active

---

### Day 12-13: Keyboard Shortcuts 🟢 ENHANCEMENT

**High-Level Approach:**

**Phase 1: Keyboard Handler Setup (2 hours)**
- Install `react-hotkeys-hook` library
- Create `useKeyboardShortcuts` hook
- Global keyboard event listener
- Prevent conflicts with browser shortcuts
- Disable when typing in inputs/textareas

**Phase 2: Implement Shortcuts (4 hours)**
- **Global:**
  - `Ctrl+K` / `Cmd+K`: Open CREATE modal
  - `Escape`: Close modal/drawer/dropdown
  - `?`: Show keyboard shortcuts help
  - `/`: Focus search bar
- **Navigation:**
  - `1-4`: Switch between views (List/Metrics/Flow/Timeline)
  - `Ctrl+←/→`: Navigate panel focus
- **List Navigation:**
  - `↑/↓`: Navigate transactions
  - `Enter`: Open selected transaction
  - `Space`: Toggle transaction selection

**Phase 3: Help Modal (2 hours)**
- Create keyboard shortcuts help modal
- Triggered by `?` key
- Categorized shortcuts (Global/Navigation/Actions)
- Visual keyboard key representations
- Searchable shortcut list
- Link in header ("⌨️ Shortcuts")

**Phase 4: Visual Indicators (2 hours)**
- Show shortcut hints on hover
- Tooltip: "Press Ctrl+K to create"
- Shortcut badges on buttons: `CREATE ⌘K`
- Highlight focused element for keyboard navigation
- Skip links for accessibility

**Testing Strategy:**
- Test all shortcuts on Windows/Mac
- Verify no conflicts with browser
- Test with screen readers
- Mobile device handling (no keyboard)

**Success Criteria:**
- All major actions have shortcuts
- Help modal is comprehensive
- Works with accessibility tools
- No browser shortcut conflicts

---

### Day 13-14: Verify & Enhance Export Functionality 🟢 ENHANCEMENT

**High-Level Approach:**

**Phase 1: Audit Current Export (2 hours)**
- Test JSON export of activity logs
- Test CSV export of activity logs
- Verify file format correctness
- Check for encoding issues
- Test with large datasets
- Verify mobile download works

**Phase 2: Add Transaction Export (4 hours)**
- Add "Export Transactions" section to health dropdown
- Export current filtered/searched transactions
- Support formats:
  - CSV (for Excel)
  - JSON (for developers)
  - PDF (for reports - optional)
- Include all transaction fields
- Format dates appropriately
- Handle large exports (1000+ rows)

**Phase 3: Export Options (2 hours)**
- "Export All" vs "Export Filtered"
- Date range selection for export
- Column selection (choose which fields)
- File naming with timestamp
- Success notification after download

**Phase 4: Export Quality (2 hours)**
- CSV: Proper escaping of commas/quotes
- JSON: Pretty-printed for readability
- Include metadata header:
  - Export date
  - Filter criteria
  - Total records
  - App version
- Add export to activity log

**Testing Strategy:**
- Export various data sizes (10, 100, 1000 transactions)
- Open in Excel/Google Sheets
- Verify special characters don't break format
- Test on mobile devices
- Check file size limits

**Success Criteria:**
- Activity log export works perfectly
- Transaction export added successfully
- Files open correctly in Excel
- Mobile downloads work
- Clear user feedback

---

### Day 14-15: Enhance Metrics Dashboard 🟢 ENHANCEMENT

**Current Dashboard Has:**
- Total volume, count, pending/committed counts
- Average value and commit time
- RWA type distribution
- Party activity rankings

**High-Level Enhancement Approach:**

**Phase 1: Add Time-Series Visualizations (4 hours)**
- Install lightweight charting library (Chart.js or Recharts)
- Add "Transaction Volume Over Time" line chart
- Group by day/week/month (user selectable)
- Show trends clearly
- Responsive to screen size
- Animate chart on load

**Phase 2: Enhanced RWA Analysis (3 hours)**
- Pie chart for RWA type distribution
- Bar chart for volume by RWA type
- Show percentage breakdowns
- Interactive tooltips with details
- Click to filter transactions by RWA type

**Phase 3: Party Comparison (3 hours)**
- Horizontal bar chart comparing party activity
- Sort by various metrics (sent/received/volume)
- Color-coded by party color
- Click party to drill down
- Show sparklines for recent activity

**Phase 4: Performance Metrics (2 hours)**
- Add "Network Health" section:
  - Average acceptance time
  - Success rate percentage
  - Peak activity hours
  - Most active trading pairs
- Visual indicators (green/yellow/red)
- Historical comparison ("↑ 15% vs last week")

**Phase 5: Export & Share (2 hours)**
- "Export Dashboard" button (PDF/PNG)
- "Share Snapshot" (copy link with current filters)
- Print-friendly dashboard view
- Scheduled reports (future enhancement note)

**Testing Strategy:**
- Test with various data sizes
- Verify chart performance (no lag)
- Test mobile responsiveness
- Verify color contrast (accessibility)
- Export quality testing

**Success Criteria:**
- Charts load quickly (< 500ms)
- Visualizations are intuitive
- Mobile-friendly layouts
- Enhanced insights beyond current dashboard
- Professional appearance

---

## 📋 IMPLEMENTATION CHECKLIST

### Pre-Implementation
- [ ] Review plan with team
- [ ] Set up feature branches
- [ ] Create tracking issues in GitHub
- [ ] Assign ownership for each phase
- [ ] Set up testing environments

### Week 1 (Critical)
- [ ] SSE reconnection recovery
- [ ] Race condition prevention
- [ ] Inventory validation & rollback
- [ ] All critical issues tested

### Week 2 (Important)
- [ ] Enhanced health monitoring
- [ ] Zustand persistence fix
- [ ] API timeouts implemented
- [ ] Memory leaks fixed
- [ ] Input sanitization added
- [ ] Optimistic UI updates

### Week 3 (Enhancement)
- [ ] Search & filter functionality
- [ ] Keyboard shortcuts
- [ ] Export verification & enhancement
- [ ] Enhanced metrics dashboard

### Post-Implementation
- [ ] Comprehensive testing (all features)
- [ ] Performance profiling
- [ ] Security audit
- [ ] Documentation updates
- [ ] User acceptance testing
- [ ] Production deployment plan

---

## 🧪 TESTING STRATEGY

### Unit Testing (Throughout)
- Write tests alongside implementation
- Aim for 80%+ coverage on new code
- Test edge cases explicitly
- Mock external dependencies

### Integration Testing (End of Each Week)
- Test component interactions
- Verify SSE + API coordination
- Test state management flows
- Cross-browser testing

### E2E Testing (Week 3)
- Critical user journeys:
  - Create and accept exchange
  - Network disconnect/reconnect
  - Search and filter transactions
  - Export data
- Mobile device testing
- Accessibility testing

### Performance Testing (Week 3)
- Load test with 1000+ transactions
- Memory profiling (8-hour session)
- Network throttling scenarios
- Concurrent user simulation

### Security Testing (Week 3)
- Input validation bypass attempts
- XSS attack vectors
- CSRF protection verification
- API authentication checks

---

## 🎯 SUCCESS METRICS

### Technical Metrics
- **Zero data loss** during disconnections
- **< 100ms** perceived action latency
- **< 500ms** chart render times
- **Flat memory usage** over 8+ hours
- **Zero race conditions** in concurrent operations

### User Experience Metrics
- **Clear feedback** on all actions (< 50ms)
- **Intuitive search** with instant results
- **Comprehensive health info** for troubleshooting
- **Smooth animations** (60fps on mobile)
- **Professional exports** (Excel-ready)

### Quality Metrics
- **80%+ code coverage** on new code
- **Zero linting errors**
- **WCAG 2.1 AA compliance**
- **All browsers supported** (Chrome, Firefox, Safari, Edge)
- **Mobile-first quality**

---

## 🚨 RISK MITIGATION

### Technical Risks
**Risk:** SSE reconnection causes duplicate transactions  
**Mitigation:** Use contract ID deduplication in `addOrUpdateTransaction`

**Risk:** Optimistic updates cause state inconsistency  
**Mitigation:** Comprehensive rollback testing, 10s timeout for SSE confirmation

**Risk:** Inventory locks cause deadlocks  
**Mitigation:** 30s lock timeout, order locks by party ID to prevent circular waits

**Risk:** Chart library increases bundle size  
**Mitigation:** Use lightweight library (< 50KB), lazy load charts

### Schedule Risks
**Risk:** Week 1 tasks take longer than estimated  
**Mitigation:** Critical fixes have priority, push enhancements to Week 4 if needed

**Risk:** Testing reveals major issues  
**Mitigation:** Reserve 2 days at end for bug fixes and polish

### UX Risks
**Risk:** Too many features overwhelm users  
**Mitigation:** Progressive disclosure, collapsible sections, keyboard shortcuts optional

**Risk:** Changes confuse existing users  
**Mitigation:** In-app changelog, optional feature tours, clear documentation

---

## 📚 DEPENDENCIES

### External Libraries to Add
- `react-hotkeys-hook` (keyboard shortcuts)
- `DOMPurify` (input sanitization)
- `chart.js` or `recharts` (data visualization)
- None for other features (use existing libraries)

### Backend API Changes Required
- Add `since` parameter to `/api/contracts` and `/api/exchanges`
- Add `/api/admin/inventory-log` endpoint
- Enhanced `/health` endpoint with metrics
- Input validation on all POST endpoints

### Documentation Updates
- API documentation (new parameters)
- User guide (keyboard shortcuts, search syntax)
- Troubleshooting guide (health monitoring)
- Changelog (all new features)

---

## 🎉 POST-LAUNCH PLAN

### Week 4: Monitoring & Refinement
- Monitor error rates in production
- Collect user feedback
- Performance optimization if needed
- Address any bugs discovered

### Future Enhancements (Not in Scope)
- Browser push notifications (deferred)
- Real-time collaboration features
- Advanced analytics (ML insights)
- Mobile native apps
- Scheduled exports/reports

---

## 📞 TEAM COORDINATION

### Daily Standups
- Progress on current phase
- Blockers and dependencies
- Testing status
- Next 24-hour plan

### Weekly Reviews
- Demo completed features
- Review test results
- Adjust schedule if needed
- Plan next week's priorities

### Communication Channels
- GitHub issues for bugs
- Pull requests for code review
- Slack/Teams for quick questions
- Documentation in Markdown files

---

## ✅ DEFINITION OF DONE

A feature is "done" when:
- [ ] Code implemented and reviewed
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] No linting errors
- [ ] Accessibility verified
- [ ] Mobile tested
- [ ] Performance acceptable
- [ ] Security reviewed
- [ ] Merged to main branch

---

**Total Estimated Effort:** 15 working days (3 weeks)  
**Recommended Team Size:** 1-2 developers  
**Risk Level:** Low-Medium (well-defined scope, existing codebase)  
**Deployment Strategy:** Incremental (deploy weekly if possible)

---

**End of Implementation Plan**  
**Ready to begin implementation:** ✅  
**Next step:** Review with team and assign ownership
