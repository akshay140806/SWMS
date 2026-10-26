// Retail/SMB extension copy (Zoho-style IA). Import alongside content/en.js.
const retail = {
  setup: {
    title: 'Set up your store',
    sub: 'Tell us about your business. This takes less than a minute.',
    orgSec: 'Business details',
    fStore: 'Store / Company name',
    fAddr: 'Business address',
    fTz: 'Time zone',
    fCur: 'Currency (e.g. INR)',
    adminSec: 'Owner account',
    fName: 'Full name',
    fEmail: 'Email address',
    fPw: 'Password',
    go: 'Start using WareX →',
    side: 'From day one: add your products, racks and vendors — no demo data, everything you see is yours.'
  },
  nav: {
    home: 'Home',
    items: 'Items',
    itemGroups: 'Item Groups',
    priceLists: 'Price Lists',
    sales: 'Sales',
    customers: 'Customers',
    salesOrders: 'Sales Orders',
    invoices: 'Invoices',
    purchases: 'Purchases',
    vendors: 'Vendors',
    purchaseOrders: 'Purchase Orders'
  },
  customers: {
    title: 'Customers', sub: 'Everyone you sell to.',
    add: '+ New Customer', cols: ['Name', 'Phone', 'Email', 'Address', 'Orders'],
    fName: 'Customer name', fPhone: 'Phone number', fEmail: 'Email', fAddr: 'Delivery address', fGst: 'GSTIN',
    emptyT: 'No customers yet', emptyD: 'Add your first customer to start taking sales orders.', emptyB: '+ Add Customer'
  },
  vendors: {
    title: 'Vendors', sub: 'Everyone you buy stock from.',
    add: '+ New Vendor', cols: ['Name', 'Phone', 'Email', 'Address', 'Purchases'],
    fName: 'Vendor name', fPhone: 'Phone number', fEmail: 'Email', fAddr: 'Address', fGst: 'GSTIN',
    emptyT: 'No vendors yet', emptyD: 'Add a vendor to raise your first purchase order.', emptyB: '+ Add Vendor'
  },
  po: {
    title: 'Purchase Orders', sub: 'Buy stock from vendors and receive it into bins.',
    add: '+ New Purchase Order', cols: ['PO No.', 'Vendor', 'Items', 'Status', 'Created', 'Received'],
    fVendor: 'Vendor', fItems: 'Add items', fRate: 'Rate', fLoc: 'Receive into (optional)', fDate: 'Expected date', fNote: 'Note',
    create: 'Create Purchase Order', receive: 'Receive Stock', receiveAll: 'Receive All',
    statuses: ['Draft', 'Ordered', 'Partially Received', 'Received', 'Cancelled'],
    emptyT: 'No purchase orders yet', emptyD: 'Raise a purchase order to restock from a vendor.', emptyB: '+ New Purchase Order',
    receivedMsg: 'Stock received and added to bins.'
  },
  inv: {
    title: 'Invoices', sub: 'Bill customers for dispatched orders.',
    add: '+ New Invoice', fromOrder: 'New from Sales Order',
    cols: ['Invoice No.', 'Order', 'Customer', 'Total', 'Status', 'Created'],
    fTax: 'Tax % (GST)', create: 'Create Invoice', pay: 'Mark as Paid', print: 'Print Invoice',
    emptyT: 'No invoices yet', emptyD: 'Dispatch a sales order, then raise its invoice here.', emptyB: '+ New Invoice',
    billTo: 'Bill To', from: 'From', invNo: 'Invoice No.', date: 'Date', order: 'Sales Order', sub: 'Subtotal', tax: 'Tax', grand: 'Grand Total'
  },
  catalog: {
    title: 'Catalogue', sub: 'Group items and manage selling prices.',
    groupsTitle: 'Item Groups', groupsSub: 'Group products into families for faster browsing.',
    pricesTitle: 'Price Lists', pricesSub: 'Different selling prices for different customer tiers (Wholesale, Retail, MRP).',
    tabs: ['Item Groups', 'Price Lists'],
    gAdd: '+ New Group', gName: 'Group name', gDesc: 'Description',
    pAdd: '+ New Price List', pName: 'Price list name', pDesc: 'Description (e.g. For B2B buyers)',
    emptyG: 'No item groups yet. Group items like "Beverages" or "Spare Parts".',
    emptyP: 'No price lists yet. Create Wholesale / Retail / MRP lists.',
    configurePrices: 'Set Prices',
    savePrices: 'Save Price Overrides',
    productCol: 'Product',
    standardPriceCol: 'Standard Price',
    customPriceCol: 'Custom Price',
    quickSetup: 'Create Starter Price Lists',
    deleteListConfirm: 'Are you sure you want to delete this price list?',
    deleteGroupConfirm: 'Are you sure you want to delete this item group?',
    addProductsToGroup: '+ Add Products to Group',
    noProductsInGroup: 'No products assigned to this group yet.',
    assignProducts: 'Assign Selected Products',
    removeProductFromGroup: 'Remove from group'
  }
};

export default retail;
