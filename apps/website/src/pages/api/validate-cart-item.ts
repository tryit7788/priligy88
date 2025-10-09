import type { APIRoute } from "astro";
import { payload } from "@/lib/payload";
import { compareVariantIds, normalizeVariantId } from "@/lib/utils/variantId";
import { getProductPrice, isValidPrice } from "@/lib/utils/pricing";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);
    const productId = body?.productId as number | string | undefined;
    const variantId = body?.variantId as string | number | undefined;

    if (!productId) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing productId" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const payloadClient = await payload();
    const result = await payloadClient.find({
      collection: "products",
      where: {
        and: [{ id: { equals: productId } }, { published: { equals: true } }],
      },
      depth: 2,
      limit: 1,
    });

    const product = result?.docs?.[0] as any;
    if (!product) {
      return new Response(
        JSON.stringify({ ok: false, error: "Product not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const responsePayload: any = {
      ok: true,
      product: {
        id: product.id,
        title: product.title,
        slug: product.slug,
      },
    };

    if (variantId) {
      // Find the variant mapping that corresponds to the variantId
      // The variantId could be either a mapping ID or actual variant ID
      const variantMapping = product.variantMappings?.find((mapping: any) => {
        const mappingId = String(mapping.id);
        const actualVariantId = String(mapping.variant?.id);
        const searchId = String(variantId);

        return (
          mappingId === searchId ||
          actualVariantId === searchId ||
          compareVariantIds(mapping.variant?.id, variantId) ||
          compareVariantIds(mapping.id, variantId)
        );
      });

      if (!variantMapping) {
        return new Response(
          JSON.stringify({ ok: false, error: "Variant not found for product" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const variant = variantMapping.variant;
      const available =
        Boolean(variantMapping.isActive) &&
        Boolean(variantMapping.quantity > 0);

      if (!available) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "Variant unavailable or out of stock",
          }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        );
      }

      const variantPrice = Number(
        variantMapping.priceOverride || variant?.price || 0,
      );
      if (!isValidPrice(variantPrice)) {
        return new Response(
          JSON.stringify({ ok: false, error: "Invalid variant price" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      responsePayload.price = variantPrice;
      responsePayload.variant = {
        id: normalizeVariantId(variant?.id || variantMapping.id),
        name: String(variant?.name || ""),
        sku: variant?.sku || undefined,
        price: variantPrice,
        stock: Number(variantMapping.quantity || 0),
      };
      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // No variant specified; validate product-level availability
    const totalStock = Number(product.totalStock || 0);
    const available = Boolean(product.published) && totalStock > 0;
    if (!available) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Product unavailable or out of stock",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }

    const price = getProductPrice(product);
    if (!isValidPrice(price)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid product price" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    responsePayload.price = price;
    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: "Unexpected server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
