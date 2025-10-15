import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CircleUser, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ClinicSelector from '../ClinicSelector';
import { useClinic } from '@/contexts/ClinicContext';

export default function TopHeader() {
  const { user, signOut, isAdmin } = useAuth();
  const { selectedClinic } = useClinic();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      {/* Mobile Navigation is handled in AppSidebar */}
      <div className="w-full flex-1">
        {isAdmin ? (
          <ClinicSelector />
        ) : (
          <div className="font-medium text-lg">
            {selectedClinic ? selectedClinic.name : 'Your Clinic'}
          </div>
        )}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <CircleUser className="h-5 w-5" />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {user ? `${user.first_name || 'My'} ${user.last_name || 'Account'}` : 'My Account'}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-red-500">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}