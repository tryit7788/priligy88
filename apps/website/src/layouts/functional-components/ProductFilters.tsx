import { slugify } from "@/lib/utils/textConverter";
import React, { useState } from "react";
import { BsCheckLg } from "react-icons/bs";
import ShowTags from "./product/ShowTags";
import RangeSlider from "./rangeSlider/RangeSlider";
import type { ProductCategory, ProductTag } from "payload_app";

interface FilterCategory {
  name: string;
  slug: string;
  productCount: number;
}

interface FilterVendor {
  vendor: string;
  slug: string;
  productCount: number;
}

const ProductFilters = ({
  categories,
  vendors,
  tags,
  maxPriceData,
}: {
  categories: FilterCategory[];
  vendors: FilterVendor[];
  tags: ProductTag[];
  maxPriceData: { amount: string; currencyCode: string };
}) => {
  const [searchParams, setSearchParams] = useState(
    new URLSearchParams(window.location.search),
  );

  const selectedBrands = searchParams.getAll("b");
  const selectedCategory = searchParams.get("c");

  const updateSearchParams = (newParams: URLSearchParams) => {
    newParams.delete("cursor");
    const newUrl = `/products?${newParams.toString()}`;
    window.history.pushState({}, "", newUrl);
    setSearchParams(newParams);
    window.dispatchEvent(
      new CustomEvent("filterchange", {
        detail: { params: newParams },
      }),
    );
  };

  const handleBrandClick = (slug: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    const currentBrands = newParams.getAll("b");

    if (currentBrands.includes(slug)) {
      newParams.delete("b");
      currentBrands
        .filter((b) => b !== slug)
        .forEach((b) => newParams.append("b", b));
    } else {
      newParams.append("b", slug);
    }
    updateSearchParams(newParams);
  };

  const handleCategoryClick = (slug: string) => {
    const newParams = new URLSearchParams(searchParams.toString());

    if (slug === selectedCategory) {
      newParams.delete("c");
    } else {
      newParams.set("c", slug);
    }
    updateSearchParams(newParams);
  };

  return (
    <div>
      <div>
        <h5 className="mb-2 lg:text-xl">選擇價格範圍</h5>
        <hr className="border-border dark:border-darkmode-border" />
        <div className="pt-4">
          <RangeSlider maxPriceData={maxPriceData} />
        </div>
      </div>

      <div>
        <h5 className="mb-2 mt-4 lg:mt-6 lg:text-xl">產品類別</h5>
        <hr className="border-border dark:border-darkmode-border" />
        <ul className="mt-4 space-y-4">
          {categories.map((category) => (
            <li
              key={category.slug}
              className={`flex items-center justify-between cursor-pointer ${
                selectedCategory === category.slug
                  ? "text-text-dark dark:text-darkmode-text-dark font-semibold"
                  : "text-text-light dark:text-darkmode-text-light"
              }`}
              onClick={() => handleCategoryClick(category.slug)}
            >
              {category.name}
              <span>({category.productCount})</span>
            </li>
          ))}
        </ul>
      </div>

      {vendors && vendors.length > 0 && (
        <div>
          <h5 className="mb-2 mt-8 lg:mt-10 lg:text-xl">品牌</h5>
          <hr className="border-border dark:border-darkmode-border" />
          <ul className="mt-4 space-y-4">
            {vendors.map((vendor) => (
              <li
                key={vendor.slug}
                className="flex items-center justify-between cursor-pointer text-text-light dark:text-darkmode-text-light"
                onClick={() => handleBrandClick(vendor.slug)}
              >
                <span>
                  {vendor.vendor} ({vendor.productCount})
                </span>
                <div className="h-4 w-4 rounded-sm flex items-center justify-center border border-border dark:border-border/40">
                  {selectedBrands.includes(vendor.slug) && (
                    <BsCheckLg size={16} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tags.length > 0 && (
        <div>
          <h5 className="mb-2 mt-8 lg:mt-10 lg:text-xl">Tags</h5>
          <hr className="border-border dark:border-darkmode-border" />
          <div className="mt-4">
            <ShowTags tags={tags} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
