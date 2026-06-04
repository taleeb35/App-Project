import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useClinic } from "@/contexts/ClinicContext";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  parseISO,
  differenceInCalendarMonths,
} from "date-fns";
import {
  TrendingUp,
  Users,
  DollarSign,
  Percent,
  MapPin,
  ShoppingCart,
  Package,
  Download,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type PatientLite = {
  id: string;
  patient_type: string | null;
  status: string | null;
  location_roster: string | null;
};

type ReportLite = {
  patient_id: string;
  amount: number | null;
  grams_sold: number | null;
  report_month: string;
  product_name: string | null;
  vendor_id: string | null;
};

type Vendor = { id: string; name: string };

const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

export default function BusinessTrendingReport() {
  const { toast } = useToast();
  const { selectedClinic } = useClinic();

  const today = new Date();
  const [startMonth, setStartMonth] = useState<string>(format(subMonths(today, 5), "yyyy-MM"));
  const [endMonth, setEndMonth] = useState<string>(format(today, "yyyy-MM"));
  const [patientFilter, setPatientFilter] = useState<"all" | "Veteran" | "Civilian">("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  const [patients, setPatients] = useState<PatientLite[]>([]);
  const [reports, setReports] = useState<ReportLite[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);

  // Last 24 months for the dropdowns
  const monthOptions = Array.from({ length: 24 }, (_, i) => {
    const d = subMonths(today, i);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMM yyyy") };
  });

  const applyPreset = (months: number) => {
    setStartMonth(format(subMonths(today, months - 1), "yyyy-MM"));
    setEndMonth(format(today, "yyyy-MM"));
  };

  useEffect(() => {
    if (selectedClinic?.id) fetchData();
  }, [selectedClinic?.id, startMonth, endMonth]);

  const fetchData = async () => {
    if (!selectedClinic?.id) return;
    setLoading(true);
    try {
      const start = startOfMonth(parseISO(startMonth + "-01"));
      const end = endOfMonth(parseISO(endMonth + "-01"));

      const [{ data: pData, error: pErr }, { data: rData, error: rErr }, { data: vData }] = await Promise.all([
        supabase
          .from("patients")
          .select("id, patient_type, status, location_roster")
          .eq("clinic_id", selectedClinic.id),
        supabase
          .from("vendor_reports")
          .select("patient_id, amount, grams_sold, report_month, product_name, vendor_id")
          .eq("clinic_id", selectedClinic.id)
          .gte("report_month", format(start, "yyyy-MM-dd"))
          .lte("report_month", format(end, "yyyy-MM-dd")),
        supabase.from("vendors").select("id, name"),
      ]);

      if (pErr) throw pErr;
      if (rErr) throw rErr;

      setPatients((pData as any) || []);
      setReports((rData as any) || []);
      setVendors((vData as any) || []);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: "Failed to load report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const locations = useMemo(() => {
    const set = new Set<string>();
    patients.forEach((p) => p.location_roster && set.add(p.location_roster.trim()));
    return Array.from(set).sort();
  }, [patients]);

  // Apply filters
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (patientFilter !== "all" && p.patient_type !== patientFilter) return false;
      if (locationFilter !== "all" && (p.location_roster || "").trim() !== locationFilter) return false;
      return true;
    });
  }, [patients, patientFilter, locationFilter]);

  const patientMap = useMemo(() => {
    const m = new Map<string, PatientLite>();
    patients.forEach((p) => m.set(p.id, p));
    return m;
  }, [patients]);

  const filteredReports = useMemo(() => {
    const ids = new Set(filteredPatients.map((p) => p.id));
    return reports.filter((r) => ids.has(r.patient_id));
  }, [reports, filteredPatients]);

  // KPIs
  const kpis = useMemo(() => {
    const active = filteredPatients.filter((p) => p.status === "active");
    const veterans = active.filter((p) => p.patient_type === "Veteran");
    const civilians = active.filter((p) => p.patient_type === "Civilian");
    const veteranIds = new Set(veterans.map((v) => v.id));
    const civilianIds = new Set(civilians.map((c) => c.id));

    const vetReports = filteredReports.filter((r) => veteranIds.has(r.patient_id));
    const civReports = filteredReports.filter((r) => civilianIds.has(r.patient_id));

    const totalRevenue = filteredReports.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const totalGrams = filteredReports.reduce((s, r) => s + (Number(r.grams_sold) || 0), 0);
    const totalOrders = filteredReports.length;
    const uniqueOrderers = new Set(filteredReports.map((r) => r.patient_id)).size;

    return {
      totalActive: active.length,
      totalActiveVeterans: veterans.length,
      totalActiveCivilians: civilians.length,
      veteransWhoOrdered: new Set(vetReports.map((r) => r.patient_id)).size,
      civiliansWhoOrdered: new Set(civReports.map((r) => r.patient_id)).size,
      totalVeteranPurchases: vetReports.reduce((s, r) => s + (Number(r.amount) || 0), 0),
      totalCivilianPurchases: civReports.reduce((s, r) => s + (Number(r.amount) || 0), 0),
      totalRevenue,
      totalGrams,
      totalOrders,
      uniqueOrderers,
      aov: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      arpu: uniqueOrderers > 0 ? totalRevenue / uniqueOrderers : 0,
      orderRate: active.length > 0 ? (uniqueOrderers / active.length) * 100 : 0,
    };
  }, [filteredPatients, filteredReports]);

  // Monthly trend
  const monthlyTrend = useMemo(() => {
    const start = startOfMonth(parseISO(startMonth + "-01"));
    const end = startOfMonth(parseISO(endMonth + "-01"));
    if (differenceInCalendarMonths(end, start) < 0) return [];
    const months = eachMonthOfInterval({ start, end });
    return months.map((m) => {
      const key = format(m, "yyyy-MM");
      const monthReports = filteredReports.filter((r) => r.report_month.startsWith(key));
      const vetIds = new Set(filteredPatients.filter((p) => p.patient_type === "Veteran").map((p) => p.id));
      return {
        month: format(m, "MMM yy"),
        revenue: monthReports.reduce((s, r) => s + (Number(r.amount) || 0), 0),
        grams: monthReports.reduce((s, r) => s + (Number(r.grams_sold) || 0), 0),
        orders: monthReports.length,
        veteranRevenue: monthReports
          .filter((r) => vetIds.has(r.patient_id))
          .reduce((s, r) => s + (Number(r.amount) || 0), 0),
        civilianRevenue: monthReports
          .filter((r) => !vetIds.has(r.patient_id))
          .reduce((s, r) => s + (Number(r.amount) || 0), 0),
      };
    });
  }, [filteredReports, filteredPatients, startMonth, endMonth]);

  // Location performance
  const locationPerformance = useMemo(() => {
    const map = new Map<
      string,
      { location: string; patients: number; activePatients: number; ordered: number; revenue: number; grams: number; orders: number }
    >();
    filteredPatients.forEach((p) => {
      const loc = (p.location_roster || "Unassigned").trim() || "Unassigned";
      if (!map.has(loc)) {
        map.set(loc, { location: loc, patients: 0, activePatients: 0, ordered: 0, revenue: 0, grams: 0, orders: 0 });
      }
      const row = map.get(loc)!;
      row.patients += 1;
      if (p.status === "active") row.activePatients += 1;
    });
    const orderedByLoc = new Map<string, Set<string>>();
    filteredReports.forEach((r) => {
      const p = patientMap.get(r.patient_id);
      const loc = ((p?.location_roster || "Unassigned").trim() || "Unassigned");
      if (!map.has(loc)) {
        map.set(loc, { location: loc, patients: 0, activePatients: 0, ordered: 0, revenue: 0, grams: 0, orders: 0 });
      }
      const row = map.get(loc)!;
      row.revenue += Number(r.amount) || 0;
      row.grams += Number(r.grams_sold) || 0;
      row.orders += 1;
      if (!orderedByLoc.has(loc)) orderedByLoc.set(loc, new Set());
      orderedByLoc.get(loc)!.add(r.patient_id);
    });
    orderedByLoc.forEach((set, loc) => {
      const row = map.get(loc);
      if (row) row.ordered = set.size;
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue || b.patients - a.patients);
  }, [filteredPatients, filteredReports, patientMap]);

  // Top vendors
  const topVendors = useMemo(() => {
    const vMap = new Map(vendors.map((v) => [v.id, v.name]));
    const map = new Map<string, { name: string; revenue: number; orders: number; grams: number }>();
    filteredReports.forEach((r) => {
      const key = r.vendor_id || "unknown";
      const name = vMap.get(key) || "Unknown";
      if (!map.has(key)) map.set(key, { name, revenue: 0, orders: 0, grams: 0 });
      const row = map.get(key)!;
      row.revenue += Number(r.amount) || 0;
      row.grams += Number(r.grams_sold) || 0;
      row.orders += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [filteredReports, vendors]);

  // Top products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; orders: number; grams: number }>();
    filteredReports.forEach((r) => {
      const name = r.product_name || "Unspecified";
      if (!map.has(name)) map.set(name, { name, revenue: 0, orders: 0, grams: 0 });
      const row = map.get(name)!;
      row.revenue += Number(r.amount) || 0;
      row.grams += Number(r.grams_sold) || 0;
      row.orders += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [filteredReports]);

  // Patient type split
  const patientTypeSplit = useMemo(
    () => [
      { name: "Veterans", value: kpis.totalVeteranPurchases },
      { name: "Civilians", value: kpis.totalCivilianPurchases },
    ],
    [kpis],
  );

  const exportCSV = () => {
    const lines: string[] = [];
    lines.push("Business Trending Report");
    lines.push(`Clinic,${selectedClinic?.name || ""}`);
    lines.push(`Period,${startMonth} to ${endMonth}`);
    lines.push("");
    lines.push("Summary");
    lines.push("Metric,Value");
    lines.push(`Total Revenue,${kpis.totalRevenue.toFixed(2)}`);
    lines.push(`Total Grams,${kpis.totalGrams.toFixed(2)}`);
    lines.push(`Total Orders,${kpis.totalOrders}`);
    lines.push(`Unique Orderers,${kpis.uniqueOrderers}`);
    lines.push(`Order Rate %,${kpis.orderRate.toFixed(2)}`);
    lines.push(`AOV,${kpis.aov.toFixed(2)}`);
    lines.push(`ARPU,${kpis.arpu.toFixed(2)}`);
    lines.push("");
    lines.push("Location Performance");
    lines.push("Location,Patients,Active,Ordered,Orders,Revenue,Grams");
    locationPerformance.forEach((r) =>
      lines.push(
        `"${r.location}",${r.patients},${r.activePatients},${r.ordered},${r.orders},${r.revenue.toFixed(2)},${r.grams.toFixed(2)}`,
      ),
    );
    lines.push("");
    lines.push("Monthly Trend");
    lines.push("Month,Revenue,Grams,Orders,Veteran $,Civilian $");
    monthlyTrend.forEach((m) =>
      lines.push(`${m.month},${m.revenue.toFixed(2)},${m.grams.toFixed(2)},${m.orders},${m.veteranRevenue.toFixed(2)},${m.civilianRevenue.toFixed(2)}`),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `business-trending-${startMonth}-to-${endMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    format: f = "number",
    sub,
  }: {
    title: string;
    value: number;
    icon: any;
    format?: "number" | "currency" | "percent" | "grams";
    sub?: string;
  }) => {
    const formatted =
      f === "currency"
        ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : f === "percent"
        ? `${value.toFixed(1)}%`
        : f === "grams"
        ? `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}g`
        : value.toLocaleString();
    return (
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold">{formatted}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="p-2.5 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Business Trending Report</h1>
          <p className="text-muted-foreground mt-1">
            {selectedClinic?.name ? `${selectedClinic.name} · ` : ""}
            {format(parseISO(startMonth + "-01"), "MMM yyyy")} – {format(parseISO(endMonth + "-01"), "MMM yyyy")}
          </p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={loading || filteredReports.length === 0}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" /> Start month
            </label>
            <Select value={startMonth} onValueChange={setStartMonth}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" /> End month
            </label>
            <Select value={endMonth} onValueChange={setEndMonth}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Patient type</label>
            <Select value={patientFilter} onValueChange={(v: any) => setPatientFilter(v)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Veteran">Veterans</SelectItem>
                <SelectItem value="Civilian">Civilians</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Location / Roster</label>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={() => applyPreset(3)}>Last 3M</Button>
            <Button size="sm" variant="outline" onClick={() => applyPreset(6)}>Last 6M</Button>
            <Button size="sm" variant="outline" onClick={() => applyPreset(12)}>Last 12M</Button>
            <Button size="sm" variant="outline" onClick={() => applyPreset(24)}>Last 24M</Button>
          </div>
        </div>
      </Card>

      {!selectedClinic ? (
        <Card className="p-12 text-center text-muted-foreground">Select a clinic to view this report.</Card>
      ) : loading ? (
        <Card className="p-12 text-center text-muted-foreground">Loading…</Card>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Revenue" value={kpis.totalRevenue} icon={DollarSign} format="currency" />
            <StatCard title="Total Grams Sold" value={kpis.totalGrams} icon={Package} format="grams" />
            <StatCard title="Total Orders" value={kpis.totalOrders} icon={ShoppingCart} />
            <StatCard title="Avg Order Value" value={kpis.aov} icon={TrendingUp} format="currency" />
            <StatCard
              title="Active Patients"
              value={kpis.totalActive}
              icon={Users}
              sub={`${kpis.totalActiveVeterans} vet · ${kpis.totalActiveCivilians} civ`}
            />
            <StatCard
              title="Patients Who Ordered"
              value={kpis.uniqueOrderers}
              icon={Users}
              sub={`${kpis.veteransWhoOrdered} vet · ${kpis.civiliansWhoOrdered} civ`}
            />
            <StatCard title="Order Rate" value={kpis.orderRate} icon={Percent} format="percent" />
            <StatCard title="Revenue per Buyer" value={kpis.arpu} icon={TrendingUp} format="currency" />
          </div>

          <Tabs defaultValue="trend">
            <TabsList>
              <TabsTrigger value="trend">Trend</TabsTrigger>
              <TabsTrigger value="location">Location / Roster</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="mix">Patient Mix</TabsTrigger>
            </TabsList>

            <TabsContent value="trend" className="space-y-4">
              <Card className="p-5">
                <h3 className="font-semibold mb-4">Monthly Revenue Trend</h3>
                <div className="h-80">
                  <ResponsiveContainer>
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" name="Total $" stroke={COLORS[0]} strokeWidth={2} />
                      <Line type="monotone" dataKey="veteranRevenue" name="Veteran $" stroke={COLORS[1]} strokeWidth={2} />
                      <Line type="monotone" dataKey="civilianRevenue" name="Civilian $" stroke={COLORS[2]} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card className="p-5">
                <h3 className="font-semibold mb-4">Monthly Orders & Grams</h3>
                <div className="h-72">
                  <ResponsiveContainer>
                    <BarChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="orders" name="Orders" fill={COLORS[0]} />
                      <Bar yAxisId="right" dataKey="grams" name="Grams" fill={COLORS[3]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Locations" value={locationPerformance.length} icon={MapPin} />
                <StatCard
                  title="Top Location"
                  value={locationPerformance[0]?.patients || 0}
                  icon={MapPin}
                  sub={locationPerformance[0]?.location || "—"}
                />
                <StatCard
                  title="Top by Revenue"
                  value={locationPerformance[0]?.revenue || 0}
                  icon={DollarSign}
                  format="currency"
                  sub={locationPerformance[0]?.location || "—"}
                />
              </div>
              <Card className="p-5">
                <h3 className="font-semibold mb-4">Patients by Location</h3>
                <div className="h-72">
                  <ResponsiveContainer>
                    <BarChart data={locationPerformance.slice(0, 12)}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="location" angle={-20} textAnchor="end" height={60} interval={0} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="patients" name="Patients" fill={COLORS[0]} />
                      <Bar dataKey="ordered" name="Ordered" fill={COLORS[1]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location / Roster</TableHead>
                      <TableHead className="text-right">Patients</TableHead>
                      <TableHead className="text-right">Active</TableHead>
                      <TableHead className="text-right">Ordered</TableHead>
                      <TableHead className="text-right">Order Rate</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Grams</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locationPerformance.map((r) => (
                      <TableRow key={r.location}>
                        <TableCell className="font-medium">{r.location}</TableCell>
                        <TableCell className="text-right">{r.patients}</TableCell>
                        <TableCell className="text-right">{r.activePatients}</TableCell>
                        <TableCell className="text-right">{r.ordered}</TableCell>
                        <TableCell className="text-right">
                          {r.activePatients > 0 ? ((r.ordered / r.activePatients) * 100).toFixed(1) + "%" : "—"}
                        </TableCell>
                        <TableCell className="text-right">{r.orders}</TableCell>
                        <TableCell className="text-right">{r.grams.toFixed(1)}</TableCell>
                        <TableCell className="text-right">${r.revenue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {locationPerformance.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                          No location data
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="vendors">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Grams</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topVendors.map((v) => (
                      <TableRow key={v.name}>
                        <TableCell className="font-medium">{v.name}</TableCell>
                        <TableCell className="text-right">{v.orders}</TableCell>
                        <TableCell className="text-right">{v.grams.toFixed(1)}</TableCell>
                        <TableCell className="text-right">${v.revenue.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">
                            {kpis.totalRevenue > 0 ? ((v.revenue / kpis.totalRevenue) * 100).toFixed(1) : "0.0"}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {topVendors.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No vendor data</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="products">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Grams</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((p) => (
                      <TableRow key={p.name}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-right">{p.orders}</TableCell>
                        <TableCell className="text-right">{p.grams.toFixed(1)}</TableCell>
                        <TableCell className="text-right">${p.revenue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {topProducts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6">No product data</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="mix">
              <Card className="p-5">
                <h3 className="font-semibold mb-4">Revenue by Patient Type</h3>
                <div className="h-80">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={patientTypeSplit} dataKey="value" nameKey="name" outerRadius={120} label>
                        {patientTypeSplit.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
