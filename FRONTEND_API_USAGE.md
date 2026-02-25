# Time Tracker Frontend - API Usage Documentation

## Table of Contents
1. [API Configuration](#api-configuration)
2. [Authentication API Module](#authentication-api-module)
3. [Time Entries API Module](#time-entries-api-module)
4. [Analytics API Module](#analytics-api-module)
5. [Images API Module](#images-api-module)
6. [Axios Interceptor & Token Management](#axios-interceptor--token-management)
7. [Data Flow Examples](#data-flow-examples)
8. [Error Handling](#error-handling)
9. [Local Storage Management](#local-storage-management)

---

## API Configuration

### File: `src/api/config.ts`

**Purpose:** Centralized API configuration

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export default API_BASE_URL;
```

**Environment Variables:**
- `VITE_API_BASE_URL` - Backend API base URL (set in `.env.local`)
- Default: `http://localhost:8000/api/v1`

**Usage:**
```typescript
import API_BASE_URL from './config';
// Use in axios requests
axios.get(`${API_BASE_URL}/endpoint`)
```

---

## Authentication API Module

### File: `src/api/auth.ts`

**Purpose:** Handle user registration, login, token refresh, and logout

### Functions

#### 1. Register User

**Function Signature:**
```typescript
export const registerUser = async (userData: UserRegisterRequest): Promise<User> => {
  // Implementation
}
```

**Parameter Type:**
```typescript
interface UserRegisterRequest {
  email: string;
  username: string;
  password: string;
  full_name: string;
}
```

**Returns:**
```typescript
interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  profile_pic_url: string | null;
  created_at: string; // ISO timestamp with PKT timezone
}
```

**API Endpoint Called:** `POST /auth/register`

**Usage Example:**
```typescript
// In Register.tsx
const handleRegister = async () => {
  try {
    const user = await registerUser({
      email: 'user@example.com',
      username: 'john_doe',
      password: 'SecurePass123!',
      full_name: 'John Doe'
    });
    console.log('User registered:', user);
  } catch (error) {
    console.error('Registration failed:', error);
  }
};
```

**Request JSON Sent to Backend:**
```json
{
  "email": "user@example.com",
  "username": "john_doe",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

**Response JSON from Backend:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "john_doe",
  "full_name": "John Doe",
  "profile_pic_url": null,
  "created_at": "2026-02-12T10:30:00+05:00"
}
```

---

#### 2. Login User

**Function Signature:**
```typescript
export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  // Implementation
}
```

**Parameter Type:**
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Returns:**
```typescript
interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}
```

**API Endpoint Called:** `POST /auth/login`

**Usage Example:**
```typescript
// In Login.tsx
const handleLogin = async () => {
  try {
    const response = await loginUser({
      email: 'user@example.com',
      password: 'SecurePass123!'
    });
    
    // Store tokens
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Redirect to dashboard
    navigate('/home');
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

**Request JSON:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response JSON:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "john_doe",
    "full_name": "John Doe",
    "profile_pic_url": null,
    "created_at": "2026-02-12T10:30:00+05:00"
  }
}
```

---

#### 3. Refresh Token

**Function Signature:**
```typescript
export const refreshAccessToken = async (refreshToken: string): Promise<TokenResponse> => {
  // Implementation
}
```

**Parameter Type:**
```typescript
interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
```

**API Endpoint Called:** `POST /auth/refresh`

**Internal Usage (via Axios Interceptor):**
```typescript
// Automatically called when access_token expires and 401 received
const newTokens = await refreshAccessToken(oldRefreshToken);
localStorage.setItem('access_token', newTokens.access_token);
```

**Request JSON:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response JSON:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

#### 4. Logout User

**Function Signature:**
```typescript
export const logoutUser = async (): Promise<void> => {
  // Implementation
}
```

**API Endpoint Called:** `POST /auth/logout`

**Usage Example:**
```typescript
// In Header.tsx or navigation menu
const handleLogout = async () => {
  try {
    await logoutUser();
    
    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    // Redirect to login
    navigate('/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

**Request JSON:**
```json
{}
```

**Response JSON:**
```json
{
  "message": "Logged out successfully"
}
```

---

## Time Entries API Module

### File: `src/api/timeentries.ts`

**Purpose:** Handle time entry operations (manual entries, timers, CRUD)

### Functions

#### 1. Create Manual Time Entry

**Function Signature:**
```typescript
export const createManualTimeEntry = async (entryData: TimeEntryCreateRequest): Promise<TimeEntry> => {
  // Implementation
}
```

**Parameter Type:**
```typescript
interface TimeEntryCreateRequest {
  task_name: string;
  description?: string;
  project?: string;
  category?: string;
  start_time: string; // Format: "2026-02-12T09:00:00" (PKT, no UTC conversion)
  end_time: string;   // Format: "2026-02-12T11:30:00" (PKT)
  is_billable: number; // 0 or 1
}
```

**Returns:**
```typescript
interface TimeEntry {
  id: number;
  user_id: number;
  task_name: string;
  description: string | null;
  project: string | null;
  category: string | null;
  start_time: string; // ISO with PKT timezone
  end_time: string;
  duration_hours: number;
  status: string; // "active" or "completed"
  is_billable: number;
  created_at: string;
  updated_at: string | null;
}
```

**API Endpoint Called:** `POST /time-entries/manual`

**Usage Example (TimeTracker.tsx):**
```typescript
import { createManualTimeEntry } from '../api/timeentries';
import { localDateTimeToPKTISO } from '../utils/dateUtils';

const handleCreateManualEntry = async (formData: ManualTimeEntryForm) => {
  try {
    const entry = await createManualTimeEntry({
      task_name: formData.task,
      description: formData.description,
      project: formData.project,
      category: formData.category,
      start_time: localDateTimeToPKTISO(formData.start_time), // Convert form input to PKT
      end_time: localDateTimeToPKTISO(formData.end_time),
      is_billable: formData.is_billable ? 1 : 0
    });
    
    console.log('Entry created:', entry);
    // Add to list, reset form
  } catch (error) {
    console.error('Failed to create entry:', error);
  }
};
```

**Request JSON Sent:**
```json
{
  "task_name": "API Development",
  "description": "Build RESTful endpoints",
  "project": "Project Alpha",
  "category": "Development",
  "start_time": "2026-02-12T09:00:00",
  "end_time": "2026-02-12T11:30:00",
  "is_billable": 1
}
```

**Response JSON:**
```json
{
  "id": 1,
  "user_id": 1,
  "task_name": "API Development",
  "description": "Build RESTful endpoints",
  "project": "Project Alpha",
  "category": "Development",
  "start_time": "2026-02-12T09:00:00+05:00",
  "end_time": "2026-02-12T11:30:00+05:00",
  "duration_hours": 2.5,
  "status": "completed",
  "is_billable": 1,
  "created_at": "2026-02-12T10:00:00+05:00",
  "updated_at": null
}
```

---

#### 2. Start Automatic Timer

**Function Signature:**
```typescript
export const startTimeEntry = async (entryData: TimeEntryStartRequest): Promise<TimeEntry> => {
  // Implementation
}
```

**Parameter Type:**
```typescript
interface TimeEntryStartRequest {
  task_name: string;
  description?: string;
  project?: string;
  category?: string;
  is_billable: number; // 0 or 1
}
```

**API Endpoint Called:** `POST /time-entries/start`

**Usage Example (TimeTracker.tsx):**
```typescript
import { startTimeEntry } from '../api/timeentries';

const handleStartTimer = async (taskData: TimerForm) => {
  try {
    const entry = await startTimeEntry({
      task_name: taskData.task,
      description: taskData.description,
      project: taskData.project,
      category: taskData.category,
      is_billable: taskData.is_billable ? 1 : 0
    });
    
    setActiveTimer(entry);
    startElapsedTimeCounter(entry.start_time);
  } catch (error) {
    console.error('Failed to start timer:', error);
  }
};
```

**Request JSON:**
```json
{
  "task_name": "Code Review",
  "description": "Review pull requests",
  "project": "Project Beta",
  "category": "Development",
  "is_billable": 1
}
```

**Response JSON:**
```json
{
  "id": 2,
  "user_id": 1,
  "task_name": "Code Review",
  "description": "Review pull requests",
  "project": "Project Beta",
  "category": "Development",
  "start_time": "2026-02-12T14:00:00+05:00",
  "end_time": null,
  "duration_hours": null,
  "status": "active",
  "is_billable": 1,
  "created_at": "2026-02-12T14:00:00+05:00",
  "updated_at": null
}
```

---

#### 3. Stop Automatic Timer

**Function Signature:**
```typescript
export const stopTimeEntry = async (entryId: number): Promise<TimeEntry> => {
  // Implementation
}
```

**API Endpoint Called:** `POST /time-entries/stop/{entry_id}`

**Usage Example (TimeTracker.tsx):**
```typescript
import { stopTimeEntry } from '../api/timeentries';

const handleStopTimer = async (entryId: number) => {
  try {
    const stoppedEntry = await stopTimeEntry(entryId);
    
    setActiveTimer(null);
    // Add to completed entries list
    addCompletedEntry(stoppedEntry);
  } catch (error) {
    console.error('Failed to stop timer:', error);
  }
};
```

**Request JSON:**
```json
{}
```

**Response JSON:**
```json
{
  "id": 2,
  "user_id": 1,
  "task_name": "Code Review",
  "description": "Review pull requests",
  "project": "Project Beta",
  "category": "Development",
  "start_time": "2026-02-12T14:00:00+05:00",
  "end_time": "2026-02-12T15:30:00+05:00",
  "duration_hours": 1.5,
  "status": "completed",
  "is_billable": 1,
  "created_at": "2026-02-12T14:00:00+05:00",
  "updated_at": "2026-02-12T15:30:00+05:00"
}
```

---

#### 4. Get Active Timer

**Function Signature:**
```typescript
export const getActiveTimeEntry = async (): Promise<TimeEntry | null> => {
  // Implementation
}
```

**API Endpoint Called:** `GET /time-entries/active`

**Usage Example (TimeTracker.tsx - component mount):**
```typescript
useEffect(() => {
  const loadActiveTimer = async () => {
    try {
      const activeEntry = await getActiveTimeEntry();
      if (activeEntry) {
        setActiveTimer(activeEntry);
        startElapsedTimeCounter(activeEntry.start_time);
      }
    } catch (error) {
      console.error('Failed to load active timer:', error);
    }
  };
  
  loadActiveTimer();
}, []);
```

**Response JSON (Timer Running):**
```json
{
  "id": 2,
  "user_id": 1,
  "task_name": "Code Review",
  "description": "Review pull requests",
  "project": "Project Beta",
  "category": "Development",
  "start_time": "2026-02-12T14:00:00+05:00",
  "end_time": null,
  "duration_hours": null,
  "status": "active",
  "is_billable": 1,
  "created_at": "2026-02-12T14:00:00+05:00"
}
```

**Response JSON (No Timer Running):**
```json
null
```

---

#### 5. Get Time Entries List

**Function Signature:**
```typescript
export const getTimeEntries = async (days?: number): Promise<TimeEntry[]> => {
  // Implementation
}
```

**API Endpoint Called:** `GET /time-entries/list?days=7`

**Usage Example (TimeTracker.tsx):**
```typescript
useEffect(() => {
  const loadEntries = async () => {
    try {
      const entries = await getTimeEntries(7); // Last 7 days
      setTimeEntries(entries);
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  };
  
  loadEntries();
}, []);
```

**Response JSON:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "task_name": "API Development",
    "description": "Build RESTful endpoints",
    "project": "Project Alpha",
    "category": "Development",
    "start_time": "2026-02-12T09:00:00+05:00",
    "end_time": "2026-02-12T11:30:00+05:00",
    "duration_hours": 2.5,
    "status": "completed",
    "is_billable": 1,
    "created_at": "2026-02-12T10:00:00+05:00"
  },
  {
    "id": 2,
    "user_id": 1,
    "task_name": "Code Review",
    "description": "Review pull requests",
    "project": "Project Beta",
    "category": "Development",
    "start_time": "2026-02-12T14:00:00+05:00",
    "end_time": "2026-02-12T15:30:00+05:00",
    "duration_hours": 1.5,
    "status": "completed",
    "is_billable": 1,
    "created_at": "2026-02-12T14:00:00+05:00"
  }
]
```

---

#### 6. Get Entries by Date

**Function Signature:**
```typescript
export const getTimeEntriesByDate = async (date: string): Promise<TimeEntryByDateResponse> => {
  // Implementation
}
```

**Parameter Type:**
```typescript
interface TimeEntryByDateResponse {
  date: string;
  total_entries: number;
  total_hours: number;
  billable_hours: number;
  entries: TimeEntry[];
}
```

**API Endpoint Called:** `GET /time-entries/date/{date}`

**Usage Example:**
```typescript
const handleDateSelect = async (date: string) => {
  try {
    const dayEntries = await getTimeEntriesByDate(date); // "2026-02-12"
    console.log(`Total hours on ${date}: ${dayEntries.total_hours}`);
    setDayEntries(dayEntries.entries);
  } catch (error) {
    console.error('Failed to load entries for date:', error);
  }
};
```

**Response JSON:**
```json
{
  "date": "2026-02-12",
  "total_entries": 2,
  "total_hours": 4.0,
  "billable_hours": 4.0,
  "entries": [
    {
      "id": 1,
      "task_name": "API Development",
      "start_time": "2026-02-12T09:00:00+05:00",
      "end_time": "2026-02-12T11:30:00+05:00",
      "duration_hours": 2.5,
      "status": "completed",
      "is_billable": 1
    },
    {
      "id": 2,
      "task_name": "Code Review",
      "start_time": "2026-02-12T14:00:00+05:00",
      "end_time": "2026-02-12T15:30:00+05:00",
      "duration_hours": 1.5,
      "status": "completed",
      "is_billable": 1
    }
  ]
}
```

---

#### 7. Update Time Entry

**Function Signature:**
```typescript
export const updateTimeEntry = async (entryId: number, entryData: TimeEntryUpdateRequest): Promise<TimeEntry> => {
  // Implementation
}
```

**Parameter Type:**
```typescript
interface TimeEntryUpdateRequest {
  task_name?: string;
  description?: string;
  project?: string;
  category?: string;
  start_time?: string;
  end_time?: string;
  is_billable?: number;
}
```

**API Endpoint Called:** `PUT /time-entries/{entry_id}`

**Usage Example (TimeTracker.tsx - edit form):**
```typescript
const handleUpdateEntry = async (entryId: number, updates: TimeEntryForm) => {
  try {
    const updated = await updateTimeEntry(entryId, {
      task_name: updates.task,
      description: updates.description,
      project: updates.project,
      category: updates.category,
      start_time: localDateTimeToPKTISO(updates.start_time),
      end_time: localDateTimeToPKTISO(updates.end_time),
      is_billable: updates.is_billable ? 1 : 0
    });
    
    // Update in list
    updateEntryInList(updated);
    closeEditModal();
  } catch (error) {
    console.error('Failed to update entry:', error);
  }
};
```

**Request JSON:**
```json
{
  "task_name": "API Development - Updated",
  "description": "Build and test RESTful endpoints",
  "start_time": "2026-02-12T09:00:00",
  "end_time": "2026-02-12T12:00:00",
  "is_billable": 1
}
```

**Response JSON:**
```json
{
  "id": 1,
  "user_id": 1,
  "task_name": "API Development - Updated",
  "description": "Build and test RESTful endpoints",
  "project": "Project Alpha",
  "category": "Development",
  "start_time": "2026-02-12T09:00:00+05:00",
  "end_time": "2026-02-12T12:00:00+05:00",
  "duration_hours": 3.0,
  "status": "completed",
  "is_billable": 1,
  "created_at": "2026-02-12T10:00:00+05:00",
  "updated_at": "2026-02-12T16:30:00+05:00"
}
```

---

#### 8. Delete Time Entry

**Function Signature:**
```typescript
export const deleteTimeEntry = async (entryId: number): Promise<void> => {
  // Implementation
}
```

**API Endpoint Called:** `DELETE /time-entries/{entry_id}`

**Usage Example (TimeTracker.tsx):**
```typescript
const handleDeleteEntry = async (entryId: number) => {
  if (confirm('Are you sure you want to delete this entry?')) {
    try {
      await deleteTimeEntry(entryId);
      removeEntryFromList(entryId);
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  }
};
```

**Response:**
- HTTP 200 OK - Entry deleted successfully

---

## Analytics API Module

### File: `src/api/analytics.ts`

**Purpose:** Fetch attendance statistics and trends for display

### Functions

#### 1. Get Daily Check-In Trend

**Function Signature:**
```typescript
export const getDailyCheckInTrend = async (date: string): Promise<DailyTrendResponse> => {
  // Implementation
}
```

**Parameter Type:**
```typescript
interface DailyTrendResponse {
  date: string;
  has_record: boolean;
  check_in_time: string | null;
  check_out_time: string | null;
  checkin_time_display: string; // e.g., "02:30 PM"
  checkout_time_display: string; // e.g., "09:50 PM"
  expected_checkin_display: string; // "12:00 PM"
  expected_checkout_display: string; // "09:00 PM"
  checkin_delay_minutes: number | null;
  checkout_diff_minutes: number | null;
  checkin_status: string; // "Late" or "On Time"
  checkout_status: string;
  actual_work_hours: number;
  required_work_hours: number;
  duty_completed: boolean;
  shortfall_hours: number;
}
```

**API Endpoint Called:** `GET /attendance/trend/daily/{date}`

**Usage Example (CheckinTrends.tsx):**
```typescript
import { getDailyCheckInTrend } from '../api/analytics';
import { formatDatePKT } from '../utils/dateUtils';

const [selectedDate, setSelectedDate] = useState('2026-02-12');

useEffect(() => {
  const loadTrend = async () => {
    try {
      const trend = await getDailyCheckInTrend(selectedDate);
      setDailyTrend(trend);
    } catch (error) {
      console.error('Failed to load trend:', error);
    }
  };
  
  loadTrend();
}, [selectedDate]);
```

**Response JSON:**
```json
{
  "date": "2026-02-12",
  "has_record": true,
  "check_in_time": "2026-02-12T14:30:00+05:00",
  "check_out_time": "2026-02-12T21:50:00+05:00",
  "checkin_time_display": "02:30 PM",
  "checkout_time_display": "09:50 PM",
  "expected_checkin_display": "12:00 PM",
  "expected_checkout_display": "09:00 PM",
  "checkin_delay_minutes": 150,
  "checkout_diff_minutes": 50,
  "checkin_status": "Late",
  "checkout_status": "On Time",
  "actual_work_hours": 7.33,
  "required_work_hours": 9,
  "duty_completed": false,
  "shortfall_hours": 1.67
}
```

---

#### 2. Get Weekly Check-In Trends

**Function Signature:**
```typescript
export const getWeeklyCheckInTrends = async (): Promise<WeeklyTrendResponse> => {
  // Implementation
}
```

**Parameter Type:**
```typescript
interface WeeklyTrendResponse {
  week: string; // "2026-02-09 to 2026-02-15"
  trends: DailyTrendSummary[];
  total_work_hours: number;
  days_completed_duty: number;
  days_late: number;
  average_daily_hours: number;
}

interface DailyTrendSummary {
  date: string;
  work_hours: number;
  checkin_delay_minutes: number | null;
  duty_completed: boolean;
}
```

**API Endpoint Called:** `GET /attendance/trend/weekly`

**Usage Example (Home.tsx):**
```typescript
import { getWeeklyCheckInTrends } from '../api/analytics';

useEffect(() => {
  const loadWeeklyTrends = async () => {
    try {
      const trends = await getWeeklyCheckInTrends();
      setWeeklyData(trends);
    } catch (error) {
      console.error('Failed to load weekly trends:', error);
    }
  };
  
  loadWeeklyTrends();
}, []);
```

**Response JSON:**
```json
{
  "week": "2026-02-09 to 2026-02-15",
  "trends": [
    {
      "date": "2026-02-09",
      "work_hours": 9.5,
      "checkin_delay_minutes": -10,
      "duty_completed": true
    },
    {
      "date": "2026-02-10",
      "work_hours": 9.25,
      "checkin_delay_minutes": 15,
      "duty_completed": true
    },
    {
      "date": "2026-02-11",
      "work_hours": 0,
      "checkin_delay_minutes": null,
      "duty_completed": false
    }
  ],
  "total_work_hours": 45.5,
  "days_completed_duty": 4,
  "days_late": 2,
  "average_daily_hours": 6.5
}
```

---

#### 3. Get Date Range Trends

**Function Signature:**
```typescript
export const getDateRangeTrends = async (startDate: string, endDate: string): Promise<DateRangeTrendResponse> => {
  // Implementation
}
```

**Parameter Type:**
```typescript
interface DateRangeTrendResponse {
  start_date: string;
  end_date: string;
  trends: DailyTrendSummary[];
  total_days: number;
}
```

**API Endpoint Called:** `GET /attendance/trend/date-range?start_date=...&end_date=...`

**Usage Example (Analytics.tsx):**
```typescript
const handleDateRangeSelect = async (start: string, end: string) => {
  try {
    const trends = await getDateRangeTrends(start, end);
    setMonthlyTrends(trends);
  } catch (error) {
    console.error('Failed to load trends:', error);
  }
};
```

**Response JSON:**
```json
{
  "start_date": "2026-02-01",
  "end_date": "2026-02-12",
  "trends": [
    {
      "date": "2026-02-01",
      "checkin_delay_minutes": -5,
      "duty_completed": true,
      "work_hours": 9.33
    },
    {
      "date": "2026-02-02",
      "checkin_delay_minutes": 20,
      "duty_completed": true,
      "work_hours": 9.5
    },
    {
      "date": "2026-02-03",
      "checkin_delay_minutes": null,
      "duty_completed": false,
      "work_hours": 0
    }
  ],
  "total_days": 12
}
```

---

#### 4. Get Check-In Status

**Function Signature:**
```typescript
export const getCheckInStatus = async (): Promise<CheckInStatusResponse> => {
  // Implementation
}
```

**Parameter Type:**
```typescript
interface CheckInStatusResponse {
  is_checked_in: boolean;
  check_in_time?: string;
  check_out_time?: string;
  status?: string;
  elapsed_seconds?: number;
  duration_hours?: number;
}
```

**API Endpoint Called:** `GET /attendance/status`

**Usage Example (Home.tsx - polling every 10 seconds):**
```typescript
const pollCheckInStatus = async () => {
  try {
    const status = await getCheckInStatus();
    setCheckInStatus(status);
  } catch (error) {
    console.error('Failed to check status:', error);
  }
};

useEffect(() => {
  // Poll status every 10 seconds
  const interval = setInterval(pollCheckInStatus, 10000);
  
  // Initial check
  pollCheckInStatus();
  
  return () => clearInterval(interval);
}, []);
```

**Response JSON (Checked In):**
```json
{
  "is_checked_in": true,
  "check_in_time": "2026-02-12T12:30:00+05:00",
  "check_out_time": null,
  "status": "checked_in",
  "elapsed_seconds": 32400
}
```

**Response JSON (Checked Out):**
```json
{
  "is_checked_in": false,
  "check_in_time": "2026-02-12T12:30:00+05:00",
  "check_out_time": "2026-02-12T21:50:00+05:00",
  "status": "checked_out",
  "duration_hours": 9.33
}
```

---

## Images API Module

### File: `src/api/images.ts`

**Purpose:** Handle profile picture uploads

### Functions

#### Upload Profile Picture

**Function Signature:**
```typescript
export const uploadProfilePicture = async (file: File): Promise<ImageUploadResponse> => {
  // Implementation
}
```

**Parameter Type:**
```typescript
interface ImageUploadResponse {
  message: string;
  file_url: string;
  file_name: string;
}
```

**API Endpoint Called:** `POST /images/upload-profile-pic`

**Usage Example (Register.tsx):**
```typescript
import { uploadProfilePicture } from '../api/images';

const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  try {
    const response = await uploadProfilePicture(file);
    setProfilePicUrl(response.file_url);
    setProfilePicName(response.file_name);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

**Request Format:**
```
Content-Type: multipart/form-data
file: <binary image data>
```

**Response JSON:**
```json
{
  "message": "Profile picture uploaded successfully",
  "file_url": "/uploads/profile_pics/uuid-1234567890.jpg",
  "file_name": "uuid-1234567890.jpg"
}
```

---

## Axios Interceptor & Token Management

### File: `src/api/interceptor.ts`

**Purpose:** Automatically handle token refresh and error responses

### How It Works

**1. Request Interceptor:**
```typescript
// Automatically adds Authorization header to all requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**2. Response Interceptor:**
```typescript
axios.interceptors.response.use(
  (response) => response, // Success - return as is
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - try to refresh
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const newTokens = await refreshAccessToken(refreshToken);
          localStorage.setItem('access_token', newTokens.access_token);
          localStorage.setItem('refresh_token', newTokens.refresh_token);
          
          // Retry original request with new token
          return axios(error.config);
        } catch (refreshError) {
          // Refresh failed - redirect to login
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
```

**Token Flow:**
1. User logs in → receives `access_token` (30 min) + `refresh_token` (7 days)
2. Stored in `localStorage`
3. All requests automatically include token in header
4. If request returns 401 → refresh token automatically
5. If refresh fails → clear tokens and redirect to login

---

## Data Flow Examples

### Example 1: User Registration and Login Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER FILLS REGISTRATION FORM IN Register.tsx                        │
├─────────────────────────────────────────────────────────────────────┤
│ Input: {email, username, password, full_name, profile_pic}         │
└──────────────────────┬──────────────────────┬───────────────────────┘
                       │                      │
                       ▼                      ▼
          ┌─────────────────────────┐    ┌──────────────────┐
          │ uploadProfilePicture()  │    │ registerUser()   │
          │ (api/images.ts)         │    │ (api/auth.ts)    │
          └──────────┬──────────────┘    └────────┬─────────┘
                     │                           │
                     ▼                           ▼
          POST /images/upload-profile-pic    POST /auth/register
                     │                           │
                     ▼                           ▼
          {file_url, file_name}         {id, email, username, ...}
                     │                           │
                     └───────────────┬───────────┘
                                     ▼
                          User account created
                          Ready to login
                                     │
                                     ▼
          ┌──────────────────────────────────────────────┐
          │ USER FILLS LOGIN FORM IN Login.tsx           │
          ├──────────────────────────────────────────────┤
          │ Input: {email, password}                     │
          └──────────────────┬───────────────────────────┘
                             ▼
                      loginUser() (api/auth.ts)
                             ▼
                      POST /auth/login
                             │
                ┌────────────┴────────────┐
                ▼                        ▼
         Response:               Store in localStorage:
         {access_token,          - access_token
          refresh_token,         - refresh_token
          user}                  - user (JSON)
                 │
                 └──► Redirect to /home
                      (Home.tsx loads)
```

---

### Example 2: Time Tracking with Timer Flow

```
┌────────────────────────────────────┐
│ TimeTracker.tsx Component Mounts    │
└──────────────┬─────────────────────┘
               ▼
┌────────────────────────────────────┐
│ getActiveTimeEntry()               │
│ (Check if timer already running)    │
└──────────────┬─────────────────────┘
               ▼
            GET /time-entries/active
               │
         ┌─────┴────────┐
         │              │
    ▼ (Timer Running)   ▼ (No Timer)
  Active Entry       Null
    │                 │
    ├──► Display counter
    │    (Elapsed time)
    │
    ▼ (User clicks Stop)
    stopTimeEntry(entryId)
         │
         ▼
    POST /time-entries/stop/2
         │
         ├─► Response: {id, duration_hours, ...}
         │
         ├─► Update in list
         │
         ├─► Clear timer display
         │
         └─► Show completed entry

    OR

    ▼ (User clicks Start New Timer)
    startTimeEntry({task_name, ...})
         │
         ▼
    POST /time-entries/start
         │
         ├─► Response: {id, start_time, status: "active", ...}
         │
         ├─► Save to state (activeTimer)
         │
         └─► Start counter display
```

---

### Example 3: Daily Check-In Flow with Status Polling

```
┌────────────────────────────────────┐
│ Home.tsx Component                  │
│ (Dashboard Page)                    │
└──────────────┬─────────────────────┘
               ▼
┌────────────────────────────────────┐
│ Component Mount                     │
└──────────────┬─────────────────────┘
               │
        ┌──────┴──────────┐
        │                 │
        ▼                 ▼
   getCheckInStatus() getWeeklyCheckInTrends()
        │                 │
        ▼                 ▼
   GET /attendance/   GET /attendance/
   status            trend/weekly
        │                 │
        ├─► Render status ├─► Render weekly trends
        │   (button states)    (chart/table)
        │
        ▼ (Every 10 seconds - Polling)
   setInterval(() => getCheckInStatus(), 10000)
        │
        ├─► Check if user checked-in
        ├─► Update elapsed time
        ├─► Update button states
        │
        ▼ (User clicks Check-In)
   POST /attendance/check-in
        │
        ├─► Response: {check_in_time, status, ...}
        │
        ├─► Update button (disable Check-In, enable Check-Out)
        │
        └─► Refresh status polling
```

---

## Error Handling

### Common Error Scenarios

#### 1. Network Error
```typescript
try {
  await loginUser({ email, password });
} catch (error) {
  if (error instanceof AxiosError) {
    if (!error.response) {
      // Network error - no response from server
      setError('Network error. Please check your connection.');
    }
  }
}
```

#### 2. 401 Unauthorized (Token Expired)
```typescript
// Handled automatically by interceptor
// Response interceptor will:
// 1. Attempt to refresh token
// 2. Retry request with new token
// 3. If refresh fails → redirect to login
```

#### 3. 400 Bad Request / 422 Validation Error
```typescript
try {
  await createManualTimeEntry(data);
} catch (error) {
  if (error instanceof AxiosError && error.response?.status === 400) {
    const message = error.response.data.detail;
    // "End time must be after start time"
    setError(message);
  }
}
```

#### 4. 409 Conflict (Duplicate / Already Exists)
```typescript
try {
  await registerUser(userData);
} catch (error) {
  if (error instanceof AxiosError && error.response?.status === 409) {
    // "Email already exists" or "Username already exists"
    setError(error.response.data.detail);
  }
}
```

---

## Local Storage Management

### What Gets Stored

```typescript
// After successful login
localStorage.setItem('access_token', response.access_token);
localStorage.setItem('refresh_token', response.refresh_token);
localStorage.setItem('user', JSON.stringify(response.user));

// Structure stored:
{
  access_token: "eyJhbGci...", // JWT token
  refresh_token: "eyJhbGci...", // JWT token
  user: {
    id: 1,
    email: "user@example.com",
    username: "john_doe",
    full_name: "John Doe",
    profile_pic_url: null
  }
}
```

### Reading from Storage

```typescript
// Get stored user
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log(user.full_name);

// Get token for manual requests
const token = localStorage.getItem('access_token');

// Check if user is logged in
const isLoggedIn = !!localStorage.getItem('access_token');
```

### Clearing Storage (Logout)

```typescript
const handleLogout = async () => {
  await logoutUser();
  
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  
  navigate('/login');
};
```

---

## Component Examples

### Example: TimeTracker.tsx Integration

```typescript
import { useState, useEffect } from 'react';
import { createManualTimeEntry, startTimeEntry, stopTimeEntry, getActiveTimeEntry, getTimeEntries } from '../api/timeentries';
import { getCheckInStatus } from '../api/analytics';
import { localDateTimeToPKTISO, formatTimePKT } from '../utils/dateUtils';

export default function TimeTracker() {
  const [activeTimer, setActiveTimer] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [manualForm, setManualForm] = useState({
    task: '',
    start_time: '',
    end_time: '',
    is_billable: false
  });
  
  // Load active timer and entries on mount
  useEffect(() => {
    loadActiveTimer();
    loadTimeEntries();
  }, []);
  
  const loadActiveTimer = async () => {
    try {
      const active = await getActiveTimeEntry();
      if (active) setActiveTimer(active);
    } catch (error) {
      console.error('Failed to load active timer:', error);
    }
  };
  
  const loadTimeEntries = async () => {
    try {
      const entries = await getTimeEntries(7);
      setTimeEntries(entries);
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  };
  
  const handleStartTimer = async () => {
    try {
      const entry = await startTimeEntry({
        task_name: 'Quick Task',
        is_billable: 1
      });
      setActiveTimer(entry);
    } catch (error) {
      alert('Failed to start timer: ' + error.message);
    }
  };
  
  const handleStopTimer = async () => {
    try {
      const stopped = await stopTimeEntry(activeTimer.id);
      setActiveTimer(null);
      setTimeEntries([stopped, ...timeEntries]);
    } catch (error) {
      alert('Failed to stop timer: ' + error.message);
    }
  };
  
  const handleCreateManualEntry = async () => {
    try {
      const entry = await createManualTimeEntry({
        task_name: manualForm.task,
        start_time: localDateTimeToPKTISO(manualForm.start_time),
        end_time: localDateTimeToPKTISO(manualForm.end_time),
        is_billable: manualForm.is_billable ? 1 : 0
      });
      setTimeEntries([entry, ...timeEntries]);
      setManualForm({ task: '', start_time: '', end_time: '', is_billable: false });
    } catch (error) {
      alert('Failed to create entry: ' + error.message);
    }
  };
  
  return (
    <div>
      <h1>Time Tracker</h1>
      
      {/* Timer Section */}
      {activeTimer ? (
        <div className="active-timer">
          <p>Task: {activeTimer.task_name}</p>
          <p>Running since: {formatTimePKT(activeTimer.start_time)}</p>
          <button onClick={handleStopTimer}>Stop Timer</button>
        </div>
      ) : (
        <button onClick={handleStartTimer}>Start Timer</button>
      )}
      
      {/* Manual Entry Form */}
      <div className="manual-form">
        <input
          type="text"
          placeholder="Task name"
          value={manualForm.task}
          onChange={(e) => setManualForm({...manualForm, task: e.target.value})}
        />
        <input
          type="datetime-local"
          value={manualForm.start_time}
          onChange={(e) => setManualForm({...manualForm, start_time: e.target.value})}
        />
        <input
          type="datetime-local"
          value={manualForm.end_time}
          onChange={(e) => setManualForm({...manualForm, end_time: e.target.value})}
        />
        <button onClick={handleCreateManualEntry}>Create Entry</button>
      </div>
      
      {/* Entries List */}
      <table>
        <tbody>
          {timeEntries.map(entry => (
            <tr key={entry.id}>
              <td>{entry.task_name}</td>
              <td>{formatTimePKT(entry.start_time)}</td>
              <td>{entry.duration_hours}h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Summary

**Frontend API Layer Architecture:**

1. **api/config.ts** - Base URL configuration
2. **api/auth.ts** - User authentication (register, login, refresh, logout)
3. **api/timeentries.ts** - Time entry operations (CRUD, timer)
4. **api/analytics.ts** - Attendance trends and statistics
5. **api/images.ts** - File uploads
6. **api/interceptor.ts** - Axios middleware for tokens and error handling

**All requests automatically include:**
- `Authorization: Bearer {access_token}` header
- Automatic token refresh on 401
- Error handling with detailed messages

**All responses use PKT timezone** (UTC+5) - no conversion needed on frontend display.

