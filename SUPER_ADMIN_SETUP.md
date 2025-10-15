# Super Admin Setup Instructions

## Creating the Super Admin Account

To create the super admin account with email `ceo@weblerzdemo.com` and password `shineE065`, follow these steps:

### Step 1: Sign Up the User

1. Go to the authentication page: `/auth`
2. Sign up with the following credentials:
   - **Email:** `ceo@weblerzdemo.com`
   - **Password:** `shineE065`
   - **Full Name:** `CEO Admin` (or any name you prefer)

### Step 2: Assign Admin Role

After the user is created, you need to assign the admin role to this user. Run the following SQL query in your Supabase SQL Editor:

```sql
-- First, find the user_id for the super admin
-- You can find this by looking in the auth.users table or profiles table

-- Replace 'USER_ID_HERE' with the actual user_id from auth.users
INSERT INTO user_roles (user_id, role) 
VALUES ('USER_ID_HERE', 'admin'::app_role);
```

#### How to find the USER_ID:

**Option 1: Via Supabase Dashboard**
1. Open your Lovable Cloud backend
2. Go to Table Editor
3. Select the `profiles` table
4. Find the row with email `ceo@weblerzdemo.com`
5. Copy the `id` value

**Option 2: Via SQL Query**
```sql
-- Find the user_id by email
SELECT id FROM profiles WHERE email = 'ceo@weblerzdemo.com';
```

Once you have the user_id, run:
```sql
-- Insert the admin role
INSERT INTO user_roles (user_id, role) 
VALUES ('PASTE_USER_ID_HERE', 'admin'::app_role);
```

### Step 3: Verify Super Admin Access

1. Sign out if you're currently logged in
2. Sign in with: `ceo@weblerzdemo.com` / `shineE065`
3. You should now see:
   - "Super Admin" badge in the top header
   - Crown icon in the sidebar
   - Access to "Super Admin Dashboard" page at `/super-admin`
   - Access to "Manage Clinics" and "Manage Employees" pages

## Super Admin Features

The super admin can:

1. **View Super Admin Dashboard** (`/super-admin`)
   - See overview of all clinics, employees, vendors, and patients
   - View total revenue across all clinics
   - Filter and search patients across all clinics
   - Apply filters by clinic, patient type, status, and vendor

2. **Manage Clinics** (`/clinics`)
   - Create new clinics
   - Edit existing clinics
   - Delete clinics
   - View all clinic information

3. **Manage Employees (Sub Admins)** (`/employees`)
   - Create new employees and assign them to clinics
   - View all employees across all clinics
   - Remove employees

4. **View All Data**
   - Access all vendors across all clinics
   - Access all patients across all clinics
   - View comprehensive reports and analytics

## Important Notes

- The super admin DOES NOT upload reports - this is done by regular clinic admins
- The super admin's primary role is oversight and management
- Regular clinic employees will only see data for their assigned clinic
- Super admin sees ALL data across ALL clinics
