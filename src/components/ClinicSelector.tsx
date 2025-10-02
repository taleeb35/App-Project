import { useClinic } from '@/contexts/ClinicContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';

export function ClinicSelector() {
  const { selectedClinic, setSelectedClinic, clinics, loading } = useClinic();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>Loading clinics...</span>
      </div>
    );
  }

  if (clinics.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>No clinics available</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedClinic?.id || ''}
        onValueChange={(value) => {
          const clinic = clinics.find(c => c.id === value);
          setSelectedClinic(clinic || null);
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select clinic" />
        </SelectTrigger>
        <SelectContent>
          {clinics.map((clinic) => (
            <SelectItem key={clinic.id} value={clinic.id}>
              {clinic.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
