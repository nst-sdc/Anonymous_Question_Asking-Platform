## Reviewer's Guide

This PR bootstraps the anonymous Q&A platform by adding project documentation and license, implementing core client-side logic via a React context provider (state persistence, authentication, room/chat management, messaging, moderation, polls, reactions, utilities), including unit tests for the context API, ingesting auto-generated coverage reports into the frontend, and introducing base styling and dependency locks.

#### Sequence diagram for student sending a message with moderation and profanity filter

```mermaid
sequenceDiagram
  actor Student
  participant AppContext
  participant Room
  participant ProfanityFilter
  Student->>AppContext: sendMessage(content)
  AppContext->>ProfanityFilter: checkProfanity(content)
  alt Prohibited content
    ProfanityFilter-->>AppContext: isProhibited = true
    AppContext-->>Student: Error (message removed, violation, possible ban)
    AppContext->>Room: (if banned) remove user from room
  else Warning content
    ProfanityFilter-->>AppContext: isWarning = true
    AppContext-->>Student: Warning (possible silence/ban)
    AppContext->>Room: (if silenced/banned) update user status
  else Clean content
    ProfanityFilter-->>AppContext: isProhibited = false, isWarning = false
    AppContext->>Room: Add message
    AppContext-->>Student: Success
  end
```

#### Sequence diagram for teacher moderating a student (silence/ban)

```mermaid
sequenceDiagram
  actor Teacher
  participant AppContext
  participant Room
  participant Student
  Teacher->>AppContext: silenceUser(studentId, duration)
  AppContext->>Room: Update participant (silencedUntil, violations)
  alt Violations >= 4 and duration >= 20
    AppContext->>Room: Remove student, set banned
    Room->>All: System message (student banned)
  else
    Room->>All: System message (student silenced)
  end
  AppContext-->>Teacher: Success
```

#### Sequence diagram for poll creation and voting

```mermaid
sequenceDiagram
  actor Teacher
  actor Student
  participant AppContext
  participant Room
  Teacher->>AppContext: createPoll(question, options)
  AppContext->>Room: Add new poll (active)
  Room->>All: System message (new poll)
  Student->>AppContext: votePoll(pollId, option)
  AppContext->>Room: Register vote
  AppContext-->>Student: Success
```

#### Class diagram for AppContext state and actions

```mermaid
classDiagram
  class AppContext {
    +user: User | null
    +currentRoom: Room | null
    +rooms: Room[]
    +isLoading: boolean
    +error: string | null
    +login(role, username)
    +logout()
    +createRoom(name)
    +joinRoom(code)
    +leaveRoom()
    +endRoom(roomId)
    +sendMessage(content)
    +silenceUser(userId, duration)
    +addReaction(messageId, emoji)
    +createPoll(question, options)
    +closePoll(pollId)
    +votePoll(pollId, option)
    +getRoomById(roomId)
    +getRoomMessages(roomId)
    +getActivePoll(roomId)
    +hasUserVoted(poll, userId)
    +getUserVote(poll, userId)
    +getPollResults(poll)
    +isRoomOwner(room)
    +isParticipant(room, userId)
    +getUserById(userId)
    +formatTimestamp(timestamp)
    +isUserOnline(user)
    +clearError()
  }
  class User {
    +id: string
    +role: "student"|"teacher"
    +anonymousName: string
    +violations: number
    +banned: boolean
    +lastActive: string
    +createdAt: string
    +isOnline: boolean
    +silencedUntil?: string
    +banReason?: string
    +silenceReason?: string
  }
  class Room {
    +id: string
    +code: string
    +name: string
    +teacherId: string
    +teacherName: string
    +messages: Message[]
    +polls: Poll[]
    +participants: User[]
    +createdAt: string
    +updatedAt: string
    +isActive: boolean
    +endedAt?: string
    +moderationLogs?: ModerationLog[]
    +lastActivity?: string
    +participantCount?: number
  }
  class Message {
    +id: string
    +content: string
    +userId: string
    +username: string
    +userRole: string
    +timestamp: string
    +reactions: Record<string, string[]>
    +isEdited: boolean
    +isSystemMessage?: boolean
    +pollId?: string
  }
  class Poll {
    +id: string
    +question: string
    +options: string[]
    +votes: Record<string, string[]>
    +createdBy: string
    +creatorName: string
    +active: boolean
    +createdAt: string
    +closedAt?: string
    +totalVotes: number
    +lastVotedAt?: string
  }
  class ModerationLog {
    +id: string
    +userId: string
    +moderatorId: string
    +action: string
    +duration?: number
    +reason: string
    +timestamp: string
  }
  AppContext o-- User
  AppContext o-- Room
  Room o-- Message
  Room o-- Poll
  Room o-- User : participants
  Room o-- ModerationLog
  Poll o-- "votes: Record<option, User[]>" User
  Message o-- "reactions: Record<emoji, User[]>" User
```

### File-Level Changes

| Change | Details | Files |
| ------ | ------- | ----- |
| Enrich project documentation and licensing | <ul><li>Expanded README with overview, roles, features, architecture, and future roadmap</li><li>Added LICENSE file</li></ul> | `README.md`<br/>`LICENSE` |
| Implement global app context and business logic | <ul><li>Create AppContext provider with localStorage state, auth flows, room create/join/leave</li><li>Implement messaging, moderation (silence/ban), reactions, polls, and utility hooks</li><li>Expose `useApp` hook and constants for UI constraints</li></ul> | `frontend/src/context/AppContext.jsx` |
| Add unit tests for AppContext | <ul><li>Mock `useApp` to test login/logout, room lifecycle, persistence</li><li>Verify localStorage interactions</li></ul> | `frontend/src/__tests__/context/AppContext.test.js` |
| Include code coverage reports | <ul><li>Add Istanbul‐generated HTML coverage for AppContext.jsx and App.jsx</li><li>Check coverage summaries and uncovered blocks</li></ul> | `frontend/coverage/lcov-report/src/context/AppContext.jsx.html`<br/>`frontend/coverage/lcov-report/src/App.jsx.html` |
| Introduce base styling and lock dependencies | <ul><li>Add Tailwind index.css and fadeIn keyframes</li><li>Include updated package-lock.json</li></ul> | `frontend/src/index.css`<br/>`backend/package-lock.json` |

---

