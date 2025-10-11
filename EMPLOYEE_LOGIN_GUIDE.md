# Employee Login & Access Guide

## For Administrators

### How to Add Employees

1. Navigate to **Clinic Employees** section in the admin panel
2. Click "Add Employee" button
3. Fill in the employee details:
   - Full Name
   - Email Address
   - Password (they can change this later)
   - Assign to Clinic
4. Click "Add Employee"

**What Happens Next:**
- An email confirmation link is sent to the employee's email address
- The employee account is created and linked to the specified clinic
- Employee will have access only to their assigned clinic's data

### Employee Login URL

Employees can log in at: **`https://your-domain.com/auth`**

Share this URL with new employees along with their login credentials.

---

## For Employees

### First Time Login

1. Check your email for the confirmation link (if email confirmation is enabled)
2. Click the confirmation link in your email
3. Go to the login page: **`https://your-domain.com/auth`**
4. Enter your email and password provided by your administrator
5. Click "Sign In"

### What You Can Access

As a clinic employee, you will have access to:

✅ **Your Clinic's Patients Only**
- View patient database for your assigned clinic
- Search patients within your clinic
- Upload patient data for your clinic

✅ **Your Clinic's Vendor Reports**
- View vendor reports related to your clinic
- Search and filter reports by month and vendor

✅ **Dashboard & Analytics**
- View metrics and statistics for your clinic only

❌ **What You Cannot Access**
- Other clinics' data
- System-wide administration functions
- Employee management
- Clinic management

### Security & Data Isolation

The system uses **Row-Level Security (RLS)** to ensure:
- You can only see data from your assigned clinic
- You cannot modify data from other clinics
- All database queries are automatically filtered by your clinic assignment

### Changing Your Password

1. Log in to your account
2. Navigate to Profile Settings
3. Update your password
4. Save changes

### Need Help?

Contact your system administrator if you:
- Forgot your password
- Need to change your assigned clinic
- Experience any access issues
- Need additional permissions

---

## Technical Details (For Developers)

### Authentication Flow
1. Employee accounts created via `supabase.auth.signUp()`
2. Profile automatically created with clinic_id assignment
3. `clinic_employees` table tracks clinic assignments
4. RLS policies enforce data isolation based on clinic_id

### Data Access Rules

**Patients Table:**
- Employees can view/manage patients where `clinic_id` matches their assigned clinic
- RLS Policy: `clinic_id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid())`

**Vendor Reports Table:**
- Employees can view reports where `clinic_id` matches their assigned clinic  
- RLS Policy: `clinic_id IN (SELECT clinic_employees.clinic_id FROM clinic_employees WHERE user_id = auth.uid())`

**Clinics Table:**
- All authenticated users can view clinics (SELECT only)
- Only admins can manage clinics

### Admin vs Employee Roles

The system uses a separate `user_roles` table with `app_role` enum:
- `admin`: Full system access
- `user`: Standard clinic employee access

Admin status is checked via: `has_role(auth.uid(), 'admin'::app_role)`
