import { lazy, Suspense, useState } from "react";
import type { Product } from "payload_app";
import { useClientFiltering } from "@/lib/hooks/useClientFiltering";
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

  // Use client-side filtering only if explicitly enabled
  const { products, loading } = useClientSideFiltering
    ? useClientFiltering(initialProducts)
    : { products: initialProducts, loading: false };

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
