import { slugify } from "@/lib/utils/textConverter";
import React, { useState } from "react";
import { BsCheckLg } from "react-icons/bs";
import ShowTags from "./product/ShowTags";
import RangeSlider from "./rangeSlider/RangeSlider";
import type { ProductCategory, ProductTag } from "payload_app";

// Define clean prop types. Notice we only have one for categories and one for vendors.
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
  // This state management is good, let's keep it.
  const [searchParams, setSearchParams] = useState(
    new URLSearchParams(window.location.search)
  );

  // Read current selections directly from the component's state
  const selectedBrands = searchParams.getAll("b"); // 'b' for brand slug
  const selectedCategory = searchParams.get("c"); // 'c' for category slug

  // This function is the core of our client-side navigation. It's perfect.
  const updateSearchParams = (newParams: URLSearchParams) => {
    // Remove the cursor/page when filters change to start from the first page
    newParams.delete("cursor");
    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    window.history.pushState({}, '', newUrl);
    setSearchParams(newParams);
    // Notify the product view to re-fetch data
    window.dispatchEvent(new CustomEvent('filterchange'));
  };

  // Correctly handle multi-select for brands using their slugs
  const handleBrandClick = (slug: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    const currentBrands = newParams.getAll("b");

    if (currentBrands.includes(slug)) {
      // If the brand is already selected, remove it
      newParams.delete("b"); // Clear all 'b' params first
      currentBrands.filter(b => b !== slug).forEach(b => newParams.append("b", b));
    } else {
      // Otherwise, add it
      newParams.append("b", slug);
    }
    updateSearchParams(newParams);
  };

  // Handle single-select for categories using their slugs
  const handleCategoryClick = (slug: string) => {
    const newParams = new URLSearchParams(searchParams.toString());

    if (slug === selectedCategory) {
      // If the same category is clicked again, deselect it
      newParams.delete("c");
    } else {
      // Otherwise, set it as the selected category
      newParams.set("c", slug);
    }
    updateSearchParams(newParams);
  };

  return (
    <div>
      {/* Price Range Slider - No changes needed here */}
      <div>
        <h5 className="mb-2 lg:text-xl">選擇價格範圍</h5>
        <hr className="border-border dark:border-darkmode-border" />
        <div className="pt-4">
          <RangeSlider maxPriceData={maxPriceData} />
        </div>
      </div>

      {/* Product Categories - Simplified Logic */}
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
              {/* Always display the total count passed in via props */}
              <span>({category.productCount})</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Brands - Simplified Logic */}
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
                  {/* Always display the vendor name and its total count */}
                  {vendor.vendor} ({vendor.productCount})
                </span>
                <div className="h-4 w-4 rounded-sm flex items-center justify-center border border-border dark:border-border/40">
                  {selectedBrands.includes(vendor.slug) && <BsCheckLg size={16} />}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags - No changes needed here */}
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
