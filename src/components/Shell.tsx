import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useApp, update, resetDemo } from "@/lib/store";
import type { Role, OrderStatus } from "@/lib/market";

export function Shell({ children }: { children: ReactNode }) {
  const app = useApp();
  const setRole = (role: Role) => update((s) => ({ ...s, role }));
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Link to="/" className="font-display text-2xl text-primary">🌱 Mandi Direct</Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/" className="nav-link" activeOptions={{ exact: true }}>Market</Link>
            <Link to="/orders" className="nav-link">My orders</Link>
            <Link to="/farmer" className="nav-link">Farmer</Link>
            <Link to="/admin" className="nav-link">Admin</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Demo role:</span>
            <select className="field" value={app.role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="buyer">Buyer</option><option value="farmer">Farmer</option><option value="admin">Admin</option>
            </select>
            {app.role === "farmer" && (
              <select className="field" value={app.farmerId} onChange={(e) => update((s) => ({ ...s, farmerId: e.target.value }))}>
                {app.farmers.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            )}
            <button className="btn-ghost" onClick={resetDemo}>Reset</button>
          </div>
        </div>
      </header>
      <div className="bg-secondary text-secondary-foreground text-center text-xs py-1.5">
        Prototype: payments are cash-on-pickup only (simulated). Delivery is shown for demo purposes and is not actually fulfilled.
      </div>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

export function StatusBadge({ s }: { s: OrderStatus }) {
  return <span className={`badge badge-${s}`}>{s}</span>;
}

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
