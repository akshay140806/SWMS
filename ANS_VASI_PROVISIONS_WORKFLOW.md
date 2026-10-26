# ANS Vasi Provisions — Step-by-Step Store Management Guide

> **Store:** ANS Vasi Provisions  
> **Type:** Grocery, Provisions, Dairy & FMCG  
> **System:** Smart Warehouse Management System (Smart WMS)  
> **Access URL:** [http://localhost:5173](http://localhost:5173)

---

## 📌 Executive Summary & Architecture Flow

The system manages inventory using an end-to-end lifecycle:

```
[ Vendors / Mills ] ──► [ Purchase Orders / Inward ] ──► [ Physical Shelves & Bins ]
                                                                   │
                                                ┌──────────────────┴──────────────────┐
                                                ▼                                     ▼
                                      [ Customer Orders ]                   [ Damaged / Expired ]
                                       (Reserved Stock)                      (Quarantined Stock)
                                                │                                     │
                                                ▼                                     ▼
                                      [ Picking & Dispatch ]                [ Outward Write-off ]
                                                │                                     │
                                                └──────────────────┬──────────────────┘
                                                                   ▼
                                                       STOCK PERMANENTLY CLEARED
```

### The Core Availability Formula
$$\mathbf{Available\ Stock} = \mathbf{Total\ Stock} - \mathbf{Damaged\ Stock} - \mathbf{Reserved\ Stock}$$

* **Reserved Stock:** Stock promised to pending customer orders. Immediately removed from available count to avoid overselling.
* **Stock Cleared:** When an order is **Dispatched**, the reservation is cleared and the physical inventory count is permanently deducted from that shelf/bin.

---

## 🚀 Step 1: Initial Store Setup (`/settings`)

Before adding products, make sure your store identity and operational rules are configured:

1. Click **Settings** in the left sidebar menu (or navigate to [http://localhost:5173/settings](http://localhost:5173/settings)).
2. Configure the following fields:
   * **Store / Company name:** `ANS Vasi Provisions`
   * **Business address:** `No. 12, Main Bazaar Street, Anna Nagar, Chennai - 600040` (or your store address)
   * **Time zone:** `Asia/Kolkata`
   * **Currency:** `INR`
   * **Default Reorder Level:** `10` (system alerts you when any item falls below this count)
   * **Low Stock Threshold:** `5` (triggers high-priority notification badges)
   * **Allow Negative Stock:** `Off` (prevents overselling items you don't physically have)
3. **Save:** Press **Enter** on your keyboard or click the blue **Save Changes** button at the bottom of the page.

---

## 🏷️ Step 2: Set Up Store Shelves & Bins (`/locations`)

Provision stores need designated zones so staff know exactly where milk, heavy grains, and dry spices are stored.

1. Go to **Locations** (`/locations`) $\rightarrow$ Click **+ New Location**.
2. Create your primary storage locations:

| Location Code | Zone | Rack | Shelf / Bin | Type / Usage | Max Capacity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`COLD-01`** | `COLD` | `R01` | `FRIDGE-01` | Milk pouches, Curd, Butter, Paneer | 200 pkts |
| **`GRAIN-01`** | `GRAIN` | `P01` | `PALLET-01` | Ponni Rice 25kg, Sona Masoori, Wheat bags | 80 bags |
| **`GRAIN-02`** | `GRAIN` | `P02` | `PALLET-02` | Basmati Rice, Atta bags, Maida 10kg | 80 bags |
| **`OIL-01`** | `DRY` | `R01` | `SHELF-01` | Sunflower Oil cans, Gingelly Oil, Ghee jars | 150 cans |
| **`DAL-01`** | `DRY` | `R02` | `SHELF-01` | Toor Dal, Moong Dal, Chana Dal 1kg/5kg packs | 250 pkts |
| **`SPICE-01`** | `DRY` | `R03` | `SHELF-01` | Mustard, Cumin, Pepper, Chilli powder packs | 300 pkts |

> 💡 **Tip:** Each location automatically generates a printable QR Code under the **QR Code** button. You can stick these labels directly onto your physical racks or milk refrigerators.

---

## 📦 Step 3: Define Item Groups & Add Products (`/groups` & `/products`)

### Part A: Create Item Groups (`/groups`)
1. Go to **Items** $\rightarrow$ **Item Groups** (`/groups`).
2. Click **+ New Group** and create your standard categories:
   * `Dairy & Perishables` 
   * `Grains & Rice`
   * `Cooking Oils & Ghee`
   * `Pulses & Dals`
   * `Spices & Condiments`

---

### Part B: Save Your Products (`/products`)
1. Go to **Products** (`/products`) $\rightarrow$ Click **+ New Product** (top-right blue button).
2. Enter the product details:

#### Example 1: Milk (Perishable / High Turnover)
* **Product Name:** `Aavin Green Magic Milk 500ml`
* **SKU:** `DAIRY-MILK-500`
* **Barcode:** `890123450011` *(optional, for barcode scanners)*
* **Category:** `Dairy & Perishables`
* **Unit:** `pcs` (or `pkt`)
* **Cost Price (Purchase):** `₹22.00`
* **Selling Price (MRP):** `₹25.00`
* **Opening Stock:** `60` *(Initial morning stock)*
* **Storage Location:** Select **`COLD-01`** *(Required so the stock is assigned to the fridge)*
* **Reorder Level:** `20` *(Alerts you when crates are running empty)*
* Click **Save Product**.

#### Example 2: Rice (Bulk Storage)
* **Product Name:** `Ponni Boiled Rice 25kg Bag`
* **SKU:** `GRAIN-PONNI-25`
* **Category:** `Grains & Rice`
* **Unit:** `bag`
* **Cost Price:** `₹1,150.00`
* **Selling Price:** `₹1,350.00`
* **Opening Stock:** `30`
* **Storage Location:** Select **`GRAIN-01`**
* **Reorder Level:** `5`
* Click **Save Product**.

#### Example 3: Cooking Oil
* **Product Name:** `Gold Winner Sunflower Oil 1L Pouch`
* **SKU:** `OIL-SUN-1L`
* **Category:** `Cooking Oils & Ghee`
* **Unit:** `pkt`
* **Cost Price:** `₹118.00`
* **Selling Price:** `₹130.00`
* **Opening Stock:** `48`
* **Storage Location:** Select **`OIL-01`**
* **Reorder Level:** `12`
* Click **Save Product**.

---

## 🚛 Step 4: Bringing In New Stock (Restocking)

Whenever new shipments arrive from farmers, mills, or distributors, record them using one of two methods:

### Method 1: Daily Fast Stock Inward (`/stock`)
*Ideal for daily morning milk crate deliveries or emergency local purchases.*
1. Go to **Stock Adjustments** (`/stock`).
2. Select **Action:** `Inward`.
3. Choose **Product:** `Aavin Green Magic Milk 500ml`.
4. Choose **Location:** `COLD-01`.
5. Enter **Quantity:** `40` (e.g. 2 crates of 20 pouches).
6. Enter **Reference / Reason:** `Morning delivery from Aavin distributor`.
7. Click **Apply Adjustment**.  
   *Result:* Stock increases immediately in `COLD-01` and appears in the `/movements` audit log.

### Method 2: Wholesale Purchase Order (`/vendors` & `/purchases`)
*Ideal for bulk rice mills, oil distributors, and FMCG agencies.*
1. **Add Vendor (`/vendors`):**
   * Name: `Sri Lakshmi Modern Rice Mill`
   * Phone: `9876543210`
   * Address: `Trichy Road, Thanjavur` 
2. **Raise PO (`/purchases`):**
   * Click **+ New Purchase Order**.
   * Select Vendor: `Sri Lakshmi Modern Rice Mill`.
   * Add Items: `Ponni Boiled Rice 25kg Bag` $\times$ `50 bags` at `₹1,150.00`.
   * Expected Delivery Date: select date $\rightarrow$ Click **Create Purchase Order**.
3. **Receive Stock when the truck unloads:**
   * Open the PO $\rightarrow$ Click **Receive Stock**.
   * Select destination rack: `GRAIN-01`.
   * Enter quantity received (`50`).
   * Click **Confirm Receipt**.  
   *Result:* Physical inventory in `GRAIN-01` increments by 50 bags atomically.

---

## 🛒 Step 5: Selling & Clearing Stock (Outward Flow)

Stock is cleared through the sales, picking, and dispatch workflow.

### 1. Register Customers (`/customers`)
* Add regular customers, restaurants, or local delivery accounts:
  * Customer Name: `Saravana Hotel & Mess`
  * Phone: `9840123456`
  * Delivery Address: `Shop 4, Market Road, Anna Nagar`

### 2. Create Sales Order (`/orders`)
1. Go to **Sales Orders** (`/orders`) $\rightarrow$ Click **+ New Sales Order**.
2. Select Customer: `Saravana Hotel & Mess`.
3. Add Line Items:
   * `Ponni Boiled Rice 25kg Bag` $\times$ `4 bags`
   * `Aavin Green Magic Milk 500ml` $\times$ `20 pkts`
   * `Gold Winner Sunflower Oil 1L Pouch` $\times$ `10 pkts`
4. Click **Create Order**.
5. **Immediate System Effect:**
   * Available stock decreases immediately.
   * Total physical stock remains 50, but **4 bags, 20 milk pkts, 10 oil pkts move to `Reserved` status**.
   * Other staff cannot accidentally sell these reserved items.

### 3. Generate Picking List (`/picking`)
1. Click **Picking Lists** (`/picking`).
2. The picker sees the order organized by **nearest location code**:
   1. Stop 1: `COLD-01` $\rightarrow$ Pick `20 pkts Milk`
   2. Stop 2: `GRAIN-01` $\rightarrow$ Pick `4 bags Ponni Rice`
   3. Stop 3: `OIL-01` $\rightarrow$ Pick `10 pkts Sunflower Oil`
3. Check off items as they are collected from the shelves $\rightarrow$ Click **Complete Picking**.

### 4. Dispatch the Order (`/orders` or `/shipments`)
1. Open the picked order or go to **Shipments** (`/shipments`).
2. Click **Dispatch Shipment**.
3. **What Happens Behind the Scenes:**
   * The database runs an atomic multi-document transaction.
   * **4 bags are subtracted from `GRAIN-01`**.
   * **20 milk pkts are subtracted from `COLD-01`**.
   * **10 oil pkts are subtracted from `OIL-01`**.
   * The reservation is released.
   * **The stock is officially CLEARED.**

### 5. Generate Invoice / Bill (`/invoices`)
1. Go to **Invoices** (`/invoices`) $\rightarrow$ Click **New from Sales Order**.
2. Select the dispatched order for `Saravana Hotel & Mess`.
3. Set GST / Tax percentage (if applicable).
4. Click **Create Invoice** $\rightarrow$ Print or save PDF for the customer.
5. When payment is received (Cash / UPI / Cheque), click **Mark as Paid**.

---

## ⚠️ Step 6: Handling Damaged, Leaked & Expired Stock (`/stock`)

In provisions and grocery stores, inventory shrinkage occurs regularly (milk leaking, torn rice bags, rat damage, expired spices).

1. Go to **Stock Adjustments** (`/stock`).
2. Choose one of two clearing actions:

### Scenario A: Marking Items as Damaged (Quarantine)
* Use when a milk packet is punctured or a rice bag is torn and kept aside for vendor credit/claim:
  * **Action:** `Damaged`
  * **Product:** `Aavin Green Magic Milk 500ml`
  * **Location:** `COLD-01`
  * **Quantity:** `2`
  * **Note:** `Punctured pouch during morning transit`
  * *Result:* The 2 pouches are moved from Available to **Damaged Stock**. They cannot be sold.

### Scenario B: Permanent Write-off (Outward Disposal)
* Use when spoiled items are thrown away or discarded:
  * **Action:** `Outward`
  * **Product:** `Aavin Green Magic Milk 500ml`
  * **Location:** `COLD-01`
  * **Quantity:** `2`
  * **Reason:** `Spoiled / Curdled - discarded`
  * *Result:* Total stock count decreases permanently.

---

## 📊 Step 7: Real-Time Tracking & Audits

### 1. Store Dashboard (`/`)
* **Total Stock Value:** Live valuation of all inventory in your store (e.g. ₹2,45,000).
* **Low Stock Items:** Real-time badge alerting you when rice bags or milk crates fall below reorder level.
* **Pending Orders:** Number of customer orders awaiting picking or dispatch.
* **Location Utilization:** Percentage occupancy of each fridge, pallet, and rack.

### 2. Stock Movements Audit Ledger (`/movements`)
* Every single stock entry, sale dispatch, inward adjustment, and damage report creates an unchangeable audit record with:
  * Date & Timestamp
  * Product Name & SKU
  * Source & Destination Bins
  * Quantity (+ or -)
  * User / Staff responsible
  * Reference Reason

---

## 📋 Quick Reference Checklist

| Action | Where to Go | Key Requirement |
| :--- | :--- | :--- |
| **Change Store Name / Settings** | `/settings` | Click blue **Save Changes** at bottom (or press Enter) |
| **Add New Racks / Fridges** | `/locations` | Give clear code (e.g. `COLD-01`, `GRAIN-01`) |
| **Add New Grocery Item** | `/products` | Always select **Location** if adding opening stock |
| **Receive Daily Milk Crates** | `/stock` | Select **Inward**, pick `COLD-01`, enter quantity |
| **Bulk Restock from Rice Mill** | `/purchases` | Create PO $\rightarrow$ Click **Receive Stock** on delivery |
| **Take Customer Order** | `/orders` | Places reservation immediately |
| **Pick Items from Shelves** | `/picking` | Follows nearest-first shelf order |
| **Clear Stock on Delivery** | `/shipments` | Click **Dispatch** (clears physical stock) |
| **Customer Billing** | `/invoices` | Click **New from Sales Order** |
| **Discard Leaked / Spoiled Pkts**| `/stock` | Select **Damaged** or **Outward** |
