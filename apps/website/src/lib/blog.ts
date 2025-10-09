import { payload } from "@/lib/payload";

export const getBlogs = async () => {
  const payloadClient = await payload();
  const blogs = await payloadClient.find({
    collection: "blogs",
    limit: 10,
    sort: "-publishedDate",
  });
  return blogs;
};

export const getBlog = async (slug: string) => {
  const payloadClient = await payload();
  const blog = await payloadClient.find({
    collection: "blogs",
    where: {
      slug: {
        equals: slug,
      },
    },
  });
  return blog;
};
