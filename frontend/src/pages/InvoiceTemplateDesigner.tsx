import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import { apiService } from "@/services/apiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { InvoiceTemplateData } from "@/types";

const defaultTemplate: InvoiceTemplateData = {
  version: 1,
  branding: {
    logo_url: null,
    logo_path: null,
    brand_color: "#2F80ED",
    font_family: "modern",
  },
  layout: {
    style: "standard",
    show_fields: {
      notes: true,
      payment_details: true,
      due_date: true,
      tax_breakdown: true,
    },
  },
  labels: {
    invoice_title: "TAX INVOICE",
    balance_due_label: "Balance due",
  },
  defaults: {
    notes: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    terms: "Payment due within 7 days from invoice date.",
  },
};

const sampleData = {
  invoiceNumber: "INV-482019",
  invoiceDate: "07 Apr 2026",
  dueDate: "14 Apr 2026",
  fromName: "SoloLedger Labs Pvt. Ltd.",
  toName: "Acme Trading Co.",
  lineItem: "Consulting services",
  subtotal: "₹48,000.00",
  tax: "₹8,640.00",
  total: "₹56,640.00",
};

const InvoiceTemplateDesigner: React.FC = () => {
  const [template, setTemplate] = useState<InvoiceTemplateData>(defaultTemplate);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    const loadTemplate = async () => {
      const response = await apiService.getDefaultInvoiceTemplate();
      if (response.status && response.status < 400 && response.data?.template_json) {
        const loadedTemplate = response.data.template_json as InvoiceTemplateData;
        setTemplate(loadedTemplate);

        if (loadedTemplate.branding?.logo_path) {
          const logoResponse = await apiService.fetchDefaultInvoiceTemplateLogoBlob();
          if (logoResponse.status && logoResponse.status < 300 && logoResponse.data) {
            const blobUrl = URL.createObjectURL(logoResponse.data);
            setLogoPreviewUrl(blobUrl);
          }
        } else if (loadedTemplate.branding?.logo_url) {
          setLogoPreviewUrl(loadedTemplate.branding.logo_url);
        }
      }
      setIsLoading(false);
    };

    loadTemplate();
  }, []);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setSaveState("saving");
      const response = await apiService.updateDefaultInvoiceTemplate({
        name: "Default",
        template_json: template as unknown as Record<string, unknown>,
      });
      if (response.status && response.status < 400) {
        setSaveState("saved");
      } else {
        setSaveState("error");
      }
    }, 650);

    return () => window.clearTimeout(timer);
  }, [isLoading, template]);

  const previewFontClass = useMemo(() => {
    if (template.branding.font_family === "serif") {
      return "font-serif";
    }
    if (template.branding.font_family === "mono") {
      return "font-mono";
    }
    return "font-sans";
  }, [template.branding.font_family]);

  const onLogoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsLogoUploading(true);
    setSaveState("saving");
    const response = await apiService.uploadDefaultInvoiceTemplateLogo(file);
    if (response.status && response.status < 400 && response.data?.template_json) {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
      const localPreview = URL.createObjectURL(file);
      setLogoPreviewUrl(localPreview);
      setTemplate(response.data.template_json as InvoiceTemplateData);
      setSaveState("saved");
    } else {
      setSaveState("error");
    }
    setIsLogoUploading(false);
    event.target.value = "";
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invoice Template Designer</h1>
            <p className="text-muted-foreground">
              Controls on left, live preview on right. Updates instantly as you edit.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/invoices">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoices
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <Card className="xl:col-span-4">
            <CardHeader>
              <CardTitle>Invoice Design</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="logoUpload">Logo</Label>
                <label
                  htmlFor="logoUpload"
                  className="flex items-center justify-center gap-2 border border-dashed rounded-lg p-4 text-sm cursor-pointer hover:bg-muted/40"
                >
                  <Upload className="w-4 h-4" />
                  Upload logo
                </label>
                <Input id="logoUpload" type="file" accept="image/*" className="hidden" onChange={onLogoSelect} />
                {isLogoUploading ? (
                  <p className="text-xs text-muted-foreground">Uploading logo...</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandColor">Brand Color</Label>
                <Input
                  id="brandColor"
                  type="color"
                  value={template.branding.brand_color}
                  onChange={(e) =>
                    setTemplate((prev) => ({
                      ...prev,
                      branding: { ...prev.branding, brand_color: e.target.value },
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Font</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["modern", "serif", "mono"] as const).map((font) => (
                    <Button
                      key={font}
                      type="button"
                      variant={template.branding.font_family === font ? "default" : "outline"}
                      className="capitalize"
                      onClick={() =>
                        setTemplate((prev) => ({
                          ...prev,
                          branding: { ...prev.branding, font_family: font },
                        }))
                      }
                    >
                      {font}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Layout</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["standard", "minimal"] as const).map((style) => (
                    <Button
                      key={style}
                      type="button"
                      variant={template.layout.style === style ? "default" : "outline"}
                      className="capitalize"
                      onClick={() =>
                        setTemplate((prev) => ({
                          ...prev,
                          layout: { ...prev.layout, style },
                        }))
                      }
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>

              {(
                [
                  ["notes", "Show notes"],
                  ["payment_details", "Show payment details"],
                  ["due_date", "Show due date"],
                  ["tax_breakdown", "Show tax breakdown"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label>{label}</Label>
                  <Switch
                    checked={template.layout.show_fields[key]}
                    onCheckedChange={(checked) =>
                      setTemplate((prev) => ({
                        ...prev,
                        layout: {
                          ...prev.layout,
                          show_fields: { ...prev.layout.show_fields, [key]: checked },
                        },
                      }))
                    }
                  />
                </div>
              ))}

              <div className="space-y-2">
                <Label htmlFor="notesDefault">Default Notes</Label>
                <Textarea
                  id="notesDefault"
                  value={template.defaults.notes || ""}
                  onChange={(e) =>
                    setTemplate((prev) => ({
                      ...prev,
                      defaults: { ...prev.defaults, notes: e.target.value },
                    }))
                  }
                />
              </div>

              <p className="text-xs text-muted-foreground">
                {saveState === "saving" ? "Saving..." : null}
                {saveState === "saved" ? "Saved" : null}
                {saveState === "error" ? "Save failed. Please retry." : null}
                {saveState === "idle" ? " " : null}
              </p>
            </CardContent>
          </Card>

          <Card className="xl:col-span-8">
            <CardContent className={`p-6 md:p-8 ${previewFontClass}`}>
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  {logoPreviewUrl || template.branding.logo_url ? (
                    <img src={logoPreviewUrl || template.branding.logo_url || ""} alt="Logo preview" className="h-14 w-14 rounded-md object-contain bg-white p-1" />
                  ) : (
                    <div
                      className="h-14 w-14 rounded-md flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: template.branding.brand_color }}
                    >
                      SL
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-3xl font-bold">{template.labels.invoice_title}</p>
                    <p className="text-muted-foreground">{sampleData.invoiceNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground uppercase text-xs">From</p>
                    <p className="font-semibold">{sampleData.fromName}</p>
                    <p>Plot 18, Lorem Nagar, Jaipur 302012</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground uppercase text-xs">Bill To</p>
                    <p className="font-semibold">{sampleData.toName}</p>
                    <p>123 Ipsum Street, Mumbai 400001</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground uppercase text-xs">Invoice Date</p>
                    <p>{sampleData.invoiceDate}</p>
                  </div>
                  {template.layout.show_fields.due_date ? (
                    <div>
                      <p className="text-muted-foreground uppercase text-xs">Due Date</p>
                      <p>{sampleData.dueDate}</p>
                    </div>
                  ) : (
                    <div />
                  )}
                  <div className="text-right">
                    <span
                      className="inline-flex rounded-full px-3 py-1 text-sm font-semibold"
                      style={{ backgroundColor: `${template.branding.brand_color}22`, color: template.branding.brand_color }}
                    >
                      {template.labels.balance_due_label} {sampleData.total}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border overflow-hidden">
                  <div
                    className="grid grid-cols-4 px-4 py-2 text-white text-sm font-medium"
                    style={{ backgroundColor: template.branding.brand_color }}
                  >
                    <p>#</p>
                    <p>Description</p>
                    <p className="text-right">Rate</p>
                    <p className="text-right">Amount</p>
                  </div>
                  <div className="grid grid-cols-4 px-4 py-3 text-sm">
                    <p>1</p>
                    <p>{sampleData.lineItem}</p>
                    <p className="text-right">₹48,000.00</p>
                    <p className="text-right">₹48,000.00</p>
                  </div>
                </div>

                <div className="ml-auto max-w-xs space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sub total</span>
                    <span>{sampleData.subtotal}</span>
                  </div>
                  {template.layout.show_fields.tax_breakdown ? (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">IGST (18%)</span>
                      <span>{sampleData.tax}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{sampleData.total}</span>
                  </div>
                </div>

                {template.layout.show_fields.notes ? (
                  <div className="text-sm">
                    <p className="font-semibold">Notes</p>
                    <p className="text-muted-foreground">{template.defaults.notes}</p>
                  </div>
                ) : null}

                {template.layout.show_fields.payment_details ? (
                  <div className="text-sm">
                    <p className="font-semibold">Payment details</p>
                    <p className="text-muted-foreground">A/C No. 001205562202 | IFSC ICIC0000012</p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplateDesigner;
