import { useEffect } from "react";
import type { Product } from "payload_app";
import type { PageInfo } from "@/lib/payload/products";

export function useFilterUpdate(
  setProducts: (products: Product[]) => void,
  setPageInfo: (pageInfo: PageInfo) => void,
  setLoading: (loading: boolean) => void,
  searchValue: string | null,
) {
  useEffect(() => {
    const handleFilterChange = async (event: CustomEvent) => {
      const params = event.detail.params as URLSearchParams;
      setLoading(true);

      try {
        const queryParams = new URLSearchParams(params);
        queryParams.set("cursor", ""); // Reset pagination when filter changes

        const response = await fetch(
          `/api/products.json?${queryParams.toString()}`,
        );
        if (!response.ok) throw new Error("Failed to fetch");

        const { products, pageInfo } = await response.json();
        setProducts(products);
        setPageInfo(pageInfo);
      } catch (error) {
        console.error("Error updating products:", error);
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener(
      "filterchange",
      handleFilterChange as unknown as EventListener,
    );
    return () => {
      window.removeEventListener(
        "filterchange",
        handleFilterChange as unknown as EventListener,
      );
    };
  }, [setProducts, setPageInfo, setLoading, searchValue]);
}
