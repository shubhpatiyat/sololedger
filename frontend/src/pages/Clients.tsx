import React, { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { ArrowLeft, Building2, Mail, MapPin, Phone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspaceData } from "@/hooks/useWorkspaceData";
import { useToast } from "@/hooks/use-toast";
import { LayoutOutletContext } from "@/components/Layout";

const Clients: React.FC = () => {
  const { toast } = useToast();
  const { refetchChats } = useOutletContext<LayoutOutletContext>();
  const { clients, projects, addClient, isLoading, error } = useWorkspaceData();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await addClient({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        address_line_1: addressLine1.trim() || null,
        address_line_2: addressLine2.trim() || null,
        city: city.trim() || null,
        state: stateValue.trim() || null,
        postal_code: postalCode.trim() || null,
        country: country.trim() || null,
        notes: notes.trim() || null,
        status: status.trim() || "active",
      });

      setName("");
      setEmail("");
      setPhone("");
      setAddressLine1("");
      setAddressLine2("");
      setCity("");
      setStateValue("");
      setPostalCode("");
      setCountry("");
      setNotes("");
      setStatus("active");
      await refetchChats();
      toast({
        title: "Client Saved",
        description: "Client added successfully. You can now raise expenses directly in this client’s chat.",
        className: "bg-green-500 text-white border-green-600",
      });
    } catch (submitErr) {
      const errorMessage =
        submitErr instanceof Error ? submitErr.message : "Failed to create client";
      setSubmitError(errorMessage);
      toast({
        title: "Save Failed",
        description: errorMessage,
        className: "bg-red-500 text-white border-red-600",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground">
              Add and manage the clients you bill and follow up with.
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
        {submitError ? (
          <Card className="border-red-500/40 bg-red-500/5">
            <CardContent className="p-4 text-sm text-red-700">{submitError}</CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Add Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client-name">Client Name</Label>
                  <Input
                    id="client-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Media"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-email">Email</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="accounts@rahulmedia.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-phone">Phone</Label>
                  <Input
                    id="client-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-address-line-1">Address Line 1</Label>
                  <Input
                    id="client-address-line-1"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="123 Business Park"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-address-line-2">Address Line 2</Label>
                  <Input
                    id="client-address-line-2"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Suite 401"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="client-city">City</Label>
                    <Input
                      id="client-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Pune"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-state">State</Label>
                    <Input
                      id="client-state"
                      value={stateValue}
                      onChange={(e) => setStateValue(e.target.value)}
                      placeholder="Maharashtra"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="client-postal-code">Postal Code</Label>
                    <Input
                      id="client-postal-code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="411001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-country">Country</Label>
                    <Input
                      id="client-country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="India"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-status">Status</Label>
                  <Input
                    id="client-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    placeholder="active"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-notes">Notes</Label>
                  <Textarea
                    id="client-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Monthly billing cycle, primary finance contact, or reminders."
                    rows={4}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Client"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <Card className="md:col-span-2">
                <CardContent className="p-5 text-sm text-muted-foreground">
                  Loading clients...
                </CardContent>
              </Card>
            ) : null}

            {!isLoading && clients.length === 0 ? (
              <Card className="md:col-span-2">
                <CardContent className="p-5 text-sm text-muted-foreground">
                  No clients yet. Add your first client to start tracking projects and invoices.
                </CardContent>
              </Card>
            ) : null}

            {clients.map((client) => {
              const activeProjects = projects.filter(
                (project) => project.client_id === client.id
              ).length;
              const addressParts = [
                client.address_line_1,
                client.address_line_2,
                client.city,
                client.state,
                client.postal_code,
                client.country,
              ].filter(Boolean);

              return (
                <Card key={client.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {activeProjects} active projects
                        </p>
                      </div>
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="mt-4 space-y-3 text-sm">
                      <p className="text-muted-foreground">{client.status}</p>
                      {client.email ? (
                        <p className="flex items-center gap-2 text-foreground">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {client.email}
                        </p>
                      ) : null}
                      {client.phone ? (
                        <p className="flex items-center gap-2 text-foreground">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {client.phone}
                        </p>
                      ) : null}
                      {addressParts.length ? (
                        <p className="flex items-start gap-2 text-foreground">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span>{addressParts.join(", ")}</span>
                        </p>
                      ) : null}
                      {client.notes ? (
                        <p className="text-muted-foreground">{client.notes}</p>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Clients;
