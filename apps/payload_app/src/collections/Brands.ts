import { slugField } from '../utils/slug';
import { CollectionConfig } from 'payload';

const Brands: CollectionConfig = {
    slug: 'brands',
    admin: {
        useAsTitle: 'name',
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        slugField("brands", "name")
    ],
};

export default Brands;
