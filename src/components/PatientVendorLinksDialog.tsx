import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Save, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Link = {
  id: string;
  vendor_id: string;
  client_id: string | null;
  vendor_name: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: { id: string; clinic_id: string; first_name: string; last_name: string; k_number: string } | null;
  onSaved?: () => void;
};

export default function PatientVendorLinksDialog({ open, onOpenChange, patient, onSaved }: Props) {
  const { toast } = useToast();
  const [links, setLinks] = useState<Link[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newVendorId, setNewVendorId] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!patient) return;
    setLoading(true);
    try {
      const [{ data: linkData, error: linkError }, { data: vendorData, error: vendorError }] = await Promise.all([
        supabase
          .from("patient_vendors")
          .select("id, vendor_id, client_id, vendors(name)")
          .eq("patient_id", patient.id),
        supabase
          .from("vendors")
          .select("id, name, clinic_id")
          .order("name"),
      ]);
      if (linkError) throw linkError;
      if (vendorError) throw vendorError;

      const mapped: Link[] = (linkData as any[] || []).map((l) => ({
        id: l.id,
        vendor_id: l.vendor_id,
        client_id: l.client_id ?? null,
        vendor_name: (l.vendors as any)?.name || "Unknown vendor",
      })).sort((a, b) => a.vendor_name.localeCompare(b.vendor_name));

      setLinks(mapped);
      setDrafts(Object.fromEntries(mapped.map((l) => [l.id, l.client_id || ""])));

      // Only vendors belonging to this patient's clinic (or global vendors without a clinic)
      const clinicVendors = (vendorData as any[] || []).filter(
        (v) => !v.clinic_id || v.clinic_id === patient.clinic_id
      );
      const unique = Array.from(new Map(clinicVendors.map((v) => [v.name.trim().toLowerCase(), v])).values());
      setVendors(unique.map((v) => ({ id: v.id, name: v.name })));
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load vendor links", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [patient, toast]);

  useEffect(() => {
    if (open && patient) {
      setNewVendorId("");
      setNewClientId("");
      load();
    }
  }, [open, patient, load]);

  const describeError = (error: any) => {
    if (error?.code === "23505") {
      if (String(error?.message || "").includes("patient_vendors_vendor_client_id_key")) {
        return "That Client ID is already used by another patient for this vendor.";
      }
      return "This patient is already linked to that vendor.";
    }
    return error?.message || "Something went wrong";
  };

  const saveClientId = async (link: Link) => {
    const value = (drafts[link.id] ?? "").trim();
    setSavingId(link.id);
    try {
      const { error } = await supabase
        .from("patient_vendors")
        .update({ client_id: value === "" ? null : value })
        .eq("id", link.id);
      if (error) throw error;
      toast({ title: "Saved", description: `Client ID updated for ${link.vendor_name}.` });
      await load();
      onSaved?.();
    } catch (error: any) {
      toast({ title: "Error", description: describeError(error), variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const removeLink = async (link: Link) => {
    if (!confirm(`Remove the link between this patient and ${link.vendor_name}? Existing sales records are not deleted.`)) return;
    setSavingId(link.id);
    try {
      const { error } = await supabase.from("patient_vendors").delete().eq("id", link.id);
      if (error) throw error;
      toast({ title: "Removed", description: `${link.vendor_name} unlinked from this patient.` });
      await load();
      onSaved?.();
    } catch (error: any) {
      toast({ title: "Error", description: describeError(error), variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const addLink = async () => {
    if (!patient) return;
    if (!newVendorId) {
      toast({ title: "Select a vendor", description: "Choose the vendor (LP) to link.", variant: "destructive" });
      return;
    }
    const clientId = newClientId.trim();
    setAdding(true);
    try {
      const { error } = await supabase.from("patient_vendors").insert({
        patient_id: patient.id,
        vendor_id: newVendorId,
        client_id: clientId === "" ? null : clientId,
      } as any);
      if (error) throw error;
      toast({ title: "Linked", description: "Vendor linked to patient." });
      setNewVendorId("");
      setNewClientId("");
      await load();
      onSaved?.();
    } catch (error: any) {
      toast({ title: "Error", description: describeError(error), variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const availableVendors = vendors.filter((v) => !links.some((l) => l.vendor_id === v.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Vendors &amp; Client IDs — {patient?.first_name} {patient?.last_name}
          </DialogTitle>
          <DialogDescription>
            K Number: {patient?.k_number || "N/A"} · Client ID is optional. Leave it blank for vendors that report by patient name only.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <Label className="mb-2 block">Linked vendors</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor (LP)</TableHead>
                    <TableHead>Client ID</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                        No vendors linked yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    links.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell className="font-medium">{link.vendor_name}</TableCell>
                        <TableCell>
                          <Input
                            value={drafts[link.id] ?? ""}
                            placeholder="Optional"
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [link.id]: e.target.value }))}
                            className="font-mono"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Save Client ID"
                              disabled={savingId === link.id || (drafts[link.id] ?? "").trim() === (link.client_id || "")}
                              onClick={() => saveClientId(link)}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              title="Remove vendor link"
                              disabled={savingId === link.id}
                              onClick={() => removeLink(link)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="border-t pt-4">
              <Label className="mb-2 block">Add a vendor link</Label>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                <div>
                  <Label htmlFor="new_vendor" className="text-xs text-muted-foreground">Vendor (LP)</Label>
                  <Select value={newVendorId} onValueChange={setNewVendorId}>
                    <SelectTrigger id="new_vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                    <SelectContent>
                      {availableVendors.length === 0 ? (
                        <SelectItem value="__none" disabled>No more vendors available</SelectItem>
                      ) : (
                        availableVendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new_client_id" className="text-xs text-muted-foreground">Client ID (optional)</Label>
                  <Input
                    id="new_client_id"
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                    placeholder="Leave blank if unknown"
                    className="font-mono"
                  />
                </div>
                <Button onClick={addLink} disabled={adding}>
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
