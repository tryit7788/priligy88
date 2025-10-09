import type { APIRoute } from "astro";
import { payload } from "@/lib/payload";

export const GET: APIRoute = async ({ url }) => {
  try {
    const payloadClient = await payload();

    // Parse query parameters
    const searchParams = new URLSearchParams(url.search);
    const where: any = {};

    // Handle product filter
    const productFilter = searchParams.get("where[product][equals]");
    if (productFilter) {
      where.product = { equals: productFilter };
    }

    // Fetch product variant mappings
    const { docs } = await payloadClient.find({
      collection: "product-variant-mappings",
      where,
      depth: 2, // Include variant details
      sort: "createdAt",
    });

    return new Response(JSON.stringify({ docs }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching product variant mappings:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch product variant mappings" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const payloadClient = await payload();
    const data = await request.json();

    // Create new variant mapping
    const result = await payloadClient.create({
      collection: "product-variant-mappings",
      data,
    });

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error creating product variant mapping:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create product variant mapping" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};
