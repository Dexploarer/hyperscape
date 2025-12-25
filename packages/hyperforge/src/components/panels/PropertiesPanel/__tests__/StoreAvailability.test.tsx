import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StoreAvailability } from "../StoreAvailability";
import type { ItemStoreInfo } from "../types";

describe("StoreAvailability", () => {
  it("returns null when storeInfo is empty", () => {
    const { container } = render(<StoreAvailability storeInfo={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders store information", () => {
    const storeInfo: ItemStoreInfo[] = [
      {
        storeId: "general_store",
        storeName: "General Store",
        price: 100,
        stock: 50,
      },
    ];
    
    render(<StoreAvailability storeInfo={storeInfo} />);
    expect(screen.getByText("Available in Stores")).toBeTruthy();
    expect(screen.getByText("General Store")).toBeTruthy();
    expect(screen.getByText("100 gp")).toBeTruthy();
  });

  it("displays unlimited stock correctly", () => {
    const storeInfo: ItemStoreInfo[] = [
      {
        storeId: "general_store",
        storeName: "General Store",
        price: 100,
        stock: "unlimited",
      },
    ];
    
    render(<StoreAvailability storeInfo={storeInfo} />);
    expect(screen.getByText("Unlimited stock")).toBeTruthy();
  });

  it("displays buyback rate when present", () => {
    const storeInfo: ItemStoreInfo[] = [
      {
        storeId: "general_store",
        storeName: "General Store",
        price: 100,
        stock: 50,
        buybackRate: 0.5,
      },
    ];
    
    render(<StoreAvailability storeInfo={storeInfo} />);
    expect(screen.getByText("Buyback: 50%")).toBeTruthy();
  });

  it("displays multiple stores", () => {
    const storeInfo: ItemStoreInfo[] = [
      {
        storeId: "store1",
        storeName: "Store 1",
        price: 100,
        stock: 50,
      },
      {
        storeId: "store2",
        storeName: "Store 2",
        price: 150,
        stock: 30,
      },
    ];
    
    render(<StoreAvailability storeInfo={storeInfo} />);
    expect(screen.getByText("Store 1")).toBeTruthy();
    expect(screen.getByText("Store 2")).toBeTruthy();
    expect(screen.getByText("2 stores")).toBeTruthy();
  });
});
