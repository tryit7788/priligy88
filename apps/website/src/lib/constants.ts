export type SortFilterItem = {
  title: string;
  slug: string;
  sortKey: string;
  reverse: boolean;
};
export type SortKey = "title" | "price" | "createdAt";

export const sorting: SortFilterItem[] = [
  {
    slug: "name-asc",
    title: "Name: A-Z",
    sortKey: "title",
    reverse: false,
  },
  {
    slug: "name-desc",
    title: "Name: Z-A",
    sortKey: "title",
    reverse: true,
  },
  {
    slug: "price-asc",
    title: "Price: Low to high",
    sortKey: "price",
    reverse: false,
  },
  {
    slug: "price-desc",
    title: "Price: High to low",
    sortKey: "price",
    reverse: true,
  },
  {
    slug: "latest",
    title: "Latest",
    sortKey: "createdAt",
    reverse: true,
  },
  {
    slug: "oldest",
    title: "Oldest",
    sortKey: "createdAt",
    reverse: false,
  },
];

export const defaultSort = sorting[0];
export const TAGS = {
  collections: "collections",
  products: "products",
  cart: "cart",
};

export const HIDDEN_PRODUCT_TAG = "nextjs-frontend-hidden";
export const DEFAULT_OPTION = "Default Title";
export const SHOPIFY_GRAPHQL_API_ENDPOINT = "/api/2023-01/graphql.json";
