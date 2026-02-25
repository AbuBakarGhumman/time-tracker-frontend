# Time Tracker Frontend - Project Structure

## Directory Overview

```
time-tracker-frontend/
├── public/
│   └── (static assets, favicon)
│
├── src/
│   ├── api/
│   │   ├── config.ts               # API base URL configuration
│   │   ├── auth.ts                 # User authentication API calls
│   │   ├── analytics.ts            # Analytics and trends API calls
│   │   ├── timeentries.ts          # Time entry CRUD API calls
│   │   ├── images.ts               # Image upload API calls
│   │   └── interceptor.ts          # Axios interceptors for token refresh
│   │
│   ├── components/
│   │   ├── Header.tsx              # Navigation header with menu
│   │   ├── Footer.tsx              # Footer component
│   │   ├── DashboardLayout.tsx     # Layout for main dashboard
│   │   ├── CompanyDashboardLayout.tsx # Layout for company dashboards
│   │   └── AnalogClockIcon.tsx     # Analog clock icon component
│   │
│   ├── pages/
│   │   ├── Intro.tsx               # Introduction/Landing page
│   │   ├── Login.tsx               # User login page
│   │   ├── Register.tsx            # User registration with profile picture upload
│   │   ├── Home.tsx                # User dashboard with check-in/check-out
│   │   ├── TimeTracker.tsx         # Time tracking page (manual & automatic timers)
│   │   ├── Analytics.tsx           # Analytics with daily/weekly/monthly views
│   │   ├── CheckinTrends.tsx       # Check-in trend analysis page
│   │   ├── About.tsx               # About page
│   │   ├── TermsOfService.tsx      # Terms of service page
│   │   ├── PrivacyPolicy.tsx       # Privacy policy page
│   │   └── company/
│   │       ├── AdminDashboard.tsx     # Company admin dashboard
│   │       ├── EmployeeDashboard.tsx  # Employee dashboard
│   │       ├── HrDashboard.tsx        # HR dashboard
│   │       ├── ManagerDashboard.tsx   # Manager dashboard
│   │       └── TeamLeadDashboard.tsx  # Team lead dashboard
│   │
│   ├── hooks/
│   │   └── (custom React hooks - to be implemented)
│   │
│   ├── types/
│   │   └── (TypeScript type definitions - to be implemented)
│   │
│   ├── utils/
│   │   └── dateUtils.ts            # PKT timezone utilities and date formatting
│   │
│   ├── assets/
│   │   └── (images, icons, fonts)
│   │
│   ├── App.tsx                     # Main React app with routing
│   ├── main.tsx                    # React entry point
│   ├── index.css                   # Global styles
│   └── Structure.md                # This file
│
├── index.html                      # HTML entry point
├── package.json                    # NPM dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── tsconfig.app.json              # TypeScript app configuration
├── tsconfig.node.json             # TypeScript node configuration
├── vite.config.ts                  # Vite build configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── postcss.config.js               # PostCSS configuration
└── eslint.config.js                # ESLint configuration
```

## Key Files Description

## Key Files Description

### API Layer (`api/`)

#### config.ts
- `API_BASE_URL` - Base URL for backend API (http://localhost:8000 for dev)

#### auth.ts
- **Types:**
  - `User` - User profile type
  - `LoginPayload` - Login request
  - `AuthResponse` - Response with tokens

- **Functions:**
  - `registerUser()` - Register new user
  - `loginUser()` - Login and store tokens
  - `refreshAccessToken()` - Refresh expired access token
  - `logout()` - Clear tokens and logout
  - `getStoredUser()` - Get user from localStorage
  - `getStoredToken()` - Get access token from localStorage
  - `getStoredRefreshToken()` - Get refresh token from localStorage

#### analytics.ts
- `fetchDailyTrend()` - Get daily check-in/check-out trends and statistics
- `fetchWeeklyTrend()` - Get weekly attendance trends
- `fetchMonthlyStats()` - Get monthly statistics

#### timeentries.ts
- `fetchTimeEntries()` - Get list of time entries (manual & automatic)
- `createManualEntry()` - Create manual time entry with start/end times
- `startAutomaticEntry()` - Start automatic timer
- `stopTimerEntry()` - Stop automatic timer
- `fetchActiveEntry()` - Get current active timer
- `updateTimeEntry()` - Update existing entry
- `deleteTimeEntry()` - Delete entry

#### images.ts
- `uploadProfileImage()` - Upload user profile picture during registration

#### interceptor.ts
- Axios response interceptor for automatic token refresh
- Queues failed requests while refreshing token
- Retries requests with new token
- Auto-logout if refresh token is invalid

### Components (`components/`)

#### Header.tsx
- Navigation menu with links to:
  - Home (Dashboard)
  - Time Tracker
  - Analytics
  - Logout (when logged in)
- Shows login/register links when not authenticated

#### Footer.tsx
- Footer component

#### DashboardLayout.tsx
- Layout wrapper for user dashboards

#### CompanyDashboardLayout.tsx
- Layout wrapper for company/employee dashboards

#### AnalogClockIcon.tsx
- Visual analog clock icon component for time displays

### Pages (`pages/`)

#### Intro.tsx
- Landing/introduction page (public)

#### Login.tsx
- User login form with email and password inputs
- Link to registration page

#### Register.tsx
- User registration form
- Fields: Full Name, Username, Email, Password, Confirm Password
- Profile picture upload
- Link to login page

#### Home.tsx
- User dashboard page (protected)
- Quick access check-in/check-out buttons
- Current status display with elapsed time
- Recent 15-day check-in trends chart
- Weekly statistics

#### TimeTracker.tsx
- Time tracking management page (protected)
- Three modes: List, Manual Entry, Automatic Timer
- Manual entry creation with start/end times
- Automatic timer with start/stop controls
- Time entries history table
- Edit and delete functionality

#### Analytics.tsx
- Analytics page with multiple views (protected)
- Daily, Weekly, and Monthly view tabs
- Daily View:
  - Check-in vs expected time comparison
  - Check-out vs expected time comparison
  - Work hours vs required hours
  - Attendance and duty status cards
- Weekly/Monthly views with charts
- Uses formatTimePKT for correct timezone display

#### CheckinTrends.tsx
- Dedicated check-in trend analysis page
- Visual trends and statistics

#### About.tsx
- About page (public)

#### TermsOfService.tsx
- Terms of service page (public)

#### PrivacyPolicy.tsx
- Privacy policy page (public)

#### company/ (Dashboard pages for company employees)

##### AdminDashboard.tsx
- Company admin dashboard
- View all employees and their attendance
- Department and team management

##### EmployeeDashboard.tsx
- Employee dashboard within company context
- Check-in/check-out specific to company
- Company-specific time tracking

##### HrDashboard.tsx
- HR dashboard with attendance reports
- Employee records management
- Analytics and reporting

##### ManagerDashboard.tsx
- Manager dashboard
- Team attendance overview
- Performance tracking

##### TeamLeadDashboard.tsx
- Team lead dashboard
- Team member tracking
- Team-specific analytics

### Utilities (`utils/`)

#### dateUtils.ts
- **PKT Timezone Functions:**
  - `formatDatePKT()` - Format date with PKT timezone
  - `formatTimePKT()` - Format time only with PKT timezone
  - `formatDateOnlyPKT()` - Format date only with PKT timezone
  - `formatPKT()` - Format with custom options in PKT
  - `getTodayPKT()` - Get today's date in PKT (YYYY-MM-DD)
  - `getNowPKTForForm()` - Get current time for form inputs
  
- **Date Conversion Functions:**
  - `localDateTimeToPKTISO()` - Convert form datetime to PKT ISO format
  - `backendISOToDatetimeLocal()` - Convert ISO string to form input format
  - `isToday()` - Check if date is today
  - `isFutureDate()` - Check if date is in future

- **Purpose:** Ensures consistent PKT (UTC+5) timezone handling across all pages

### Routes

```
/                      → Intro page (public)
/login                 → Login page (public)
/register              → Registration page (public)
/about                 → About page (public)
/terms-of-service      → Terms of service page (public)
/privacy-policy        → Privacy policy page (public)

/home                  → User dashboard (protected)
/time-tracker          → Time tracking page (protected)
/analytics             → Analytics page (protected)
/checkin-trends        → Check-in trends page (protected)

/company/admin         → Admin dashboard (protected, company role required)
/company/employee      → Employee dashboard (protected, company role required)
/company/hr            → HR dashboard (protected, HR role required)
/company/manager       → Manager dashboard (protected, manager role required)
/company/team-lead     → Team lead dashboard (protected, team lead role required)
```

## Authentication Flow

1. **Registration:**
   - User fills form and uploads profile picture
   - `registerUser()` → stores profile picture
   - User is redirected to login

2. **Login:**
   - User submits email/password
   - Backend returns access token (30 min) + refresh token (7 days)
   - Tokens stored in localStorage
   - Axios Authorization header set
   - User redirected to dashboard

3. **Protected Routes:**
   - Routes check for access token
   - If no token, redirects to login

4. **Automatic Token Refresh:**
   - Axios interceptor detects 401 errors
   - Calls `refreshAccessToken()` with stored refresh token
   - Gets new access token from backend
   - Retries original request
   - If refresh fails, auto-logout

5. **Logout:**
   - Backend `/auth/logout` endpoint called
   - All tokens cleared from localStorage
   - Axios headers cleared
   - User redirected to home/login

## Time Tracking Features

### Check-in/Check-out (Attendance)
- Record daily work attendance on/off
- Backend enforces one check-in/check-out per day
- Duration calculated automatically
- Trend analysis with expected vs actual times
- Expected check-in: 12:00 PM (noon)
- Expected check-out: 9:00 PM (21:00)
- Required work hours: 9 hours per day

### Time Entries (Time Tracking)
- **Manual Mode:** Create entries with specific start/end times
- **Automatic Mode:** Start a timer, stop when done
- Task name, description, project, category, billable flag
- Status: active, paused, completed
- Duration calculated from start/end times
- Supports editing and deletion

### Analytics & Reports
- **Daily View:** Check-in/check-out comparison with expected times
- **Weekly View:** Work hours per day, duty completion status
- **Monthly View:** Monthly statistics and trends
- **Charts:** Visual representation of work patterns
- All times displayed in PKT timezone

## PKT Timezone Implementation

### Backend (Python)
```python
from datetime import datetime, timezone, timedelta

PKT = timezone(timedelta(hours=5))  # UTC+5

# Create times in PKT
now = datetime.now(PKT)

# Format with explicit PKT conversion
def _format_time_pkt(dt: datetime) -> str:
    pkt_dt = dt.astimezone(PKT)
    return pkt_dt.strftime("%I:%M %p")  # e.g., "02:30 PM"
```

### Frontend (TypeScript/React)
```typescript
// Get current PKT time for forms
const now = getNowPKTForForm();  // "YYYY-MM-DDTHH:mm"

// Convert form input to PKT ISO
const isoTime = localDateTimeToPKTISO(formValue);  // "YYYY-MM-DDTHH:mm:00"

// Display time from backend ISO string
const display = formatTimePKT(isoString);  // "02:30 PM"

// Use pre-formatted strings from backend
<span>{dailyTrend.checkin_time_display}</span>  // Already in PKT
```

### Key Points
- All times in database stored with PKT timezone info
- Frontend sends times WITHOUT UTC conversion
- Backend formats display strings explicitly in PKT
- Analytics show accurate times across all pages
- No double timezone conversions

## State Management

### Local Storage
```javascript
{
  access_token: string      // JWT access token
  refresh_token: string     // JWT refresh token
  user: {                   // User profile
    id: number
    email: string
    username: string
    full_name: string
    profile_pic_url?: string
  }
}
```

### Component State
- `useState` hooks for form inputs and UI state
- `useEffect` hooks for API calls and data fetching
- Real-time updates via polling (10-second intervals for check-in status)

## Styling

- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Colors:** Blue, Green, Red, Purple, Yellow, Gray
- **Responsive:** Mobile-first approach with `md:` breakpoints

## Build & Development

- **Build Tool:** Vite
- **Package Manager:** npm
- **Language:** TypeScript + React
- **CSS:** Tailwind CSS

### Scripts
```json
{
  "dev": "vite",              // Start dev server
  "build": "vite build",      // Build for production
  "preview": "vite preview"   // Preview production build
}
```

## Features

- ✅ User Authentication (Login, Register)
- ✅ JWT Token Management (Access + Refresh tokens)
- ✅ Profile Picture Upload
- ✅ Dashboard with Quick Check-in/Check-out
- ✅ Time Tracker with History
- ✅ Daily/Weekly/Monthly Analytics
- ✅ Real-time Status Updates
- ✅ Automatic Token Refresh
- ✅ Protected Routes
- ✅ Responsive Design
- ⏳ Charts and visualizations
- ⏳ Profile management page

## API Integration

### Axios Instance
- Base URL from `config.ts`
- Automatic token injection in Authorization header
- Response interceptor for token refresh
- Error handling with user-friendly messages

### Error Handling
- Try-catch blocks in API calls
- User-friendly error messages via alerts
- Console logging for debugging
- Auto-logout on authentication errors

## Type Safety

- Full TypeScript support
- API response types defined in `auth.ts`
- Component prop types
- Interface-based architecture

## Performance

- Real-time updates (10-second polling)
- Elapsed time calculation (1-second refresh)
- Efficient re-renders with proper dependency arrays
- Optimized API calls (only fetch on mount/change)


