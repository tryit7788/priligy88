import type { APIRoute } from "astro";
import { payload } from "@/lib/payload";

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const payloadClient = await payload();
    const data = await request.json();
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: "Mapping ID is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Update variant mapping
    const result = await payloadClient.update({
      collection: "product-variant-mappings",
      id,
      data,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error updating product variant mapping:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update product variant mapping" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const payloadClient = await payload();
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: "Mapping ID is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Attempt to find products referencing this mapping to clean up relation
    const productsWithRef = await payloadClient.find({
      collection: "products",
      where: {
        variantMappings: {
          equals: id,
        },
      },
      limit: 50,
      depth: 0,
    });

    // Delete variant mapping (override access just in case)
    await payloadClient.delete({
      collection: "product-variant-mappings",
      id,
      overrideAccess: true,
    });

    // Remove stale relation references from products and update totalStock
    for (const p of productsWithRef.docs || []) {
      const current = Array.isArray((p as any).variantMappings)
        ? ((p as any).variantMappings as Array<
            string | number | { id: number }
          >)
        : [];
      const filtered = current
        .map((val) =>
          typeof val === "object" && val !== null ? (val as any).id : val,
        )
        .filter((val) => String(val) !== String(id))
        .map((val) => Number(val));

      // Update product with filtered mappings
      await payloadClient.update({
        collection: "products",
        id: p.id,
        data: { variantMappings: filtered } as any,
        overrideAccess: true,
      });

      // Recalculate and update totalStock for this product
      if (filtered.length > 0) {
        // Get remaining mappings for this product to calculate new total stock
        const remainingMappings = await payloadClient.find({
          collection: "product-variant-mappings",
          where: {
            id: { in: filtered },
            isActive: { equals: true },
          },
          limit: 1000,
          depth: 0,
          select: {
            quantity: true,
          },
        });

        const totalStock = remainingMappings.docs.reduce(
          (sum: number, mapping: any) => sum + (mapping.quantity || 0),
          0,
        );

        await payloadClient.update({
          collection: "products",
          id: p.id,
          data: { totalStock },
          overrideAccess: true,
        });
      } else {
        // No mappings left, set totalStock to 0
        await payloadClient.update({
          collection: "products",
          id: p.id,
          data: { totalStock: 0 },
          overrideAccess: true,
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error deleting product variant mapping:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete product variant mapping" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};
