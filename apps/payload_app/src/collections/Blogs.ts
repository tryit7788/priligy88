import type { CollectionConfig } from 'payload';
import { slugField } from '../utils/slug';

const Blogs: CollectionConfig = {
  slug: 'blogs',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'published'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField("blogs", "title"),
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'excerpt',
      type: 'textarea',
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'blog-categories',
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'blog-tags',
      hasMany: true,
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
  timestamps: true,
};

export default Blogs;
