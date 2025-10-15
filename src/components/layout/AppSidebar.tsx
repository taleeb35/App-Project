import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Home, Users, Building, FileText, Upload, Settings, Menu, Pill, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navLinks = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/patients', icon: Users, label: 'Patient Database' },
  { to: '/vendors', icon: Building, label: 'Vendors' },
  { to: '/upload-report', icon: Upload, label: 'Upload Vendor Report' },
  { to: '/view-reports', icon: FileText, label: 'Vendor Reports' },
  { to: '/clinics', icon: Building, label: 'Clinics', adminOnly: true },
  { to: '/employees', icon: UserPlus, label: 'Employees', adminOnly: true },
];

const NavContent = () => {
  const { isAdmin } = useAuth();
  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navLinks.map((link) => {
        if (link.adminOnly && !isAdmin) {
          return null; // Don't render admin links for non-admins
        }
        return (
          <NavLink
            key={link.label}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                isActive ? 'bg-muted text-primary' : 'text-muted-foreground'
              }`
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default function AppSidebar() {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <NavLink to="/" className="flex items-center gap-2 font-semibold">
              <Pill className="h-6 w-6 text-primary" />
              <span className="">Pharmacy PMS</span>
            </NavLink>
          </div>
          <div className="flex-1">
            <NavContent />
          </div>
        </div>
      </div>

      {/* Mobile Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <NavLink to="/" className="flex items-center gap-2 font-semibold">
              <Pill className="h-6 w-6 text-primary" />
              <span className="">Pharmacy PMS</span>
            </NavLink>
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}