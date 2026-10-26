import { z } from 'zod';

const oid = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'This field is required.'),
    email: z.string().email('Enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters and include a number and a symbol.'),
    confirmPassword: z.string().optional(),
    role: z.enum(['admin', 'warehouse_staff', 'dispatch_staff']).default('warehouse_staff')
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Enter a valid email address.'),
    password: z.string().min(1, 'This field is required.')
  })
});

export const productSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'This field is required.'),
    sku: z.string().min(2, 'This field is required.'),
    barcode: z.string().optional().default(''),
    category: z.string().optional().default('General'),
    unit: z.string().optional().default('pcs'),
    description: z.string().optional().default(''),
    image: z.string().optional().default(''),
    costPrice: z.number().min(0).optional().default(0),
    sellingPrice: z.number().min(0).optional().default(0),
    reorderLevel: z.number().int().min(0).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    group: oid.optional(),
    defaultLocationId: oid.optional()
  })
});

export const stockQtySchema = z.object({
  body: z.object({
    productId: oid.optional(),
    qty: z.number().int().min(1, 'Quantity must be greater than 0.'),
    quantity: z.number().int().min(1).optional(),
    locationId: oid.optional(),
    reference: z.string().max(200).optional().default(''),
    note: z.string().max(500).optional().default(''),
    remark: z.string().max(500).optional().default('')
  }),
  params: z.object({ id: oid }).partial().optional()
});

export const transferSchema = z.object({
  body: z.object({
    productId: oid.optional(),
    qty: z.number().int().min(1, 'Quantity must be greater than 0.'),
    quantity: z.number().int().min(1).optional(),
    fromLocationId: oid.optional(),
    toLocationId: oid,
    note: z.string().max(500).optional().default(''),
    remark: z.string().max(500).optional().default('')
  }),
  params: z.object({ id: oid }).partial().optional()
});

export const damageSchema = z.object({
  body: z.object({
    productId: oid.optional(),
    qty: z.number().int().min(1, 'Quantity must be greater than 0.'),
    quantity: z.number().int().min(1).optional(),
    locationId: oid.optional(),
    reason: z.string().optional().default('Other'),
    note: z.string().max(500).optional().default(''),
    remark: z.string().max(500).optional().default('')
  }),
  params: z.object({ id: oid }).partial().optional()
});

export const locationSchema = z.object({
  body: z.object({
    code: z.string().min(2, 'This field is required.'),
    zone: z.string().optional(),
    rack: z.string().optional(),
    shelf: z.string().optional(),
    capacity: z.number().int().min(1),
    status: z.enum(['available', 'near-full', 'full', 'blocked']).optional()
  })
});

export const orderCreateSchema = z.object({
  body: z.object({
    customerId: oid.optional(),
    customer: oid.optional(),
    customerName: z.string().min(2, 'This field is required.'),
    customerPhone: z.string().optional().default(''),
    deliveryAddress: z.string().optional().default(''),
    instructions: z.string().optional().default(''),
    items: z
      .array(
        z
          .object({ productId: oid.optional(), product: oid.optional(), qty: z.number().int().min(1), quantity: z.number().int().min(1).optional() })
          .refine((it) => it.productId || it.product, { message: 'Product is required.' })
      )
      .min(1, 'Add at least one item.')
  })
});

export const dispatchSchema = z.object({
  body: z.object({
    carrier: z.string().optional().default(''),
    trackingNo: z.string().optional().default(''),
    dispatchNotes: z.string().optional().default('')
  }).partial().optional()
});

export const userCreateSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email('Enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters and include a number and a symbol.'),
    role: z.enum(['admin', 'warehouse_staff', 'dispatch_staff'])
  })
});
