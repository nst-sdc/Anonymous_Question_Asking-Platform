# 🐛 Platform Issues & Known Problems

> **Last Updated:** 2025-11-21  
> **Status:** Active Development

This document tracks all known issues, bugs, and areas for improvement in the Anonymous Question Asking Platform (Annoymeet).

---

## 🔴 Critical Issues

### 1. **CORS Configuration - Localhost Not Allowed**
**Location:** [`backend/server.js:L13-15`](file:///Users/arpitsarang/Desktop/Anonymous_Question_Asking-Platform/backend/server.js#L13-L15)

**Problem:**
```javascript
const allowedOrigins = [
  "https://annoymeet.vercel.app"
];
```

The backend only allows connections from the production URL, blocking local development.

**Impact:** 
- ❌ Cannot test locally
- ❌ Frontend at `http://localhost:5173` gets CORS errors
- ❌ Socket.IO connections fail during development

**Fix Required:**
```javascript
const allowedOrigins = [
  "https://annoymeet.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
];
```

---

### 2. **Duplicate Socket Event Listeners**
**Location:** [`src/contexts/RoomContext.jsx:L48-221`](file:///Users/arpitsarang/Desktop/Anonymous_Question_Asking-Platform/src/contexts/RoomContext.jsx#L48-L221)

**Problem:**
Multiple event listeners are registered for the same events:
- `user_joined` registered **twice** (lines 120 & 145)
- `user_left` registered **twice** (lines 125 & 156)
- `room_state` registered **twice** (lines 112 & 167)
- `poll_ended` registered **twice** (lines 106 & 130)

**Impact:**
- 🐛 Events fire multiple times
- 🐛 State updates happen twice
- 🐛 Memory leaks from uncleaned listeners
- 🐛 Inconsistent UI behavior

**Fix Required:**
Remove duplicate listeners and consolidate logic into single handlers.

---

### 3. **Missing Database Schema Column**
**Location:** Backend polls table

**Problem:**
Backend server expects `creator_anonymous_id` column in polls table:
```javascript
creator_anonymous_id: anonymousId,  // Line 319 in server.js
```

But the database migration doesn't create this column.

**Impact:**
- ❌ Poll creation fails with database error
- ❌ Cannot track who created polls anonymously

**Fix Required:**
Add migration to add `creator_anonymous_id` column to `polls` table.

---

## 🟠 High Priority Issues

### 4. **Data Synchronization Between Socket.IO and Supabase**
**Location:** Multiple files

**Problem:**
- Messages are stored in **both** in-memory (Socket.IO) and Supabase
- Polls are stored in **both** in-memory and Supabase
- No synchronization strategy when one fails
- Potential data loss if Socket.IO server restarts

**Impact:**
- 🐛 Messages may disappear on server restart
- 🐛 Polls may not persist correctly
- 🐛 Inconsistent state between database and memory

**Recommendation:**
Choose one source of truth (Supabase) and use Socket.IO only for real-time notifications.

---

### 5. **Missing Error Handling for Socket Disconnections**
**Location:** [`src/lib/socket.js:L45-56`](file:///Users/arpitsarang/Desktop/Anonymous_Question_Asking-Platform/src/lib/socket.js#L45-L56)

**Problem:**
- Max 5 reconnection attempts
- After 5 failures, gives up completely
- No user notification
- No graceful degradation

**Impact:**
- 😞 Users lose connection silently
- 😞 No way to recover without page refresh
- 😞 Poor user experience

**Fix Required:**
- Show connection status indicator
- Provide manual reconnect button
- Implement exponential backoff with unlimited retries
- Fall back to polling Supabase if Socket.IO fails

---

### 6. **Room Cleanup Timer Too Short**
**Location:** [`backend/server.js:L78-86`](file:///Users/arpitsarang/Desktop/Anonymous_Question_Asking-Platform/backend/server.js#L78-L86)

**Problem:**
```javascript
setTimeout(() => {
  rooms.delete(roomId);
  roomCleanupTimers.delete(roomId);
  console.log(`Cleaned up empty room ${roomId}`);
}, 30000); // 30 seconds
```

Rooms are deleted after only 30 seconds of being empty.

**Impact:**
- 🐛 If organizer refreshes page, room is deleted
- 🐛 Temporary network issues cause room loss
- 🐛 All messages and polls are lost

**Recommendation:**
Increase to at least 5-10 minutes, or persist to Supabase immediately.

---

### 7. **No Message Persistence in Backend**
**Location:** [`backend/server.js:L180-224`](file:///Users/arpitsarang/Desktop/Anonymous_Question_Asking-Platform/backend/server.js#L180-L224)

**Problem:**
Messages are only stored in memory on the backend:
```javascript
if (room) {
  room.messages.push(messageData);
}
```

They're not saved to Supabase in the backend.

**Impact:**
- ❌ All messages lost on server restart
- ❌ New users joining don't see message history
- ❌ Inconsistent with frontend which saves to Supabase

**Fix Required:**
Backend should also save messages to Supabase for persistence.

---

## 🟡 Medium Priority Issues

### 8. **Hardcoded Socket Transport**
**Location:** [`src/lib/socket.js:L19`](file:///Users/arpitsarang/Desktop/Anonymous_Question_Asking-Platform/src/lib/socket.js#L19)

**Problem:**
```javascript
transports: ['polling'],
```

Only uses long-polling, not WebSockets.

**Impact:**
- 📉 Higher latency
- 📉 More server load
- 📉 Worse performance than WebSockets

**Recommendation:**
```javascript
transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
```

---

### 9. **Missing Input Validation**
**Location:** Multiple components

**Problem:**
- No validation for room codes (should be 6 characters)
- No validation for message length
- No validation for poll options count
- No validation for room names

**Impact:**
- 🐛 Users can submit empty messages
- 🐛 Users can create polls with no options
- 🐛 Invalid room codes cause errors

**Fix Required:**
Add client-side and server-side validation.

---

### 10. **Alert() for Error Messages**
**Location:** [`src/contexts/RoomContext.jsx:L195, L200, L205`](file:///Users/arpitsarang/Desktop/Anonymous_Question_Asking-Platform/src/contexts/RoomContext.jsx#L195-L206)

**Problem:**
```javascript
socket.on('message_error', (error) => {
  console.error('Message error:', error.error);
  alert(error.error);  // ❌ Using browser alert
});
```

Using native `alert()` for error messages.

**Impact:**
- 😞 Poor UX
- 😞 Blocks UI
- 😞 Looks unprofessional

**Recommendation:**
Use toast notifications or custom modal components.

---

### 11. **No Loading States**
**Location:** Multiple components

**Problem:**
- No loading indicators when creating rooms
- No loading indicators when sending messages
- No loading indicators when creating polls

**Impact:**
- 😞 Users don't know if actions are processing
- 😞 May click buttons multiple times
- 😞 Confusing UX

---

### 12. **Missing Reaction Persistence**
**Location:** Backend

**Problem:**
Reactions are only stored in memory, not in Supabase.

**Impact:**
- ❌ All reactions lost on server restart
- ❌ New users don't see existing reactions

**Fix Required:**
Save reactions to `message_reactions` table in Supabase.

---

## 🟢 Low Priority / Enhancement Issues

### 13. **No Rate Limiting**
**Location:** Backend

**Problem:**
No rate limiting on:
- Message sending
- Poll creation
- Reaction adding

**Impact:**
- 🚨 Vulnerable to spam
- 🚨 Vulnerable to DoS attacks

**Recommendation:**
Implement rate limiting middleware.

---

### 14. **No Typing Indicators**
**Location:** N/A

**Problem:**
Users can't see when others are typing.

**Impact:**
- 😞 Less engaging chat experience

---

### 15. **No Read Receipts**
**Location:** N/A

**Problem:**
No way to know if messages have been seen.

**Impact:**
- 😞 Less feedback for users

---

### 16. **No User Presence Indicators**
**Location:** N/A

**Problem:**
Can't see who's currently active/online in the room.

**Impact:**
- 😞 Don't know if anyone is listening

---

### 17. **No Message Search**
**Location:** N/A

**Problem:**
Can't search through message history.

**Impact:**
- 😞 Hard to find specific messages in long conversations

---

### 18. **No Export Functionality**
**Location:** N/A

**Problem:**
Organizers can't export chat logs or poll results.

**Impact:**
- 😞 Can't save important discussions
- 😞 Can't analyze poll data

---

### 19. **No Dark Mode Persistence**
**Location:** Theme context

**Problem:**
Dark mode preference not saved to localStorage.

**Impact:**
- 😞 Users have to toggle dark mode every session

---

### 20. **Profanity Filter May Be Too Strict**
**Location:** [`backend/server.js:L32-33`](file:///Users/arpitsarang/Desktop/Anonymous_Question_Asking-Platform/backend/server.js#L32-L33)

**Problem:**
Using `bad-words` library which may flag legitimate words.

**Impact:**
- 😞 False positives block valid messages
- 😞 Users get frustrated

**Recommendation:**
- Add custom whitelist
- Allow organizers to configure filter strictness
- Provide better error messages

---

## 📊 Performance Issues

### 21. **Loading All Messages on Join**
**Location:** [`src/contexts/RoomContext.jsx:L625-657`](file:///Users/arpitsarang/Desktop/Anonymous_Question_Asking-Platform/src/contexts/RoomContext.jsx#L625-L657)

**Problem:**
Loads ALL messages when joining a room, no pagination.

**Impact:**
- 📉 Slow load times for rooms with many messages
- 📉 High memory usage
- 📉 Poor performance on mobile

**Recommendation:**
Implement pagination or infinite scroll.

---

### 22. **No Message Caching**
**Location:** Frontend

**Problem:**
Messages are re-fetched every time user rejoins a room.

**Impact:**
- 📉 Unnecessary database queries
- 📉 Slower load times

---

## 🎨 UI/UX Issues

### 23. **No Empty States**
**Location:** Multiple components

**Problem:**
- No message when room has no messages
- No message when room has no polls
- No message when room has no members

**Impact:**
- 😞 Confusing for new users
- 😞 Looks broken

---

### 24. **No Confirmation Dialogs**
**Location:** Multiple components

**Problem:**
- No confirmation when leaving room
- No confirmation when ending room
- No confirmation when ending poll

**Impact:**
- 🐛 Easy to accidentally leave/end things
- 😞 Frustrating for users

---

### 25. **Mobile Responsiveness Issues**
**Location:** Multiple components

**Problem:**
- Some modals may not be fully responsive
- Chat input may be hidden by mobile keyboard
- Poll cards may overflow on small screens

**Impact:**
- 😞 Poor mobile experience

---

## 🔒 Security Issues

### 26. **Exposed Supabase Anon Key**
**Location:** Frontend `.env.local`

**Problem:**
Supabase anon key is exposed in frontend code.

**Impact:**
- ⚠️ Anyone can see the key in browser DevTools
- ⚠️ Relies entirely on RLS policies for security

**Note:** This is actually normal for Supabase, but RLS policies must be perfect.

---

### 27. **No XSS Protection**
**Location:** Message rendering

**Problem:**
User messages may not be sanitized before rendering.

**Impact:**
- 🚨 Potential XSS attacks
- 🚨 Users could inject malicious scripts

**Fix Required:**
Sanitize all user input before rendering.

---

### 28. **No CSRF Protection**
**Location:** Backend API

**Problem:**
No CSRF tokens for state-changing operations.

**Impact:**
- 🚨 Vulnerable to CSRF attacks

---

## 📝 Code Quality Issues

### 29. **Inconsistent Error Handling**
**Location:** Multiple files

**Problem:**
- Some functions throw errors
- Some functions return errors
- Some functions use try/catch
- Some don't

**Impact:**
- 🐛 Hard to debug
- 🐛 Inconsistent behavior

---

### 30. **Missing TypeScript**
**Location:** Entire codebase

**Problem:**
No type safety.

**Impact:**
- 🐛 Runtime errors that could be caught at compile time
- 🐛 Harder to refactor
- 🐛 Worse developer experience

---

### 31. **No Tests**
**Location:** N/A

**Problem:**
No unit tests, integration tests, or E2E tests.

**Impact:**
- 🐛 Easy to introduce regressions
- 🐛 Hard to refactor with confidence

---

## 🚀 Deployment Issues

### 32. **No Environment Variable Validation**
**Location:** Backend startup

**Problem:**
Server starts even if `SUPABASE_URL` or `SUPABASE_ANON_KEY` are missing.

**Impact:**
- 🐛 Silent failures
- 🐛 Confusing errors

**Fix Required:**
Validate required env vars on startup.

---

### 33. **No Health Check for Dependencies**
**Location:** [`backend/server.js:L444-451`](file:///Users/arpitsarang/Desktop/Anonymous_Question_Asking-Platform/backend/server.js#L444-L451)

**Problem:**
Health check doesn't verify Supabase connection.

**Impact:**
- 🐛 Server reports healthy even if database is down

---

## 📋 Summary

| Priority | Count |
|----------|-------|
| 🔴 Critical | 3 |
| 🟠 High | 5 |
| 🟡 Medium | 5 |
| 🟢 Low | 9 |
| 📊 Performance | 2 |
| 🎨 UI/UX | 3 |
| 🔒 Security | 3 |
| 📝 Code Quality | 3 |
| 🚀 Deployment | 2 |
| **Total** | **35** |

---

## 🎯 Recommended Priority Order

1. **Fix CORS for localhost** (Issue #1)
2. **Remove duplicate event listeners** (Issue #2)
3. **Add missing database column** (Issue #3)
4. **Improve data persistence** (Issues #4, #7, #12)
5. **Better error handling** (Issues #5, #10)
6. **Add input validation** (Issue #9)
7. **Implement rate limiting** (Issue #13)
8. **Add XSS protection** (Issue #27)
9. **Improve UI/UX** (Issues #11, #23, #24, #25)
10. **Add tests** (Issue #31)
