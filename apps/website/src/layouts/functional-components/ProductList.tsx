import config from "@/config/config.json";
import type { Product } from "payload_app";
import React from "react";
import { AddToCart } from "./cart/AddToCart";
import { generatPayloadImageUrl } from "@/lib/utils";

const ProductList = ({
  products,
  loading,
}: {
  products: Product[];
  loading: boolean;
}) => {
  const { currencySymbol } = config.shopify;
  const searchValue = new URLSearchParams(window.location.search).get("q");

  const resultsText = products.length > 1 ? "results" : "result";

  return (
    <div className="row mx-auto px-4">
      {searchValue ? (
        <p className="mb-4">
          {products.length === 0
            ? "There are no products that match "
            : `Showing ${products.length} ${resultsText} for `}
          <span className="font-bold text-dark dark:text-darkmode-text-dark">
            &quot;{searchValue}&quot;
          </span>
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

      <div className="space-y-10">
        {products?.map((product: Product) => {
          const {
            id,
            title,
            slug,
            featuredImage,
            originalPrice,
            discountedPrice,
            description,
          } = product;

          return (
            <div className="col-12" key={id}>
              <div className="row">
                <div className="col-4">
                  <img
                    src={
                      typeof featuredImage !== "number"
                        ? generatPayloadImageUrl(featuredImage?.url)
                        : "/images/product_image404.jpg"
                    }
                    width={312}
                    height={269}
                    alt={
                      typeof featuredImage !== "number"
                        ? featuredImage?.alt || title
                        : title
                    }
                    className="w-[312px] h-[150px] md:h-[269px] object-cover border border-border dark:border-darkmode-border rounded-md"
                  />
                </div>

                <div className="col-8 py-3 max-md:pt-4">
                  <h2 className="font-bold md:font-normal h4">
                    <a href={`/products/${slug}`}>{title}</a>
                  </h2>

                  <div className="flex items-center gap-x-2 mt-2">
                    <span className="text-text-light dark:text-darkmode-text-light text-xs md:text-lg font-bold">
                      {currencySymbol} {originalPrice}
                    </span>
                    {discountedPrice && discountedPrice < originalPrice && (
                      <s className="text-text-light dark:text-darkmode-text-light text-xs md:text-base font-medium">
                        {currencySymbol} {originalPrice}
                      </s>
                    )}
                  </div>

                  <p className="max-md:text-xs text-text-light dark:text-darkmode-text-light my-4 md:mb-8 line-clamp-1 md:line-clamp-3">
                    {typeof description === "string"
                      ? description
                      : "Product description"}
                  </p>
                  <AddToCart
                    product={product}
                    stylesClass="btn btn-outline-primary max-md:btn-sm drop-shadow-md"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="text-center pt-10 pb-4 w-full">
          <div className="flex justify-center">
            <span className="animate-pulse">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
