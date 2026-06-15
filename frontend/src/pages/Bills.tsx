import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWorkspaceData } from "@/hooks/useWorkspaceData";

const formatCurrency = (amount?: number | null) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const statusOptions = ["all", "captured", "reimbursable", "approved", "pending"];

const Bills: React.FC = () => {
  const { clients, projects, categories, invoices, bills, isLoading, error } =
    useWorkspaceData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.id, client.name])),
    [clients]
  );
  const projectNameById = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects]
  );
  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories]
  );
  const invoiceNumberById = useMemo(
    () => new Map(invoices.map((invoice) => [invoice.id, invoice.invoice_number])),
    [invoices]
  );

  const filteredBills = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bills.filter((bill) => {
      const clientName = clientNameById.get(bill.client_id) || "";
      const vendorName = bill.vendor_name || "";
      const matchesSearch =
        !query ||
        bill.title.toLowerCase().includes(query) ||
        vendorName.toLowerCase().includes(query) ||
        clientName.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || bill.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bills, clientNameById, search, statusFilter]);

  const filteredSpend = filteredBills.reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bills</h1>
            <p className="text-muted-foreground">
              Review payables and reimbursable spend in a simple ledger table.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/library">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workspace
            </Link>
          </Button>
        </div>

        {error ? (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="p-4 text-sm text-amber-700">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Bills</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{filteredBills.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Spend</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatCurrency(filteredSpend)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Reimbursable</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {
                  filteredBills.filter((bill) => bill.status.toLowerCase() === "reimbursable")
                    .length
                }
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search bill, vendor, or client"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={statusFilter === option ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(option)}
                    className="capitalize"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            {isLoading ? <div className="py-8 text-sm text-muted-foreground">Loading bills...</div> : null}

            {!isLoading && filteredBills.length === 0 ? (
              <div className="py-8 text-sm text-muted-foreground">
                No bills match the current search or filter.
              </div>
            ) : null}

            {!isLoading && filteredBills.length > 0 ? (
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{bill.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {bill.vendor_name || "Unknown vendor"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {clientNameById.get(bill.client_id) || "Unknown client"}
                        </TableCell>
                        <TableCell>
                          {bill.project_id
                            ? projectNameById.get(bill.project_id) || "Unknown project"
                            : "No project"}
                        </TableCell>
                        <TableCell>
                          {categoryNameById.get(bill.category_id) || "Uncategorized"}
                        </TableCell>
                        <TableCell>
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs capitalize text-muted-foreground">
                            {bill.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {bill.invoice_id
                            ? invoiceNumberById.get(bill.invoice_id) || "Linked"
                            : "Unlinked"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(bill.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Bills;
