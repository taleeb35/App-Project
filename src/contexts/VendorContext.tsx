import { createContext, useContext, useState, ReactNode } from 'react';

interface Vendor {
  id: string;
  name: string;
}

interface VendorContextType {
  selectedVendor: Vendor | null;
  setSelectedVendor: (vendor: Vendor | null) => void;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export function VendorProvider({ children }: { children: ReactNode }) {
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  return (
    <VendorContext.Provider value={{ selectedVendor, setSelectedVendor }}>
      {children}
    </VendorContext.Provider>
  );
}

export function useVendor() {
  const context = useContext(VendorContext);
  if (context === undefined) {
    throw new Error('useVendor must be used within a VendorProvider');
  }
  return context;
}
