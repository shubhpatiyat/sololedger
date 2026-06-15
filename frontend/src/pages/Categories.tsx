import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Search, Tags, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspaceData } from "@/hooks/useWorkspaceData";

const Categories: React.FC = () => {
  const { categories, bills, addCategory, isLoading, error } = useWorkspaceData();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");

  const filteredCategories = categories.filter((category) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      category.name.toLowerCase().includes(query) ||
      (category.description || "").toLowerCase().includes(query)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addCategory({
      name: name.trim(),
      description: description.trim() || null,
    });

    setName("");
    setDescription("");
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Categories</h1>
            <p className="text-muted-foreground">
              Define the buckets used to classify expenses and reimbursements.
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Tags className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Categories</p>
                <p className="text-2xl font-semibold text-foreground">{categories.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <WalletCards className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bills Tagged</p>
                <p className="text-2xl font-semibold text-foreground">{bills.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Add Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Category Name</Label>
                  <Input
                    id="category-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Software"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category-description">Description</Label>
                  <Textarea
                    id="category-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="SaaS tools and recurring subscriptions."
                    rows={4}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Save Category
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
                    placeholder="Search categories"
                    className="pl-9"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {isLoading ? (
              <Card className="md:col-span-2">
                <CardContent className="p-5 text-sm text-muted-foreground">
                  Loading categories...
                </CardContent>
              </Card>
            ) : null}

            {!isLoading && categories.length === 0 ? (
              <Card className="md:col-span-2">
                <CardContent className="p-5 text-sm text-muted-foreground">
                  No categories yet. Add one to start organizing bills and expenses.
                </CardContent>
              </Card>
            ) : null}

            {!isLoading && categories.length > 0 && filteredCategories.length === 0 ? (
              <Card className="md:col-span-2">
                <CardContent className="p-5 text-sm text-muted-foreground">
                  No categories match the current search.
                </CardContent>
              </Card>
            ) : null}

            {filteredCategories.map((category) => {
              const relatedBills = bills.filter((bill) => bill.category_id === category.id).length;

              return (
              <Card key={category.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{category.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Expense and reimbursement category
                      </p>
                    </div>
                    <Tags className="w-5 h-5 text-primary" />
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-muted-foreground">Usage</p>
                      <Badge variant="secondary">
                        {relatedBills} bill{relatedBills === 1 ? "" : "s"}
                      </Badge>
                    </div>
                    <p className="text-foreground">
                      {category.description || "No description added yet."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )})}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;
