import type { APIRoute } from "astro";
import { payload } from "@/lib/payload";

export const GET: APIRoute = async ({ url }) => {
  try {
    const payloadClient = await payload();

    // Parse query parameters
    const searchParams = new URLSearchParams(url.search);
    const where: any = {};

    // Handle isActive filter
    if (searchParams.get("where[isActive][equals]") === "true") {
      where.isActive = { equals: true };
    }

    // Fetch product variants
    const { docs } = await payloadClient.find({
      collection: "product-variants",
      where,
      sort: "name",
    });

    return new Response(JSON.stringify({ docs }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching product variants:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch product variants" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};
