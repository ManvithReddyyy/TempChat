# TempChat Design Guidelines

## Design Approach
**Selected Approach:** Design System with Modern Chat UI Patterns

Drawing from Material Design principles combined with modern messaging interfaces (Discord, Slack, Telegram). This is a **utility-focused application** where clarity, speed, and usability are paramount over visual flourishes.

**Core Principles:**
- Instant clarity and minimal friction
- Message readability is the top priority
- Clean, distraction-free interface
- Ephemeral nature reflected in lightweight design

---

## Typography

**Font Family:** Inter or DM Sans (Google Fonts CDN)

**Type Scale:**
- Page Titles: `text-2xl md:text-3xl font-bold`
- Room Codes: `text-4xl md:text-5xl font-mono font-bold tracking-wider`
- Usernames in Chat: `text-sm font-semibold`
- Message Text: `text-base leading-relaxed`
- Timestamps: `text-xs opacity-60`
- UI Labels: `text-sm font-medium`
- Active Users Count: `text-sm font-semibold`

---

## Layout System

**Spacing Units:** Tailwind units of **2, 3, 4, 6, 8** (e.g., `p-4`, `gap-6`, `mb-8`)

**Container Widths:**
- Landing page content: `max-w-md mx-auto`
- Chat interface: Full viewport with `max-w-4xl mx-auto` for message container

---

## Component Library

### Landing Page (Create/Join)
**Layout:** Single-column centered card on clean background
- Card container: `max-w-md rounded-2xl p-8 shadow-lg`
- Logo/Title area at top with app name
- Two prominent action buttons: "Create Room" and input field with "Join Room" button
- Brief tagline explaining ephemeral nature: "Temporary chat rooms that auto-expire"
- No hero image - focus on immediate functionality

### Chat Interface
**Layout Structure:**
- **Header Bar** (fixed top):
  - Room code display (prominent, copyable)
  - Active users count with icon
  - "Leave Room" button (right-aligned)
  - Height: `h-16` with border-bottom

- **Messages Area** (scrollable, fills remaining height):
  - Padding: `p-6`
  - Message bubbles layout:
    - Each message: `mb-4`
    - Username + timestamp header: `mb-1`
    - Bubble: `rounded-2xl px-4 py-3 inline-block max-w-md`
    - Left-aligned for others, right-aligned for current user
  - Auto-scroll to bottom behavior
  - Empty state: centered helper text when no messages

- **Typing Indicator Area**:
  - Fixed position above input
  - Height: `h-8`
  - Shows "Username is typing..." with animated dots

- **Input Area** (fixed bottom):
  - Container: `h-20 border-t`
  - Input field: `flex-1 rounded-full px-6 py-3`
  - Send button: rounded-full icon button (`w-12 h-12`)
  - Flexbox layout with `gap-3` between input and button

### Message Bubbles
- **Own messages:** Right-aligned, different styling
- **Other users:** Left-aligned with username and user-specific color accent
- **System messages** (joins/leaves): Centered, smaller, muted styling `text-sm opacity-70 text-center`

### Notifications/Toasts
- Room expiration warning: Top-center toast with countdown
- User joined/left: Inline system messages in chat
- Copied room code: Brief top-right toast

### Icons
**Library:** Heroicons (via CDN)
- Send: paper-airplane icon
- Copy: clipboard icon
- Users: user-group icon
- Leave: arrow-left-on-rectangle icon

---

## Responsive Behavior

**Mobile (< 768px):**
- Full viewport chat interface
- Input area: `px-4` reduced padding
- Message bubbles: `max-w-[80%]`
- Header: condensed layout, smaller text

**Desktop (>= 768px):**
- Max-width container for messages: `max-w-4xl`
- Comfortable spacing: `px-8`
- Message bubbles: `max-w-md`

---

## Animations
**Minimal and Purposeful:**
- Typing indicator: subtle dot animation
- Message entry: gentle fade-in (`transition-opacity duration-200`)
- Button interactions: standard hover scale (`hover:scale-105 transition-transform`)
- NO scroll animations, NO page transitions

---

## Accessibility
- Focus states on all interactive elements
- Keyboard navigation support (Enter to send, Esc to leave focus)
- ARIA labels for icon-only buttons
- Sufficient color contrast for all text
- Screen reader announcements for new messages

---

## Images
**No images required** - this is a utility application where text clarity and functionality are paramount. The design relies entirely on typography, spacing, and clean UI components.