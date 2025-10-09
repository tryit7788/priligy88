import { CollectionConfig } from 'payload';

const HeroSlides: CollectionConfig = {
    slug: 'hero-slides',
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'product', 'enabled'],
    },
    fields: [
        {
            name: 'caption',
            type: 'text',
        },
        {
            name: 'title',
            type: 'text',
            required: true,
        },
        {
            name: 'product',
            type: 'relationship',
            relationTo: 'products',
            hasMany: false,
            required: true,
        },
        {
            name: 'image',
            type: 'upload',
            relationTo: 'media',
            required: true,
        },
        {
            name: 'enabled',
            type: 'checkbox',
            defaultValue: false,
        },
    ],
    timestamps: true,
};

export default HeroSlides;
