import { createFileRoute } from "@tanstack/react-router";
import { Shell, inr } from "@/components/Shell";
import { useApp, update } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin moderation — Mandi Direct" },
      { name: "description", content: "Review duplicate or inappropriate produce listings." },
      { property: "og:title", content: "Admin moderation — Mandi Direct" },
      { property: "og:description", content: "Listing moderation for the farmer marketplace." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const app = useApp();
  const fById = Object.fromEntries(app.farmers.map((f) => [f.id, f]));
  const counts: Record<string, number> = {};
  app.products.forEach((p) => { const k = p.name.toLowerCase().trim(); counts[k] = (counts[k] || 0) + 1; });
  const toggle = (id: string) => update((s) => ({ ...s, products: s.products.map((p) => p.id === id ? { ...p, hidden: !p.hidden } : p) }));
  return (
    <Shell>
      <h1 className="font-display text-3xl mb-2">Moderation</h1>
      {app.role !== "admin" && <p className="text-destructive mb-4">Switch to the Admin role to moderate listings.</p>}
      <div className="space-y-2">
        {app.products.map((p) => {
          const dup = (counts[p.name.toLowerCase().trim()] ?? 0) > 1;
          return (
            <div key={p.id} className="panel flex flex-wrap items-center gap-3">
              <span className="text-2xl">{p.emoji}</span>
              <span className="flex-1">{p.name} <span className="text-sm text-muted-foreground">· {fById[p.farmerId]?.farm} · {inr(p.price)}/{p.unit}</span></span>
              {dup && <span className="badge badge-ready">possible duplicate</span>}
              {p.hidden && <span className="badge badge-cancelled">hidden</span>}
              <button className="btn-ghost" disabled={app.role !== "admin"} onClick={() => toggle(p.id)}>{p.hidden ? "Restore" : "Hide"}</button>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
