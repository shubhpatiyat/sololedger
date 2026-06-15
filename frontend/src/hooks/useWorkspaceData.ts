import { useCallback, useEffect, useMemo, useState } from "react";
import { apiService } from "@/services/apiService";
import {
  demoBills,
  demoCategories,
  demoClients,
  demoInvoices,
  demoProjects,
} from "@/data/demoContent";
import {
  WorkspaceBill,
  WorkspaceCategory,
  WorkspaceClient,
  WorkspaceInvoice,
  WorkspaceProject,
} from "@/types";

const isErrorResponse = (status?: number) => !status || status >= 400;

export const useWorkspaceData = () => {
  const [clients, setClients] = useState<WorkspaceClient[]>([]);
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [categories, setCategories] = useState<WorkspaceCategory[]>([]);
  const [invoices, setInvoices] = useState<WorkspaceInvoice[]>([]);
  const [bills, setBills] = useState<WorkspaceBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        clientsResponse,
        projectsResponse,
        categoriesResponse,
        invoicesResponse,
        billsResponse,
      ] =
        await Promise.all([
          apiService.listClients(),
          apiService.listProjects(),
          apiService.listCategories(),
          apiService.listInvoices(),
          apiService.listBills(),
        ]);

      const failed =
        isErrorResponse(clientsResponse.status) ||
        isErrorResponse(projectsResponse.status) ||
        isErrorResponse(categoriesResponse.status) ||
        isErrorResponse(invoicesResponse.status) ||
        isErrorResponse(billsResponse.status);

      if (failed) {
        setClients(demoClients);
        setProjects(demoProjects);
        setCategories(demoCategories);
        setInvoices(demoInvoices);
        setBills(demoBills);
        setError("Backend unavailable. Showing fallback workspace data.");
        return;
      }

      setClients(clientsResponse.data || []);
      setProjects(projectsResponse.data || []);
      setCategories(categoriesResponse.data || []);
      setInvoices(invoicesResponse.data || []);
      setBills(billsResponse.data || []);
    } catch (fetchError) {
      console.error("Failed to load workspace data:", fetchError);
      setClients(demoClients);
      setProjects(demoProjects);
      setCategories(demoCategories);
      setInvoices(demoInvoices);
      setBills(demoBills);
      setError("Backend unavailable. Showing fallback workspace data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  const addClient = useCallback(
    async (client: Omit<WorkspaceClient, "id">) => {
      const response = await apiService.createClient({
        name: client.name,
        email: client.email || null,
        phone: client.phone || null,
        address_line_1: client.address_line_1 || null,
        address_line_2: client.address_line_2 || null,
        city: client.city || null,
        state: client.state || null,
        postal_code: client.postal_code || null,
        country: client.country || null,
        notes: client.notes || null,
        status: client.status || "active",
      });

      if (isErrorResponse(response.status)) {
        throw new Error("Failed to create client");
      }

      if (response.data) {
        setClients((prev) => [response.data, ...prev]);
      }
      return response.data;
    },
    []
  );

  const addProject = useCallback(
    async (project: Omit<WorkspaceProject, "id">) => {
      const response = await apiService.createProject({
        client_id: project.client_id,
        name: project.name,
        description: project.description || null,
        status: project.status || "active",
        budget_amount: project.budget_amount ?? null,
      });

      if (isErrorResponse(response.status)) {
        throw new Error("Failed to create project");
      }

      if (response.data) {
        setProjects((prev) => [response.data, ...prev]);
      }
      return response.data;
    },
    []
  );

  const addCategory = useCallback(
    async (category: Omit<WorkspaceCategory, "id">) => {
      const response = await apiService.createCategory({
        name: category.name,
        description: category.description || null,
      });

      if (isErrorResponse(response.status)) {
        throw new Error("Failed to create category");
      }

      if (response.data) {
        setCategories((prev) => [response.data, ...prev]);
      }
      return response.data;
    },
    []
  );

  const addInvoice = useCallback(
    async (invoice: Omit<WorkspaceInvoice, "id">) => {
      const response = await apiService.createInvoice({
        client_id: invoice.client_id,
        invoice_number: invoice.invoice_number,
        title: invoice.title,
        total_amount: invoice.total_amount,
        due_date: invoice.due_date || null,
        status: invoice.status || "draft",
        notes: invoice.notes || null,
      });

      if (isErrorResponse(response.status)) {
        throw new Error("Failed to create invoice");
      }

      if (response.data) {
        setInvoices((prev) => [response.data, ...prev]);
      }
      return response.data;
    },
    []
  );

  const addBill = useCallback(
    async (bill: Omit<WorkspaceBill, "id">) => {
      const response = await apiService.createBill({
        client_id: bill.client_id,
        project_id: bill.project_id || null,
        category_id: bill.category_id,
        invoice_id: bill.invoice_id || null,
        title: bill.title,
        amount: bill.amount,
        bill_date: bill.bill_date || null,
        vendor_name: bill.vendor_name || null,
        file_path: bill.file_path || null,
        status: bill.status || "captured",
        notes: bill.notes || null,
      });

      if (isErrorResponse(response.status)) {
        throw new Error("Failed to create bill");
      }

      if (response.data) {
        setBills((prev) => [response.data, ...prev]);
      }
      return response.data;
    },
    []
  );

  const summary = useMemo(
    () => ({
      totalClients: clients.length,
      totalProjects: projects.length,
      totalCategories: categories.length,
      totalInvoices: invoices.length,
      totalBills: bills.length,
    }),
    [bills.length, categories.length, clients.length, invoices.length, projects.length]
  );

  return {
    clients,
    projects,
    categories,
    invoices,
    bills,
    isLoading,
    error,
    addClient,
    addProject,
    addCategory,
    addInvoice,
    addBill,
    refetch: fetchWorkspaceData,
    summary,
  };
};
