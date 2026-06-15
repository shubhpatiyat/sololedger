import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, FolderKanban, Receipt, Wallet } from "lucide-react";
import { useLibraryData } from "@/hooks/useLibraryData";
import { formatCurrency } from "@/utils/formatting";
import { MetricCard } from "@/components/workspace/MetricCard";
import { SectionCard } from "@/components/workspace/SectionCard";
import { DataCard } from "@/components/workspace/DataCard";
import { EmptyState } from "@/components/workspace/EmptyState";

interface LibraryProps {
  onClose: () => void;
}

const Library: React.FC<LibraryProps> = ({ onClose }) => {
  const {
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
  } = useLibraryData();

  return (
    <div className="flex-1 bg-background overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent h-full">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Workspace Overview
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-3xl">
              A comprehensive finance dashboard for receivables, bills, clients, and project spend.
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full sm:w-auto hover:bg-primary hover:text-primary-foreground transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chat
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-900 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Highlight Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {highlights.map((item, index) => (
            <div
              key={item.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <MetricCard
                label={item.label}
                value={item.value}
                meta={item.meta}
                icon={item.icon}
              />
            </div>
          ))}
        </div>

        {/* Clients & Bills Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Clients Section */}
          <div className="xl:col-span-1 animate-in fade-in slide-in-from-left duration-500 delay-200">
            <SectionCard
              title="Top Clients"
              icon={Building2}
              manageLink="/clients"
              manageLinkText="View All"
            >
              {topClients.length > 0 ? (
                topClients.map((client) => (
                  <DataCard
                    key={client.id}
                    title={client.name}
                    subtitle={`${client.projectCount} active project${client.projectCount === 1 ? "" : "s"}`}
                    status={client.status}
                    statusVariant={
                      client.status === "active" ? "success" : "default"
                    }
                  >
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Bill spend</p>
                        <p className="font-semibold text-foreground">
                          {formatCurrency(client.billAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Projects</p>
                        <p className="font-semibold text-foreground">
                          {client.projectCount}
                        </p>
                      </div>
                    </div>
                  </DataCard>
                ))
              ) : (
                <EmptyState
                  icon={Building2}
                  message="No clients yet. Add one to start tracking bills and project spend."
                />
              )}
            </SectionCard>
          </div>

          {/* Bills Section */}
          <div className="xl:col-span-2 animate-in fade-in slide-in-from-right duration-500 delay-300">
            <SectionCard
              title="Recent Bills"
              icon={Receipt}
              manageLink="/bills"
              manageLinkText="View All"
            >
              {recentBills.length > 0 ? (
                recentBills.map((bill) => (
                  <DataCard
                    key={bill.id}
                    title={bill.title}
                    subtitle={`${bill.vendor_name || "Unknown vendor"} · ${
                      categoryNameById.get(bill.category_id) || "Uncategorized"
                    }`}
                    status={bill.status}
                    statusVariant={
                      bill.status === "paid"
                        ? "success"
                        : bill.status === "pending"
                        ? "warning"
                        : "default"
                    }
                  >
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xl font-bold text-foreground">
                        {formatCurrency(bill.amount)}
                      </span>
                      {bill.bill_date && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(bill.bill_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )}
                    </div>
                  </DataCard>
                ))
              ) : (
                <EmptyState
                  icon={Receipt}
                  message="No bills yet. Uploaded receipts and vendor charges will appear here."
                />
              )}
            </SectionCard>
          </div>
        </div>

        {/* Projects & Categories Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Projects Section */}
          <div className="animate-in fade-in slide-in-from-bottom duration-500 delay-400">
            <SectionCard
              title="Projects"
              icon={FolderKanban}
              manageLink="/projects"
              manageLinkText="View All"
            >
              {projectsByClient.length > 0 ? (
                projectsByClient.map((project) => (
                  <DataCard
                    key={project.id}
                    title={project.name}
                    subtitle={clientNameById.get(project.client_id) || "Unknown client"}
                    status={project.status || "unknown"}
                    statusVariant={
                      project.status === "active"
                        ? "success"
                        : project.status === "completed"
                        ? "default"
                        : "default"
                    }
                  >
                    <div className="mt-3 text-sm">
                      <p className="text-muted-foreground text-xs mb-1">Budget</p>
                      <p className="font-semibold text-foreground text-lg">
                        {formatCurrency(project.budget_amount || 0)}
                      </p>
                    </div>
                  </DataCard>
                ))
              ) : (
                <EmptyState icon={FolderKanban} message="No projects yet." />
              )}
            </SectionCard>
          </div>

          {/* Categories Section */}
          <div className="animate-in fade-in slide-in-from-bottom duration-500 delay-500">
            <SectionCard
              title="Categories"
              icon={Wallet}
              manageLink="/categories"
              manageLinkText="View All"
            >
              {categoriesWithMetrics.length > 0 ? (
                categoriesWithMetrics.map((category) => (
                  <DataCard
                    key={category.id}
                    title={category.name}
                    subtitle={`${category.billCount} bill${category.billCount === 1 ? "" : "s"}`}
                  >
                    <div className="mt-3 text-sm">
                      <p className="text-muted-foreground text-xs mb-1">Total spend</p>
                      <p className="font-semibold text-foreground text-lg">
                        {formatCurrency(category.totalSpend)}
                      </p>
                    </div>
                  </DataCard>
                ))
              ) : (
                <EmptyState icon={Wallet} message="No categories yet." />
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Library;
