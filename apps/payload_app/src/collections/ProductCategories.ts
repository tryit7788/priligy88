import { slugField } from '../utils/slug';
import { CollectionConfig } from 'payload';

const ProductCategories: CollectionConfig = {
    slug: 'product-categories',
    admin: {
        useAsTitle: 'name',
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        slugField("product-categories", "name"),
        {
            label: "Featured Image",
            name: "featuredImage",
            type: 'upload',
            relationTo: 'media',
            required: true,
            hasMany: false
        },
    ],
};

export default ProductCategories;
