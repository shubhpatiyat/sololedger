import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Brush, CalendarClock, Search } from "lucide-react";
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

const statusOptions = ["all", "draft", "sent", "overdue", "paid"];

const Invoices: React.FC = () => {
  const { clients, invoices, isLoading, error } = useWorkspaceData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.id, client.name])),
    [clients]
  );

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const clientName = clientNameById.get(invoice.client_id) || "";
      const matchesSearch =
        !query ||
        invoice.invoice_number.toLowerCase().includes(query) ||
        invoice.title.toLowerCase().includes(query) ||
        clientName.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || invoice.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clientNameById, invoices, search, statusFilter]);

  const outstandingAmount = filteredInvoices
    .filter((invoice) => !["paid", "cancelled"].includes(invoice.status.toLowerCase()))
    .reduce((sum, invoice) => sum + invoice.total_amount, 0);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
            <p className="text-muted-foreground">
              Search and track receivables in one clean ledger view.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link to="/invoices/template-designer">
                <Brush className="w-4 h-4 mr-2" />
                Design Invoice
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/library">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Workspace
              </Link>
            </Button>
          </div>
        </div>

        {error ? (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="p-4 text-sm text-amber-700">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Invoices</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{filteredInvoices.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatCurrency(outstandingAmount)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {filteredInvoices.filter((invoice) => invoice.status.toLowerCase() === "paid").length}
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
                  placeholder="Search invoice, client, or title"
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

            {isLoading ? (
              <div className="py-8 text-sm text-muted-foreground">Loading invoices...</div>
            ) : null}

            {!isLoading && filteredInvoices.length === 0 ? (
              <div className="py-8 text-sm text-muted-foreground">
                No invoices match the current search or filter.
              </div>
            ) : null}

            {!isLoading && filteredInvoices.length > 0 ? (
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{invoice.invoice_number}</p>
                            <p className="text-sm text-muted-foreground">{invoice.title}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {clientNameById.get(invoice.client_id) || "Unknown client"}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-2 text-muted-foreground">
                            <CalendarClock className="w-4 h-4" />
                            {invoice.due_date || "No due date"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs capitalize text-muted-foreground">
                            {invoice.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.total_amount)}
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

export default Invoices;
