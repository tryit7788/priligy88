import type { APIRoute } from "astro";
import { getProducts } from "@/lib/payload/products";
import { sorting, defaultSort } from "@/lib/constants";

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const sortSlug = searchParams.get("sort") || "";
    const sortOption = sorting.find((s) => s.slug === sortSlug) || defaultSort;
    const searchQuery = searchParams.get("q") || "";
    const brands = searchParams.getAll("b");
    const category = searchParams.get("c") || "";
    const tag = searchParams.get("t") || "";
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "999999");
    const cursor =
      searchParams.get("cursor") || searchParams.get("page") || "1";

    const query: any = {};
    if (brands.length > 0) query.brands = brands;
    if (category) query.categories = [category];
    if (tag) query.tags = [tag];
    if (minPrice > 0 || maxPrice < 999999)
      query.price = { min: minPrice, max: maxPrice };
    if (searchQuery) query.search = searchQuery;

    const result = await getProducts({
      cursor,
      sortKey: sortOption.sortKey,
      reverse: sortOption.reverse,
      query: Object.keys(query).length > 0 ? query : undefined,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch products",
        products: [],
        pageInfo: { hasNextPage: false, endCursor: null },
        totalPages: 0,
        totalDocs: 0,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
