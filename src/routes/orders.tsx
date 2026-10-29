import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Shell, StatusBadge, inr } from "@/components/Shell";
import { useApp, update } from "@/lib/store";
import { setStatus } from "@/lib/market";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My orders — Mandi Direct" },
      { name: "description", content: "Track your produce orders from requested to completed." },
      { property: "og:title", content: "My orders — Mandi Direct" },
      { property: "og:description", content: "Buyer order history and status." },
    ],
  }),
  component: Orders,
});

function Orders() {
  const app = useApp();
  const pById = Object.fromEntries(app.products.map((p) => [p.id, p]));
  const fById = Object.fromEntries(app.farmers.map((f) => [f.id, f]));
  const cancel = (id: string) => {
    try { update((s) => ({ ...s, ...setStatus(s, id, "cancelled") })); toast.success("Order cancelled, stock restored"); }
    catch (e) { toast.error((e as Error).message); }
  };
  return (
    <Shell>
      <h1 className="font-display text-3xl mb-6">My orders</h1>
      {!app.orders.length && <p className="text-muted-foreground">No orders yet. Head to the market to request some produce.</p>}
      <div className="space-y-3">
        {app.orders.map((o) => {
          const p = pById[o.productId];
          return (
            <div key={o.id} className="panel flex flex-wrap items-center gap-4">
              <span className="text-3xl">{p?.emoji}</span>
              <div className="flex-1 min-w-48">
                <p className="font-semibold">{p?.name} — {o.quantity} {p?.unit}</p>
                <p className="text-sm text-muted-foreground">{fById[o.farmerId]?.farm} · {new Date(o.createdAt).toLocaleString()}</p>
              </div>
              <span className="font-bold">{inr(o.total)}</span>
              <StatusBadge s={o.status} />
              {["requested", "accepted"].includes(o.status) && <button className="btn-ghost" onClick={() => cancel(o.id)}>Cancel</button>}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
