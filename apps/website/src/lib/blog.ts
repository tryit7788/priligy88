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
    (tag: any) => typeof tag === "number" || 
                 typeof tag === "string" ||
                 (typeof tag === "object" && tag !== null && !tag.name),
  );

  if (!needsPopulation) {
    // Tags are already populated
    return blog;
  }

  // Extract tag IDs (could be numbers, strings, or objects with id property)
  const tagIds = blog.tags
    .map((tag: any) => {
      if (typeof tag === "number" || typeof tag === "string") {
        return tag;
      }
      if (typeof tag === "object" && tag !== null) {
        return tag?.id || tag;
      }
      return null;
    })
    .filter((id: any) => id != null)
    .map((id: any) => String(id)); // Normalize to strings for comparison

  if (tagIds.length === 0) {
    blog.tags = [];
    return blog;
  }

  // Fetch the tag documents
  try {
    // Convert tagIds back to numbers if they're numeric strings (for database queries)
    const numericTagIds = tagIds.map((id: string) => {
      const num = Number(id);
      return isNaN(num) ? id : num;
    });

    const { docs: tagDocs } = await payloadClient.find({
      collection: "blog-tags",
      where: {
        id: { in: numericTagIds },
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
    blogs.docs.map((blog) => populateBlogTags(payloadClient, blog))
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
