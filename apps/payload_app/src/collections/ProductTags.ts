import { slugField } from '../utils/slug';
import { CollectionConfig } from 'payload';

const ProductTags: CollectionConfig = {
    slug: 'product-tags',
    admin: {
        useAsTitle: 'name',
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        slugField("product-tags", "name")
    ],
};

export default ProductTags;
