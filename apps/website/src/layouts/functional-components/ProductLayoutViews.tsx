import { lazy, Suspense, useState, useEffect } from "react";
import type { Product } from "payload_app";
import React from "react";
import SkeletonCards from "./loadings/skeleton/SkeletonCards";
import { useStore } from "@nanostores/react";
import { layoutView } from "@/cartStore";

const ProductGrid = lazy(() => import("./ProductGrid"));
const ProductList = lazy(() => import("./ProductList"));

const ProductLayoutViews = ({
  initialProducts,
  useClientSideFiltering = false,
}: {
  initialProducts: Product[];
  useClientSideFiltering?: boolean;
}) => {
  const layout = useStore(layoutView);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleFilterChange = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(window.location.search);
        const response = await fetch(`/api/products?${params.toString()}`);
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error("Error fetching filtered products:", error);
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener("filterchange", handleFilterChange);
    return () => window.removeEventListener("filterchange", handleFilterChange);
  }, []);

  return (
    <div className="col-12 lg:col-9">
      <Suspense fallback={<SkeletonCards />}>
        {layout == "card" ? (
          <ProductGrid products={products} loading={loading} />
        ) : (
          <ProductList products={products} loading={loading} />
        )}
      </Suspense>
    </div>
  );
};

export default ProductLayoutViews;
