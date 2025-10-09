import type { CollectionConfig } from 'payload';


const BlogTags: CollectionConfig = {
  slug: 'blog-tags',
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
