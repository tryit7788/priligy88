import type { CollectionConfig } from 'payload';
import { slugField } from '../utils/slug';


const BlogCategories: CollectionConfig = {
  slug: 'blog-categories',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    slugField("blog-categories", "name")
  ],
};

export default BlogCategories;
