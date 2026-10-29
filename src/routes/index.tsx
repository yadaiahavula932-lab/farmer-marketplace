import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Shell, inr } from "@/components/Shell";
import { useApp, update } from "@/lib/store";
import { placeOrder } from "@/lib/market";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mandi Direct — Buy fresh produce from farmers" },
      { name: "description", content: "Browse produce listed directly by farmers and order with clear prices, units and stock." },
      { property: "og:title", content: "Mandi Direct — Farmer Marketplace" },
      { property: "og:description", content: "Buy fresh produce directly from local farmers." },
    ],
  }),
  component: Market,
});

function Market() {
  const app = useApp();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [loc, setLoc] = useState("");
  const [max, setMax] = useState("");
  const [inStock, setInStock] = useState(true);
  const [qty, setQty] = useState<Record<string, string>>({});
  const fById = Object.fromEntries(app.farmers.map((f) => [f.id, f]));
  const cats = [...new Set(app.products.map((p) => p.category))];
  const locs = [...new Set(app.farmers.map((f) => f.location))];

  const list = useMemo(() => app.products.filter((p) =>
    !p.hidden &&
    p.name.toLowerCase().includes(q.toLowerCase()) &&
    (!cat || p.category === cat) &&
    (!loc || fById[p.farmerId].location === loc) &&
    (!max || p.price <= +max) &&
    (!inStock || p.quantity > 0)
  ), [app.products, q, cat, loc, max, inStock]);

  const order = (id: string) => {
    const n = Number(qty[id] || 1);
    try {
      update((s) => ({ ...s, ...placeOrder(s, id, n, "Demo Buyer") }));
      toast.success("Order requested — pay cash on pickup");
      setQty((x) => ({ ...x, [id]: "" }));
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Shell>
      <section className="hero mb-8">
        <h1 className="font-display text-4xl md:text-5xl">Straight from the field.</h1>
        <p className="mt-2 max-w-xl opacity-90">Fresh produce listed by farmers, with honest prices and live stock.</p>
      </section>
      <div className="mb-6 grid gap-3 md:grid-cols-5">
        <input className="field md:col-span-2" placeholder="Search produce…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="field" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>{cats.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="field" value={loc} onChange={(e) => setLoc(e.target.value)}>
          <option value="">All locations</option>{locs.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input className="field" type="number" placeholder="Max price ₹" value={max} onChange={(e) => setMax(e.target.value)} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /> In stock only</label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => {
          const f = fById[p.farmerId];
          return (
            <article key={p.id} className="card-produce">
              <div className="produce-photo">{p.emoji}</div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between gap-2">
                  <h3 className="font-semibold text-lg">{p.name}</h3>
                  <span className="text-primary font-bold whitespace-nowrap">{inr(p.price)} <span className="text-xs text-muted-foreground font-normal">/ {p.unit}</span></span>
                </div>
                <p className="text-sm text-muted-foreground">{f.farm} · {f.location}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="chip">{p.category}</span>
                  <span className="chip">{p.quantity} {p.unit} left</span>
                  <span className="chip">From {p.availableFrom}</span>
                  <span className="chip">{p.fulfilment === "both" ? "Pickup / delivery*" : p.fulfilment === "delivery" ? "Delivery*" : "Pickup"}</span>
                </div>
                {app.role === "buyer" ? (
                  <div className="flex gap-2 pt-2">
                    <input className="field w-24" type="number" min={1} max={p.quantity} placeholder="1" value={qty[p.id] ?? ""} onChange={(e) => setQty((x) => ({ ...x, [p.id]: e.target.value }))} />
                    <button className="btn-primary flex-1" disabled={p.quantity === 0} onClick={() => order(p.id)}>{p.quantity ? "Request order" : "Sold out"}</button>
                  </div>
                ) : <p className="text-xs text-muted-foreground pt-2">Switch to Buyer role to order.</p>}
              </div>
            </article>
          );
        })}
        {!list.length && <p className="text-muted-foreground">No produce matches your filters.</p>}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">* Delivery is represented in this demo only.</p>
    </Shell>
  );
}
