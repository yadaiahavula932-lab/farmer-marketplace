// Pure marketplace logic: stock-safe ordering and order lifecycle.
export type Role = "buyer" | "farmer" | "admin";
export type OrderStatus = "requested" | "accepted" | "ready" | "completed" | "cancelled";

export interface Farmer { id: string; name: string; farm: string; location: string; }
export interface Product {
  id: string; farmerId: string; name: string; category: string; emoji: string;
  unit: string; quantity: number; price: number; availableFrom: string;
  fulfilment: "pickup" | "delivery" | "both"; flagged?: boolean; hidden?: boolean;
}
export interface Order {
  id: string; productId: string; farmerId: string; buyer: string;
  quantity: number; total: number; status: OrderStatus; createdAt: string;
}
export interface State { farmers: Farmer[]; products: Product[]; orders: Order[]; }

const uid = () => Math.random().toString(36).slice(2, 9);

export function placeOrder(s: State, productId: string, qty: number, buyer: string): State {
  const p = s.products.find((x) => x.id === productId);
  if (!p || p.hidden) throw new Error("Product not available");
  if (!Number.isInteger(qty) || qty <= 0) throw new Error("Quantity must be a positive whole number");
  if (qty > p.quantity) throw new Error(`Only ${p.quantity} ${p.unit} available`);
  const order: Order = {
    id: uid(), productId, farmerId: p.farmerId, buyer, quantity: qty,
    total: +(qty * p.price).toFixed(2), status: "requested", createdAt: new Date().toISOString(),
  };
  return {
    ...s,
    products: s.products.map((x) => (x.id === productId ? { ...x, quantity: x.quantity - qty } : x)),
    orders: [order, ...s.orders],
  };
}

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  requested: ["accepted", "cancelled"],
  accepted: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};
export const nextStatuses = (st: OrderStatus) => NEXT[st];

export function setStatus(s: State, orderId: string, status: OrderStatus): State {
  const o = s.orders.find((x) => x.id === orderId);
  if (!o) throw new Error("Order not found");
  if (!NEXT[o.status].includes(status)) throw new Error(`Cannot move from ${o.status} to ${status}`);
  let products = s.products;
  if (status === "cancelled") {
    products = products.map((p) => (p.id === o.productId ? { ...p, quantity: p.quantity + o.quantity } : p));
  }
  return { ...s, products, orders: s.orders.map((x) => (x.id === orderId ? { ...x, status } : x)) };
}

export const farmers: Farmer[] = [
  { id: "f1", name: "Ramesh Reddy", farm: "Green Valley Farm", location: "Hyderabad" },
  { id: "f2", name: "Lakshmi Devi", farm: "Sunrise Orchards", location: "Warangal" },
  { id: "f3", name: "Suresh Kumar", farm: "Krishna Fields", location: "Vijayawada" },
  { id: "f4", name: "Anita Patil", farm: "Deccan Organics", location: "Pune" },
  { id: "f5", name: "Mohan Singh", farm: "Golden Grain Co.", location: "Nizamabad" },
];

const P = (id: string, farmerId: string, name: string, category: string, emoji: string, unit: string, quantity: number, price: number, availableFrom: string, fulfilment: Product["fulfilment"]): Product =>
  ({ id, farmerId, name, category, emoji, unit, quantity, price, availableFrom, fulfilment });

export const seed = (): State => ({
  farmers,
  orders: [],
  products: [
    P("p1", "f1", "Tomatoes", "Vegetables", "🍅", "kg", 120, 28, "2026-10-28", "both"),
    P("p2", "f1", "Spinach", "Vegetables", "🥬", "bunch", 60, 15, "2026-10-29", "pickup"),
    P("p3", "f1", "Green Chillies", "Vegetables", "🌶️", "kg", 40, 60, "2026-10-30", "both"),
    P("p4", "f2", "Mangoes (Banganapalli)", "Fruits", "🥭", "kg", 80, 90, "2026-11-05", "delivery"),
    P("p5", "f2", "Bananas", "Fruits", "🍌", "dozen", 50, 45, "2026-10-29", "both"),
    P("p6", "f2", "Guavas", "Fruits", "🍐", "kg", 35, 50, "2026-11-01", "pickup"),
    P("p7", "f3", "Basmati Rice", "Grains", "🍚", "kg", 500, 85, "2026-10-20", "delivery"),
    P("p8", "f3", "Onions", "Vegetables", "🧅", "kg", 300, 32, "2026-10-25", "both"),
    P("p9", "f3", "Potatoes", "Vegetables", "🥔", "kg", 250, 26, "2026-10-25", "pickup"),
    P("p10", "f4", "Organic Carrots", "Vegetables", "🥕", "kg", 70, 48, "2026-10-31", "both"),
    P("p11", "f4", "Fresh Milk", "Dairy", "🥛", "litre", 100, 58, "2026-10-29", "delivery"),
    P("p12", "f4", "Paneer", "Dairy", "🧀", "kg", 20, 380, "2026-10-29", "pickup"),
    P("p13", "f5", "Wheat", "Grains", "🌾", "quintal", 30, 2400, "2026-10-15", "pickup"),
    P("p14", "f5", "Maize", "Grains", "🌽", "quintal", 45, 2100, "2026-10-22", "both"),
    P("p15", "f5", "Turmeric", "Spices", "🟡", "kg", 90, 140, "2026-11-10", "delivery"),
    P("p16", "f2", "Tomatoes", "Vegetables", "🍅", "kg", 50, 28, "2026-10-28", "both"),
  ],
});
