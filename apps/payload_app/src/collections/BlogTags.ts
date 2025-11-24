import type { CollectionConfig } from 'payload';


const BlogTags: CollectionConfig = {
  slug: 'blog-tags',
  access: {
    read: () => true, // Allow public read access for frontend
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
};

export default BlogTags;
