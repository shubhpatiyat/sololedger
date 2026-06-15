import { useMemo } from "react";
import { useWorkspaceData } from "@/hooks/useWorkspaceData";
import { WorkspaceClient, WorkspaceBill, WorkspaceProject, WorkspaceCategory } from "@/types";
import { formatCurrency, normalizeStatus } from "@/utils/formatting";
import { createLookupMap, groupBy, sortByDate, sortByNumber, sumBy } from "@/utils/dataTransforms";
import {
  Building2,
  CreditCard,
  Receipt,
  Wallet,
  LucideIcon,
} from "lucide-react";

export interface HighlightMetric {
  id: string;
  label: string;
  value: string;
  meta: string;
  icon: LucideIcon;
}

export interface ClientWithMetrics extends WorkspaceClient {
  billAmount: number;
  projectCount: number;
}

export interface CategoryWithMetrics extends WorkspaceCategory {
  billCount: number;
  totalSpend: number;
}

export interface LibraryData {
  highlights: HighlightMetric[];
  topClients: ClientWithMetrics[];
  recentBills: WorkspaceBill[];
  projectsByClient: WorkspaceProject[];
  categoriesWithMetrics: CategoryWithMetrics[];
  categoryNameById: Map<string, string>;
  clientNameById: Map<string, string>;
  projectByClientId: Map<string, number>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Check if a bill is pending based on its status
 */
const isBillPending = (status?: string | null): boolean => {
  return ["captured", "submitted", "pending", "reimbursable"].includes(
    normalizeStatus(status)
  );
};

/**
 * Custom hook to process and compute library dashboard data
 */
export const useLibraryData = (): LibraryData => {
  const { clients, projects, categories, bills, isLoading, error } = useWorkspaceData();

  // Create lookup maps
  const categoryNameById = useMemo(
    () => createLookupMap(categories, "id", "name"),
    [categories]
  );

  const clientNameById = useMemo(
    () => createLookupMap(clients, "id", "name"),
    [clients]
  );

  const projectByClientId = useMemo(() => {
    const grouped = groupBy(projects, "client_id");
    return new Map(
      Array.from(grouped.entries()).map(([clientId, projects]) => [
        clientId,
        projects.length,
      ])
    );
  }, [projects]);

  // Calculate pending bills
  const pendingBills = useMemo(
    () => bills.filter((bill) => isBillPending(bill.status)),
    [bills]
  );

  // Calculate highlights/metrics
  const highlights = useMemo<HighlightMetric[]>(() => {
    const pendingAmount = sumBy(pendingBills, "amount");
    const totalAmount = sumBy(bills, "amount");

    return [
      {
        id: "bills",
        label: "Bills to Review",
        value: formatCurrency(pendingAmount),
        meta: `${pendingBills.length} pending`,
        icon: Receipt,
      },
      {
        id: "spend",
        label: "Total Bill Spend",
        value: formatCurrency(totalAmount),
        meta: `${bills.length} bills logged`,
        icon: CreditCard,
      },
      {
        id: "clients",
        label: "Active Clients",
        value: `${clients.length}`,
        meta: `${projects.length} active projects`,
        icon: Building2,
      },
      {
        id: "categories",
        label: "Categories",
        value: `${categories.length}`,
        meta: "Expense organization",
        icon: Wallet,
      },
    ];
  }, [bills, pendingBills, clients, projects, categories]);

  // Get recent bills (sorted by date)
  const recentBills = useMemo(
    () => sortByDate(bills, "created_at").slice(0, 5),
    [bills]
  );

  // Calculate top clients by bill amount
  const topClients = useMemo<ClientWithMetrics[]>(() => {
    const clientsWithMetrics = clients.map((client) => {
      const clientBills = bills.filter((bill) => bill.client_id === client.id);
      const billAmount = sumBy(clientBills, "amount");
      const projectCount = projectByClientId.get(client.id) || 0;

      return {
        ...client,
        billAmount,
        projectCount,
      };
    });

    return sortByNumber(clientsWithMetrics, "billAmount").slice(0, 4);
  }, [clients, bills, projectByClientId]);

  // Get projects sorted by client
  const projectsByClient = useMemo(
    () => sortByDate(projects, "created_at"),
    [projects]
  );

  // Calculate categories with metrics
  const categoriesWithMetrics = useMemo<CategoryWithMetrics[]>(() => {
    return categories.map((category) => {
      const relatedBills = bills.filter((bill) => bill.category_id === category.id);
      const totalSpend = sumBy(relatedBills, "amount");

      return {
        ...category,
        billCount: relatedBills.length,
        totalSpend,
      };
    });
  }, [categories, bills]);

  return {
    highlights,
    topClients,
    recentBills,
    projectsByClient,
    categoriesWithMetrics,
    categoryNameById,
    clientNameById,
    projectByClientId,
    isLoading,
    error,
  };
};
