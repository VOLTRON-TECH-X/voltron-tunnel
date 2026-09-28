# Voltron VPN Portal

Create a modern VPN website called "Voltron VPN" with:

1. Public signup (free trial accounts: 1, 3, 7 days)

2. Daily account creation limit (configurable, default 10/day)

3. Admin panel (login: Admin / @Voltron0120)

4. Real-time connection to LIVE API at https://api.voltrontechtx.shop



═══════════════════════════════════════════════════════════

🚨 CRITICAL CONFIGURATION

═══════════════════════════════════════════════════════════



Create .env file at project ROOT with EXACTLY:



```



VITE_API_URL=https://api.voltrontechtx.shop

VITE_API_KEY=voltron_PhESsAsy3dFbDfQAkqLzTNjgMSrJHQPB

VITE_ADMIN_USERNAME=Admin

VITE_ADMIN_PASSWORD=@Voltron0120

VITE_DEFAULT_DAILY_LIMIT=10



```



RULES:

1. NEVER hardcode API URL/Key in .tsx files — use import.meta.env

2. API uses HTTPS, NEVER HTTP

3. Every API request MUST include header: X-API-Key

4. Admin credentials also from .env (never hardcode in source)

5. Handle ALL errors gracefully



═══════════════════════════════════════════════════════════

📁 REQUIRED FILE STRUCTURE

═══════════════════════════════════════════════════════════



```



project-root/

├── .env

├── .env.example

├── src/

│   ├── lib/

│   │   ├── api.ts

│   │   ├── admin.ts             ← admin logic (localStorage)

│   │   └── dailyLimit.ts        ← daily limit tracking (localStorage)

│   ├── pages/

│   │   ├── Home.tsx

│   │   ├── Create.tsx

│   │   ├── Account.tsx

│   │   ├── Check.tsx

│   │   ├── AdminLogin.tsx

│   │   └── AdminDashboard.tsx

│   ├── components/

│   │   ├── Navbar.tsx

│   │   ├── Footer.tsx

│   │   ├── ProtocolCard.tsx

│   │   ├── LoadingSpinner.tsx

│   │   └── ProtectedAdminRoute.tsx

│   ├── App.tsx

│   └── main.tsx

└── package.json



```



═══════════════════════════════════════════════════════════

📄 src/lib/api.ts — CREATE EXACTLY THIS

═══════════════════════════════════════════════════════════



```typescript

const API_URL = import.meta.env.VITE_API_URL || 'https://api.voltrontechtx.shop';

const API_KEY = import.meta.env.VITE_API_KEY;



export interface ApiResponse {

  success?: boolean;

  available?: boolean;

  error?: string;

  message?: string;

  account?: Account;

  protocols?: Record<string, Protocol>;

  protocol_count?: number;

  count?: number;

  users?: Account[];

  total?: number;

  info?: any;

  [key: string]: any;

}



export interface Account {

  username: string;

  password: string;

  expiry: string;

  days?: number;

  days_left?: number;

  limit: number;

  bandwidth: string;

  server: string;

  server_ip: string;

  status?: string;

  online?: number;

  bandwidth_used_gb?: number;

  bandwidth_limit?: number;

}



export interface Protocol {

  id: string;

  name: string;

  icon: string;

  color: string;

  type: string;

  host?: string;

  ip?: string;

  port?: number;

  port_range?: string;

  exclude?: string;

  domain?: string;

  pubkey?: string;

  mtu?: number;

  dns?: string;

  dns_alt?: string;

  username?: string;

  password?: string;

  limit?: number;

  info?: string;

}



export async function apiCall(

  endpoint: string,

  method: 'GET' | 'POST' = 'GET',

  data: any = null

): Promise<ApiResponse> {

  if (!API_KEY) {

    return { success: false, error: 'API key missing in .env' };

  }



  const options: RequestInit = {

    method,

    headers: {

      'Content-Type': 'application/json',

      'X-API-Key': API_KEY,

    },

  };

  if (data && method === 'POST') options.body = JSON.stringify(data);



  try {

    const res = await fetch(`${API_URL}${endpoint}`, options);

    const json = await res.json();

    if (!res.ok) return { success: false, error: json.error || `HTTP ${res.status}` };

    return json;

  } catch (e: any) {

    return { success: false, error: e.message || 'Network error' };

  }

}



// Public

export const checkUsername = (username: string) =>

  apiCall('/api/trial/check', 'POST', { username });



export const createAccount = (username: string, password: string, days: number) =>

  apiCall('/api/trial/create', 'POST', { username, password, days });



export const getAccountStatus = (username: string) =>

  apiCall(`/api/trial/status/${username}`, 'GET');



export const getProtocols = () => apiCall('/api/protocols/status', 'GET');



// Admin

export const getAllUsers = () => apiCall('/api/users/list', 'GET');



export const deleteUser = (username: string) =>

  apiCall('/api/users/delete', 'POST', { username });



export const lockUser = (username: string) =>

  apiCall('/api/users/lock', 'POST', { username });



export const unlockUser = (username: string) =>

  apiCall('/api/users/unlock', 'POST', { username });



export const getDashboardInfo = () => apiCall('/api/dashboard/info', 'GET');

```



═══════════════════════════════════════════════════════════

📄 src/lib/admin.ts — ADMIN AUTH (localStorage)

═══════════════════════════════════════════════════════════



```typescript

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || 'Admin';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '@Voltron0120';

const SESSION_KEY = 'voltron_admin_session';

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours



export interface AdminSession {

  username: string;

  loginAt: number;

  expiresAt: number;

}



export function adminLogin(username: string, password: string): boolean {

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {

    const now = Date.now();

    const session: AdminSession = {

      username,

      loginAt: now,

      expiresAt: now + SESSION_DURATION,

    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return true;

  }

  return false;

}



export function adminLogout() {

  localStorage.removeItem(SESSION_KEY);

}



export function getAdminSession(): AdminSession | null {

  const raw = localStorage.getItem(SESSION_KEY);

  if (!raw) return null;

  try {

    const session: AdminSession = JSON.parse(raw);

    if (Date.now() > session.expiresAt) {

      localStorage.removeItem(SESSION_KEY);

      return null;

    }

    return session;

  } catch {

    return null;

  }

}



export function isAdminLoggedIn(): boolean {

  return getAdminSession() !== null;

}

```



═══════════════════════════════════════════════════════════

📄 src/lib/dailyLimit.ts — DAILY LIMIT TRACKING

═══════════════════════════════════════════════════════════



```typescript

const LIMIT_KEY = 'voltron_daily_limit';

const CONFIG_KEY = 'voltron_daily_config';

const DEFAULT_LIMIT = parseInt(import.meta.env.VITE_DEFAULT_DAILY_LIMIT || '10', 10);



interface DailyConfig {

  limit: number;

  lastUpdated: number;

}



interface DailyState {

  count: number;

  windowStart: number; // timestamp when 24h window started

}



export function getDailyLimit(): number {

  const raw = localStorage.getItem(CONFIG_KEY);

  if (!raw) return DEFAULT_LIMIT;

  try {

    const config: DailyConfig = JSON.parse(raw);

    return config.limit;

  } catch {

    return DEFAULT_LIMIT;

  }

}



export function setDailyLimit(newLimit: number): void {

  if (newLimit < 1 || newLimit > 1000) return;

  const config: DailyConfig = { limit: newLimit, lastUpdated: Date.now() };

  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));

}



export function getDailyState(): DailyState {

  const raw = localStorage.getItem(LIMIT_KEY);

  const now = Date.now();

  if (!raw) {

    return { count: 0, windowStart: now };

  }

  try {

    const state: DailyState = JSON.parse(raw);

    const hoursSince = (now - state.windowStart) / (1000 * 60 * 60);

    if (hoursSince >= 24) {

      // Reset window

      const fresh: DailyState = { count: 0, windowStart: now };

      localStorage.setItem(LIMIT_KEY, JSON.stringify(fresh));

      return fresh;

    }

    return state;

  } catch {

    return { count: 0, windowStart: now };

  }

}



export function incrementDailyCount(): void {

  const state = getDailyState();

  state.count += 1;

  localStorage.setItem(LIMIT_KEY, JSON.stringify(state));

}



export function canCreateAccount(): {

  allowed: boolean;

  remaining: number;

  resetIn: string;

  count: number;

  limit: number;

} {

  const state = getDailyState();

  const limit = getDailyLimit();

  const remaining = Math.max(0, limit - state.count);



  const windowEnd = state.windowStart + 24 * 60 * 60 * 1000;

  const msLeft = Math.max(0, windowEnd - Date.now());

  const hours = Math.floor(msLeft / (1000 * 60 * 60));

  const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));

  const resetIn = `${hours}h ${minutes}m`;



  return {

    allowed: remaining > 0,

    remaining,

    resetIn,

    count: state.count,

    limit,

  };

}



export function resetDailyState(): void {

  localStorage.removeItem(LIMIT_KEY);

}

```



═══════════════════════════════════════════════════════════

🎨 PAGE: Home (/)

═══════════════════════════════════════════════════════════



Same as before:



· Hero: "🌍 Voltron VPN"

· Subtitle: "Get your free VPN account in seconds"

· CTA button: "🚀 Create Free Account" → /create

· 4 feature cards

· Footer with Telegram/WhatsApp

· Dark theme, purple/red gradients



ADD: Small link at footer: "Admin Login" → /admin/login



═══════════════════════════════════════════════════════════

🎨 PAGE: Create Account (/create)

═══════════════════════════════════════════════════════════



BEFORE the form, check daily limit:



1. On page load, call canCreateAccount()

2. If allowed === false, show BLOCKING message:

   ```

   🚫 Daily Limit Reached

   

   We've reached our daily limit of {limit} accounts.

   Please come back in {resetIn}.

   

   [Progress bar showing 100%]

   ```

   Do NOT show the form. Disable submit.

3. If allowed === true, show:

   ```

   📊 Today's Availability: {remaining} / {limit} remaining

   [Progress bar]

   ```



Form fields (same as before):



· Username (real-time check via checkUsername)

· Password

· Duration cards (1, 3, 7 days)

· "Create Account" button



On successful account creation:



· Call incrementDailyCount() (localStorage)

· Navigate to /account



On error "Username taken":



· Show red message: "❌ Username already used. Please try another one."



═══════════════════════════════════════════════════════════

🎨 PAGE: Account Details (/account)

═══════════════════════════════════════════════════════════



Same as before — show account + protocols + copy/download buttons.



Also show:



```

📊 Today's Remaining: {remaining} / {limit}

```



═══════════════════════════════════════════════════════════

🎨 PAGE: Check Status (/check)

═══════════════════════════════════════════════════════════



Same as before.



═══════════════════════════════════════════════════════════

🎨 PAGE: Admin Login (/admin/login)

═══════════════════════════════════════════════════════════



Clean login form:



· Heading: "🔐 Admin Login"

· Username input

· Password input (type="password")

· "Login" button

· Error message if credentials wrong



On successful login:



· Call adminLogin(username, password)

· If true → navigate to /admin/dashboard

· If false → show "❌ Invalid credentials"



═══════════════════════════════════════════════════════════

🎨 PAGE: Admin Dashboard (/admin/dashboard) — MAIN FEATURE

═══════════════════════════════════════════════════════════



Protected route: redirect to /admin/login if not admin.



Layout:



· Navbar shows: "🔐 Admin Panel — Logged in as Admin" + "Logout" button

· 4 stat cards at top:

  · 👥 Total Users

  · 🟢 Online Now

  · 📅 Created Today (from daily count)

  · ⚙️ Active Protocols



SECTIONS:



Section 1: ⚙️ Daily Account Limit Settings



Card with:



· Label: "Maximum accounts per day"

· Number input (min 1, max 1000)

· Current value loaded from getDailyLimit()

· "💾 Save Limit" button

· "🔄 Reset Today's Count" button (danger)

· Show current status:

  ```

  Today: {count} / {limit} created

  Remaining: {remaining}

  Window resets in: {resetIn}

  ```



On save:



· Call setDailyLimit(newValue)

· Show toast: "✅ Daily limit updated to {newValue}"

· Immediately reflected on /create page



Section 2: 👥 All Users Table



Fetch users via getAllUsers() on mount and every 30 seconds.



Table columns:



· Username

· Password (masked with • • • • • • , click to reveal)

· Expiry Date

· Days Left (computed)

· Limit (999)

· Status (🟢 Active / 🔒 Locked / 🗓️ Expired)

· Online (number)

· Bandwidth Used (GB)

· Actions: [🔒 Lock] [🔓 Unlock] [🗑️ Delete]



Features:



· Search bar (filter by username)

· Sort by: Username, Expiry, Status

· Pagination (10 per page)

· Refresh button

· "🔄 Auto-refresh: ON" toggle (every 30s)

· Export to CSV button



On Delete click:



· Confirm dialog: "Delete {username}? This cannot be undone."

· Call deleteUser(username)

· Refresh list



On Lock/Unlock:



· Call lockUser / unlockUser

· Refresh list



Section 3: 📊 Recent Activity (optional)



Show last 10 accounts created (sorted by expiry desc — as proxy for creation order).



Section 4: 🚨 Server Status



Show from getDashboardInfo():



· CPU cores, RAM usage, Disk usage

· Uptime, Load

· Services status (SSH, DNSTT, etc.)



═══════════════════════════════════════════════════════════

🎨 DESIGN SYSTEM

═══════════════════════════════════════════════════════════



Same as before + admin theme:



· Admin panel: slightly different accent (blue #4D96FF)

· Tables: hover row highlight

· Stat cards: big numbers, small labels

· Progress bars: gradient purple → red

· Buttons: rounded-lg, hover:scale-105, transitions



Notifications (react-hot-toast):



· Success: green checkmark

· Error: red X

· Info: blue



═══════════════════════════════════════════════════════════

🔧 TECHNICAL REQUIREMENTS

═══════════════════════════════════════════════════════════



Stack:



· Vite + React + TypeScript

· React Router v6

· Tailwind CSS

· Framer Motion

· React Hot Toast



Routes:



· /                  → Home

· /create            → Create account

· /account           → Account details

· /check             → Check status

· /admin/login       → Admin login

· /admin/dashboard   → Admin dashboard (protected)



ProtectedRoute component:



```tsx

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {

  if (!isAdminLoggedIn()) {

    return <Navigate to="/admin/login" replace />;

  }

  return <>{children}</>;

}

```



Error handling:



· Every fetch: try/catch

· Show user-friendly messages

· Console.log technical errors



Validation:



· Username: /^[a-z0-9_-]{3,20}$/i

· Password: min 4 chars

· Daily limit: 1-1000



═══════════════════════════════════════════════════════════

📋 API REFERENCE (use these exact endpoints)

═══════════════════════════════════════════════════════════



POST /api/trial/check



Body: { "username": "john" }

Response OK: { "available": true }

Response Taken: { "available": false, "error": "Username taken" }



POST /api/trial/create



Body: { "username": "john", "password": "pass", "days": 1 }

Response:



```json

{

  "success": true,

  "account": {

    "username": "john",

    "password": "pass",

    "expiry": "2026-09-27",

    "limit": 999,

    "bandwidth": "Unlimited",

    "server": "vpn.voltrontechtx.shop",

    "server_ip": "187.33.148.147"

  },

  "protocols": {

    "ssh": {

      "id": "ssh", "name": "SSH Direct", "icon": "🔐", "color": "#6BCB77",

      "host": "vpn.voltrontechtx.shop", "ip": "187.33.148.147",

      "port": 22, "username": "john", "password": "pass", "limit": 999

    },

    "dnstt": {

      "id": "dnstt", "name": "DNSTT", "icon": "📡", "color": "#9B59B6",

      "domain": "test.voltrontechtx.shop", "pubkey": "...", "mtu": 512,

      "dns": "8.8.8.8", "dns_alt": "1.1.1.1"

    }

  }

}

```



GET /api/trial/status/:username



Response:



```json

{

  "success": true,

  "account": {

    "username": "john", "status": "active",

    "expiry": "2026-09-27", "days_left": 1,

    "online": 0, "limit": 999, "bandwidth": "0"

  }

}

```



GET /api/users/list



Response:



```json

{

  "success": true,

  "total": 5,

  "users": [

    {

      "username": "john",

      "expiry": "2026-09-27",

      "limit": 999,

      "bandwidth_limit": 0,

      "bandwidth_used_gb": 0.5,

      "status": "active",

      "online": 1

    }

  ]

}

```



NOTE: password is NOT returned by /users/list for security.

For admin display, keep passwords from localStorage history 

of accounts created in this browser. Show "••••••" for others.



POST /api/users/delete



Body: { "username": "john" }

Response: { "success": true, "message": "User john deleted" }



POST /api/users/lock



Body: { "username": "john" }

Response: { "success": true }



POST /api/users/unlock



Body: { "username": "john" }

Response: { "success": true }



GET /api/dashboard/info



Response: { "success": true, "info": { ip, uptime, cpu, ram, disk, load, users, services } }



═══════════════════════════════════════════════════════════

✅ FINAL CHECKLIST

═══════════════════════════════════════════════════════════



After building:



☐ .env exists with all 5 variables

☐ src/lib/api.ts, admin.ts, dailyLimit.ts exist

☐ Home page loads

☐ Create page checks daily limit and blocks when reached

☐ Create page validates username in real-time

☐ "Username already used" error shows clearly

☐ Account page shows protocols dynamically

☐ Admin login works with Admin / @Voltron0120

☐ Admin dashboard shows stat cards

☐ Admin can change daily limit

☐ Admin sees all users list with expiry

☐ Admin can delete/lock/unlock users

☐ Session persists 24h (localStorage)

☐ Logout works

☐ Mobile responsive

☐ No console errors



═══════════════════════════════════════════════════════════

🎯 BUILD IT NOW!

═══════════════════════════════════════════════════════════



Focus on:



1. Real API integration (no mocks)

2. Daily limit tracking works properly

3. Admin panel fully functional

4. Beautiful modern UI

5. Error-free build



Now generate the complete project.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://voltron-tunnel.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/544162d7-160d-4195-a04d-3155179ead62).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
