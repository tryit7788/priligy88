import type { Blog } from "payload_app";
import { payload } from "@/lib/payload";

// Helper function to populate blog tags if they're not already populated
export async function populateBlogTags(
  payloadClient: any,
  blog: any,
): Promise<any> {
  if (!blog.tags || !Array.isArray(blog.tags)) {
    return blog;
  }

  // Check if tags are already populated (objects with name) or just IDs (numbers)
  const needsPopulation = blog.tags.some(
    (tag: any) =>
      typeof tag === "number" ||
      typeof tag === "string" ||
      (typeof tag === "object" && tag !== null && !tag.name),
  );

  if (!needsPopulation) {
    // Tags are already populated
    return blog;
  }

  // Extract tag IDs (could be numbers, strings, ObjectIds, Buffers, or objects with id property)
  const tagIds = blog.tags
    .map((tag: any) => {
      if (typeof tag === "number") {
        return tag;
      }
      if (typeof tag === "string") {
        // If it's already a string, check if it's a valid ObjectId hex string
        return tag;
      }
      if (typeof tag === "object" && tag !== null) {
        // Handle ObjectId or Buffer (MongoDB)
        if (Buffer.isBuffer(tag)) {
          // Convert Buffer to hex string for MongoDB ObjectId
          return tag.toString("hex");
        }
        // Check if it's an ObjectId with toString method
        if (
          tag.toString &&
          typeof tag.toString === "function" &&
          tag._bsontype === "ObjectId"
        ) {
          return tag.toString();
        }
        // If object has id property, extract it
        if (tag.id) {
          const id = tag.id;
          // Handle nested ObjectId/Buffer
          if (Buffer.isBuffer(id)) {
            return id.toString("hex");
          }
          if (
            id.toString &&
            typeof id.toString === "function" &&
            id._bsontype === "ObjectId"
          ) {
            return id.toString();
          }
          return id;
        }
        // If the object itself might be an ObjectId
        if (tag.toString && typeof tag.toString === "function") {
          const str = tag.toString();
          // Check if it looks like an ObjectId (24 char hex string)
          if (/^[0-9a-fA-F]{24}$/.test(str)) {
            return str;
          }
        }
        return tag;
      }
      return null;
    })
    .filter((id: any) => id != null);

  if (tagIds.length === 0) {
    blog.tags = [];
    return blog;
  }

  // Fetch the tag documents
  try {
    // For MongoDB, use the IDs as-is (they're already hex strings if needed)
    // For PostgreSQL, convert numeric strings to numbers
    // Payload CMS will handle the conversion based on the database adapter
    const { docs: tagDocs } = await payloadClient.find({
      collection: "blog-tags",
      where: {
        id: { in: tagIds },
      },
      limit: tagIds.length,
      overrideAccess: true, // Bypass access controls since this is server-side
    });

    if (tagDocs.length === 0) {
      console.warn(
        `No tags found for IDs: ${tagIds.join(", ")} for blog ${blog.id || blog.title}`,
      );
      blog.tags = [];
      return blog;
    }

    // Replace tags with populated objects
    blog.tags = tagDocs;
    console.log(
      `Successfully populated ${tagDocs.length} tags for blog ${blog.id || blog.title}`,
    );
  } catch (error) {
    console.error(
      `Error populating tags for blog ${blog.id || blog.title}:`,
      error,
    );
    console.error("Tag IDs that failed:", tagIds);
    // Clear tags if population fails to avoid showing invalid data
    blog.tags = [];
  }

  return blog;
}

export const getBlogs = async () => {
  const payloadClient = await payload();
  const blogs = await payloadClient.find({
    collection: "blogs",
    limit: 10,
    sort: "-publishedDate",
    depth: 2,
  });

  // Populate tags for all blogs
  const blogsWithTags = await Promise.all(
    blogs.docs.map((blog) => populateBlogTags(payloadClient, blog)),
  );

  return {
    ...blogs,
    docs: blogsWithTags,
  };
};

export const getBlog = async (slug: string) => {
  const payloadClient = await payload();
  const result = await payloadClient.find({
    collection: "blogs",
    where: {
      slug: {
        equals: slug,
      },
    },
    depth: 2,
  });

  if (result.docs.length === 0) {
    return result;
  }

  // Populate tags for the blog
  const blogWithTags = await populateBlogTags(payloadClient, result.docs[0]);

  return {
    ...result,
    docs: [blogWithTags],
  };
};

export const getAllBlogs = async (): Promise<Blog[]> => {
  const payloadClient = await payload();

  try {
    const { docs } = await payloadClient.find({
      collection: "blogs",
      where: {
        published: {
          equals: true,
        },
      },
      limit: 1000,
      sort: "-updatedAt",
    });

    return docs as Blog[];
  } catch (error) {
    console.error("Error fetching blogs for sitemap:", error);
    return [];
  }
};
