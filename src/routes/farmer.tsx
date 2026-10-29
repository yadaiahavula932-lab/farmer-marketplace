import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Shell, StatusBadge, inr } from "@/components/Shell";
import { useApp, update } from "@/lib/store";
import { nextStatuses, setStatus, type Product } from "@/lib/market";

export const Route = createFileRoute("/farmer")({
  head: () => ({
    meta: [
      { title: "Farmer dashboard — Mandi Direct" },
      { name: "description", content: "Manage produce listings, inventory and incoming orders." },
      { property: "og:title", content: "Farmer dashboard — Mandi Direct" },
      { property: "og:description", content: "Inventory, orders and sales for farmers." },
    ],
  }),
  component: Farmer,
});

const blank = { name: "", category: "Vegetables", emoji: "🥬", unit: "kg", quantity: "", price: "", availableFrom: new Date().toISOString().slice(0, 10), fulfilment: "pickup" };

function Farmer() {
  const app = useApp();
  const [form, setForm] = useState(blank);
  const me = app.farmers.find((f) => f.id === app.farmerId)!;
  const mine = app.products.filter((p) => p.farmerId === me.id);
  const orders = app.orders.filter((o) => o.farmerId === me.id);
  const pById = Object.fromEntries(app.products.map((p) => [p.id, p]));
  const sales = orders.filter((o) => o.status === "completed").reduce((a, o) => a + o.total, 0);
  const open = orders.filter((o) => !["completed", "cancelled"].includes(o.status)).length;

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = Number(form.quantity), price = Number(form.price);
    if (!form.name.trim() || quantity < 0 || price <= 0) { toast.error("Enter a name, stock and a price above 0"); return; }
    const p: Product = { ...form, id: Math.random().toString(36).slice(2, 9), farmerId: me.id, quantity, price, fulfilment: form.fulfilment as Product["fulfilment"] };
    update((s) => ({ ...s, products: [p, ...s.products] }));
    setForm(blank); toast.success("Listing published");
  };
  const setQty = (id: string, q: number) => update((s) => ({ ...s, products: s.products.map((p) => p.id === id ? { ...p, quantity: Math.max(0, q) } : p) }));
  const move = (id: string, st: Parameters<typeof setStatus>[2]) => {
    try { update((s) => ({ ...s, ...setStatus(s, id, st) })); } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Shell>
      <h1 className="font-display text-3xl">{me.farm}</h1>
      <p className="text-muted-foreground mb-6">{me.name} · {me.location} {app.role !== "farmer" && "— switch to Farmer role to choose a profile"}</p>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="panel"><p className="text-sm text-muted-foreground">Completed sales</p><p className="text-2xl font-bold">{inr(sales)}</p></div>
        <div className="panel"><p className="text-sm text-muted-foreground">Open orders</p><p className="text-2xl font-bold">{open}</p></div>
        <div className="panel"><p className="text-sm text-muted-foreground">Listings</p><p className="text-2xl font-bold">{mine.length}</p></div>
      </div>

      <h2 className="text-xl font-semibold mb-3">Incoming orders</h2>
      <div className="space-y-2 mb-10">
        {!orders.length && <p className="text-muted-foreground text-sm">No orders yet.</p>}
        {orders.map((o) => (
          <div key={o.id} className="panel flex flex-wrap items-center gap-3">
            <span className="flex-1">{pById[o.productId]?.emoji} {pById[o.productId]?.name} × {o.quantity} {pById[o.productId]?.unit} — {o.buyer}</span>
            <span className="font-bold">{inr(o.total)}</span>
            <StatusBadge s={o.status} />
            {nextStatuses(o.status).map((n) => <button key={n} className={n === "cancelled" ? "btn-ghost" : "btn-primary"} onClick={() => move(o.id, n)}>{n === "cancelled" ? "Cancel" : `Mark ${n}`}</button>)}
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <h2 className="text-xl font-semibold mb-3">Inventory</h2>
          <div className="space-y-2">
            {mine.map((p) => (
              <div key={p.id} className="panel flex items-center gap-3">
                <span className="text-2xl">{p.emoji}</span>
                <span className="flex-1">{p.name} <span className="text-sm text-muted-foreground">· {inr(p.price)}/{p.unit}</span>{p.hidden && <span className="badge badge-cancelled ml-2">hidden by admin</span>}</span>
                <input className="field w-24" type="number" min={0} value={p.quantity} onChange={(e) => setQty(p.id, Number(e.target.value))} />
                <span className="text-sm text-muted-foreground w-14">{p.unit}</span>
              </div>
            ))}
          </div>
        </div>
        <form onSubmit={add} className="panel space-y-3 h-fit">
          <h2 className="text-xl font-semibold">New listing</h2>
          <input className="field w-full" placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <select className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {["Vegetables", "Fruits", "Grains", "Dairy", "Spices"].map((c) => <option key={c}>{c}</option>)}
            </select>
            <input className="field" placeholder="Photo emoji" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
            <input className="field" type="number" placeholder="Stock" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <input className="field" placeholder="Unit (kg)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <input className="field" type="number" placeholder="Price ₹ / unit" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <input className="field" type="date" value={form.availableFrom} onChange={(e) => setForm({ ...form, availableFrom: e.target.value })} />
          </div>
          <select className="field w-full" value={form.fulfilment} onChange={(e) => setForm({ ...form, fulfilment: e.target.value })}>
            <option value="pickup">Pickup only</option><option value="delivery">Delivery (demo)</option><option value="both">Pickup or delivery (demo)</option>
          </select>
          <button className="btn-primary w-full">Publish listing</button>
        </form>
      </div>
    </Shell>
  );
}
