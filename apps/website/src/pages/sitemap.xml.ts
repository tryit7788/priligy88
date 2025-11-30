import type { APIRoute } from "astro";
import { getAllProducts } from "@/lib/payload/products";
import { payload } from "@/lib/payload";
import config from "@/config/config.json";

export const prerender = false; // SSR mode

export const GET: APIRoute = async () => {
  try {
    const baseUrl = config.site.base_url.replace(/\/$/, "");
    const xml = await generateSitemap(baseUrl);

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new Response("Error generating sitemap", { status: 500 });
  }
};

async function generateSitemap(baseUrl: string): Promise<string> {
  const payloadClient = await payload();

  // Fetch all published products
  let products: any[] = [];
  try {
    products = await getAllProducts();
    console.log(`Found ${products.length} products for sitemap`);
  } catch (error) {
    console.error("Error fetching products for sitemap:", error);
  }

  // Fetch all published blogs
  let blogs: any[] = [];
  try {
    const blogsResult = await payloadClient.find({
      collection: "blogs",
      where: {
        published: { equals: true },
      },
      limit: 1000, // Adjust if you have more blogs
      sort: "-createdAt",
    });
    blogs = blogsResult.docs;
    console.log(`Found ${blogs.length} blogs for sitemap`);

    // Handle pagination if there are more than 1000 blogs
    if (blogsResult.totalPages > 1) {
      for (let page = 2; page <= blogsResult.totalPages; page++) {
        const nextPage = await payloadClient.find({
          collection: "blogs",
          where: {
            published: { equals: true },
          },
          limit: 1000,
          page: page,
          sort: "-createdAt",
        });
        blogs.push(...nextPage.docs);
      }
    }
  } catch (error) {
    console.error("Error fetching blogs for sitemap:", error);
  }

  // Static pages that should be in sitemap
  const staticPages = [
    { url: "", priority: "1.0", changefreq: "daily" },
    { url: "/about", priority: "0.8", changefreq: "monthly" },
    { url: "/blog", priority: "0.9", changefreq: "daily" },
    { url: "/products", priority: "0.9", changefreq: "daily" },
    { url: "/contact", priority: "0.7", changefreq: "monthly" },
    { url: "/privacy-policy", priority: "0.5", changefreq: "yearly" },
    { url: "/terms-services", priority: "0.5", changefreq: "yearly" },
    { url: "/checkout", priority: "0.6", changefreq: "monthly" },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add static pages
  staticPages.forEach(({ url, priority, changefreq }) => {
    xml += `
  <url>
    <loc>${baseUrl}${url}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

  // Add product pages
  products.forEach((product: any) => {
    if (product.slug) {
      const lastmod = product.updatedAt || product.createdAt;
      xml += `
  <url>
    <loc>${baseUrl}/products/${product.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${
      lastmod
        ? `
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>`
        : ""
    }
  </url>`;
    }
  });

  // Add blog post pages
  blogs.forEach((blog: any) => {
    if (blog.slug) {
      const lastmod = blog.updatedAt || blog.publishedDate || blog.createdAt;
      xml += `
  <url>
    <loc>${baseUrl}/blog/${blog.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>${
      lastmod
        ? `
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>`
        : ""
    }
  </url>`;
    }
  });

  xml += `
</urlset>`;

  return xml;
}
