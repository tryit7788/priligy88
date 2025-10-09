import { slugify } from "@/lib/utils/textConverter";
import type { ProductTag } from "payload_app";
import React, { useState } from "react";

const ShowTags = ({ tags }:{tags: ProductTag[]}) => {
  const [searchParams, setSearchParams] = useState(
    new URLSearchParams(window.location.search)
  );
  const selectedTag = searchParams.get("t");

  const updateSearchParams = (newParams: URLSearchParams) => {
    const newParamsString = newParams.toString();
    const newURL = newParamsString
      ? `/products?${newParamsString}`
      : "/products";

    window.location.href = newURL.toString();
    setSearchParams(newParams);
  };

  const handleTagClick = (name: string) => {
    const newParams = new URLSearchParams(searchParams.toString());

    if (name === selectedTag) {
      newParams.delete("t");
    } else {
      newParams.set("t", name);
    }

    updateSearchParams(newParams);
  };

  return (
    <div className="flex flex-wrap gap-3">
      {tags.map((tag) => (
        <button
          key={tag.id}
          className={`cursor-pointer px-2 py-1 rounded-md border border-border dark:border-darkmode-border text-text-light dark:text-darkmode-text-light ${(selectedTag === tag.name) &&
            "bg-light dark:bg-dark"
            }`}
          onClick={() => handleTagClick(tag.slug!)}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
};

export default ShowTags;
