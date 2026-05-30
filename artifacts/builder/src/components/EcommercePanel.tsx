import { useState } from "react";
import { X, ShoppingBag, ShoppingCart, CreditCard, Package, BarChart3, Warehouse, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface Module {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  prompt: string;
}

const MODULES: Module[] = [
  {
    id: "products",
    name: "Product Catalog",
    description: "Beautiful product grid with search, filters, variants, and image galleries.",
    icon: <ShoppingBag className="h-5 w-5" />,
    color: "text-blue-600 bg-blue-50",
    prompt: "Add a complete product catalog section with a responsive grid of product cards, search bar, category filters, and a product detail modal. Use Apple iOS 26 design with clean cards, hover effects, and smooth transitions.",
  },
  {
    id: "cart",
    name: "Shopping Cart",
    description: "Sliding cart drawer with quantity controls, remove items, and order summary.",
    icon: <ShoppingCart className="h-5 w-5" />,
    color: "text-green-600 bg-green-50",
    prompt: "Add a shopping cart system with a slide-over cart drawer, quantity +/- controls, remove item buttons, subtotal calculation, and a clear call-to-action checkout button. Make it feel native and smooth.",
  },
  {
    id: "checkout",
    name: "Checkout Flow",
    description: "Multi-step checkout with shipping address, payment, and order review.",
    icon: <CreditCard className="h-5 w-5" />,
    color: "text-purple-600 bg-purple-50",
    prompt: "Add a multi-step checkout flow with steps: Cart Review → Shipping Address → Payment Details → Order Confirmation. Use a progress indicator, form validation, and a clean order summary sidebar.",
  },
  {
    id: "payments",
    name: "Payment Gateway",
    description: "Payment form UI supporting credit cards, PayPal, and Apple Pay display.",
    icon: <CreditCard className="h-5 w-5" />,
    color: "text-indigo-600 bg-indigo-50",
    prompt: "Add a payment gateway section with a credit card form (card number formatting, expiry, CVV), payment method tabs (Credit Card, PayPal, Apple Pay), and a secure payment badge with SSL indicator.",
  },
  {
    id: "orders",
    name: "Order Management",
    description: "Order list with status badges, timeline view, and track package button.",
    icon: <Package className="h-5 w-5" />,
    color: "text-orange-600 bg-orange-50",
    prompt: "Add an order management section with a list of orders showing order number, date, status badges (Pending, Processing, Shipped, Delivered), item thumbnails, total amount, and a Track Package button for each order.",
  },
  {
    id: "inventory",
    name: "Inventory Dashboard",
    description: "Stock level indicators, low-stock alerts, and inventory metrics.",
    icon: <Warehouse className="h-5 w-5" />,
    color: "text-teal-600 bg-teal-50",
    prompt: "Add an inventory dashboard with a table showing product names, SKUs, stock levels with color-coded indicators (green=ok, amber=low, red=critical), reorder buttons for low stock items, and summary metrics cards at the top.",
  },
  {
    id: "analytics",
    name: "Sales Analytics",
    description: "Revenue chart, conversion funnel, top products, and key metrics.",
    icon: <BarChart3 className="h-5 w-5" />,
    color: "text-rose-600 bg-rose-50",
    prompt: "Add a sales analytics dashboard with KPI cards (Revenue, Orders, Conversion Rate, Average Order Value), a line chart showing revenue over time (use SVG/canvas), a top products list, and a recent orders table.",
  },
];

interface EcommercePanelProps {
  projectId: string;
  currentHtml: string;
  onInsert: (prompt: string) => void;
  onClose: () => void;
}

export default function EcommercePanel({ projectId, currentHtml, onInsert, onClose }: EcommercePanelProps) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [inserting, setInserting] = useState<string | null>(null);
  const [inserted, setInserted] = useState<Record<string, boolean>>({});

  const handleInsert = async (mod: Module) => {
    setInserting(mod.id);
    onInsert(mod.prompt);
    await new Promise((r) => setTimeout(r, 500));
    setInserting(null);
    setInserted((prev) => ({ ...prev, [mod.id]: true }));
    setEnabled((prev) => ({ ...prev, [mod.id]: true }));
    setTimeout(() => setInserted((prev) => ({ ...prev, [mod.id]: false })), 3000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-background border-l shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex-none h-14 border-b bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <span className="font-semibold">E-Commerce Modules</span>
          <Badge variant="secondary" className="text-[10px]">7 modules</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Insert professional e-commerce sections into your project with one click. AI will generate the complete HTML+JS for each module.
          </p>
          <Separator />
          {MODULES.map((mod) => (
            <div key={mod.id} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${mod.color}`}>
                    {mod.icon}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{mod.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{mod.description}</div>
                  </div>
                </div>
                <Switch
                  checked={!!enabled[mod.id]}
                  onCheckedChange={(checked) => setEnabled((prev) => ({ ...prev, [mod.id]: checked }))}
                />
              </div>
              <Button
                size="sm"
                variant={inserted[mod.id] ? "secondary" : "outline"}
                className="w-full h-8 text-xs"
                onClick={() => handleInsert(mod)}
                disabled={!!inserting}
              >
                {inserting === mod.id ? (
                  <>
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    Generating…
                  </>
                ) : inserted[mod.id] ? (
                  <>
                    <Check className="mr-1.5 h-3 w-3 text-green-600" />
                    Inserted
                  </>
                ) : (
                  "Insert into project"
                )}
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
