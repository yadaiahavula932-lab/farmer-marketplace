import { describe, it, expect } from "vitest";
import { placeOrder, setStatus, seed } from "./market";

describe("stock limits", () => {
  it("rejects orders above available stock", () => {
    expect(() => placeOrder(seed(), "p12", 21, "b")).toThrow(/Only 20/);
  });
  it("deducts stock when ordering", () => {
    const s = placeOrder(seed(), "p12", 5, "b");
    expect(s.products.find((p) => p.id === "p12")!.quantity).toBe(15);
  });
  it("allows ordering exactly the remaining stock", () => {
    const s = placeOrder(seed(), "p12", 20, "b");
    expect(s.products.find((p) => p.id === "p12")!.quantity).toBe(0);
  });
});

describe("cancellation", () => {
  it("restores stock on cancel", () => {
    let s = placeOrder(seed(), "p12", 5, "b");
    s = setStatus(s, s.orders[0]!.id, "cancelled");
    expect(s.products.find((p) => p.id === "p12")!.quantity).toBe(20);
    expect(s.orders[0]!.status).toBe("cancelled");
  });
  it("cannot cancel a completed order", () => {
    let s = placeOrder(seed(), "p12", 5, "b");
    const id = s.orders[0]!.id;
    s = setStatus(setStatus(setStatus(s, id, "accepted"), id, "ready"), id, "completed");
    expect(() => setStatus(s, id, "cancelled")).toThrow();
  });
});
