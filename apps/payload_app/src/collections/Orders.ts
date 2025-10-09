import { CollectionConfig } from 'payload'

const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'status', 'totalAmount', 'createdAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
    },
    {
      name: 'address',
      type: 'textarea',
      required: true,
    },
    {
      name: 'cartItems',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'priceAtPurchase',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'variant',
          type: 'group',
          required: false,
          fields: [
            {
              name: 'id',
              type: 'text',
              required: false, // Make optional since variant group itself is optional
            },
            {
              name: 'name',
              type: 'text',
              required: false, // Make optional since variant group itself is optional
            },
            {
              name: 'sku',
              type: 'text',
              required: false,
            },
          ],
        },
      ],
    },
    {
      name: 'totalAmount',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Total order amount calculated from cart items',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'orderDate',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'note',
      label: 'Order Notes (optional)',
      type: 'textarea',
      required: false,
    },
  ],
  timestamps: true,
}

export default Orders
