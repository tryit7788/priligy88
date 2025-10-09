import config from "@/config/config.json";
import React from "react";
import { BiLoaderAlt } from "react-icons/bi";
import { AddToCart } from "./cart/AddToCart";
import type { Product } from "payload_app";
import { generatPayloadImageUrl } from "@/lib/utils";

interface ProductComponentProps {
  products: Product[];
  loading: boolean;
}

const ProductGrid = ({
  products,
  loading
}: ProductComponentProps) => {
  const { currencySymbol } = config.shopify;
  const searchValue = new URLSearchParams(window.location.search).get('q');

  const resultsText = products.length > 1 ? "results" : "result";


  return (
    <div className="px-4">
      {searchValue ? (
        <p className="mb-4">
          {products.length === 0
            ? "There are no products that match "
            : `Showing ${products.length} ${resultsText} for `}
          <span className="font-bold text-dark dark:text-darkmode-text-dark">&quot;{searchValue}&quot;</span>
        </p>
      ) : null}

      {products?.length === 0 && (
        <div className="mx-auto pt-5 text-center">
          <img
            className="mx-auto mb-6"
            src="/images/no-search-found.png"
            alt="no-search-found"
            width={211}
            height={184}
          />
          <h1 className="h2 mb-4">No Product Found!</h1>
          <p>
            We couldn&apos;t find what you filtered for. Try filtering again.
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="text-center group relative"
          >
            <div className="md:relative overflow-hidden">
              <img
                src={
                  generatPayloadImageUrl(typeof product.featuredImage !== "number" 
                    ? product.featuredImage?.url 
                    : undefined) || "/images/product_image404.jpg"
                }
                width={312}
                height={269}
                alt={typeof product.featuredImage !== "number" 
                  ? product.featuredImage?.alt 
                  : product.title}
                className="w-full h-[200px] sm:w-[312px] md:h-[269px] object-cover rounded-md border border-border mx-auto"
              />

              <AddToCart
                product={product}
                stylesClass="btn btn-primary max-md:btn-sm z-10 absolute bottom-24 md:bottom-0 left-1/2 transform -translate-x-1/2 md:translate-y-full md:group-hover:-translate-y-6 duration-300 ease-in-out whitespace-nowrap drop-shadow-md"
              />
            </div>
            <div className="py-2 md:py-4 text-center z-20">
              <h2 className="font-medium text-base md:text-xl">
                <a
                  className="after:absolute after:inset-0"
                  href={`/products/${product.slug}`}
                >
                  {product.title}                             
                </a>
              </h2>
              <div className="flex flex-wrap justify-center items-center gap-x-2 mt-2 md:mt-4">
                <span className="text-base md:text-xl font-bold text-text-dark dark:text-darkmode-text-dark">
                  {currencySymbol} {product.discountedPrice ? product.discountedPrice : product.originalPrice}
                </span>
                {product.discountedPrice && (
                  <s className="text-text-light dark:text-darkmode-text-light text-xs md:text-base font-medium">
                    {currencySymbol} {product.originalPrice}
                  </s>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="text-center pt-10 pb-4 flex justify-center">
          <BiLoaderAlt className="animate-spin" size={30} />
        </div>
      )}
    </div>
  );
};

export default ProductGrid;