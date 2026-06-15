import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BriefcaseBusiness, FolderKanban, Plus, Search, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspaceData } from "@/hooks/useWorkspaceData";

const formatCurrency = (amount?: number | null) => {
  if (amount == null) return "No budget set";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const Projects: React.FC = () => {
  const { clients, projects, addProject, isLoading, error } = useWorkspaceData();
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [status, setStatus] = useState("active");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.id, client.name])),
    [clients]
  );

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;

    return projects.filter((project) => {
      const clientName = clientNameById.get(project.client_id) || "";
      return (
        project.name.toLowerCase().includes(query) ||
        clientName.toLowerCase().includes(query) ||
        (project.status || "").toLowerCase().includes(query) ||
        (project.description || "").toLowerCase().includes(query)
      );
    });
  }, [clientNameById, projects, search]);

  const activeProjectCount = useMemo(
    () =>
      projects.filter((project) => (project.status || "").toLowerCase() === "active").length,
    [projects]
  );

  const totalBudget = useMemo(
    () => projects.reduce((sum, project) => sum + (project.budget_amount || 0), 0),
    [projects]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientId) return;

    await addProject({
      client_id: clientId,
      name: name.trim(),
      description: description.trim() || null,
      status: status.trim() || "active",
      budget_amount: budgetAmount.trim() ? Number(budgetAmount) : null,
    });

    setName("");
    setClientId("");
    setBudgetAmount("");
    setStatus("active");
    setDescription("");
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground">
              Track project budgets, scope, and billing status.
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-semibold text-foreground">{projects.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <FolderKanban className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-semibold text-foreground">{activeProjectCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Combined Budget</p>
                <p className="text-2xl font-semibold text-foreground">{formatCurrency(totalBudget)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Add Project
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Website Retainer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-client">Client</Label>
                  <Select
                    value={clientId}
                    onValueChange={setClientId}
                  >
                    <SelectTrigger id="project-client">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-background">
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {clients.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Add a client first before creating a project.
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-budget">Budget Amount</Label>
                  <Input
                    id="project-budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="55000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-status">Status</Label>
                  <Input
                    id="project-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    placeholder="active"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Monthly website support and maintenance scope."
                    rows={4}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={clients.length === 0}>
                  Save Project
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="xl:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by project, client, status, or description"
                    className="pl-9"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {isLoading ? (
              <Card className="md:col-span-2">
                <CardContent className="p-5 text-sm text-muted-foreground">
                  Loading projects...
                </CardContent>
              </Card>
            ) : null}

            {!isLoading && projects.length === 0 ? (
              <Card className="md:col-span-2">
                <CardContent className="p-5 text-sm text-muted-foreground">
                  No projects yet. Create a client first, then attach projects to it.
                </CardContent>
              </Card>
            ) : null}

            {!isLoading && projects.length > 0 && filteredProjects.length === 0 ? (
              <Card className="md:col-span-2">
                <CardContent className="p-5 text-sm text-muted-foreground">
                  No projects match the current search.
                </CardContent>
              </Card>
            ) : null}

            {filteredProjects.map((project) => (
              <Card key={project.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {clientNameById.get(project.client_id) || "Unknown client"}
                      </p>
                    </div>
                    <FolderKanban className="w-5 h-5 text-primary" />
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-muted-foreground">Status</p>
                      <Badge variant="secondary" className="capitalize">
                        {project.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Budget</p>
                      <p className="font-medium text-foreground">
                        {formatCurrency(project.budget_amount)}
                      </p>
                    </div>
                    {project.description ? (
                      <p className="text-foreground">{project.description}</p>
                    ) : (
                      <p className="text-muted-foreground">No description added yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
