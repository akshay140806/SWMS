import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

os.makedirs('figures', exist_ok=True)

# 1. Figure 3.1: 3-Tier Enterprise Architecture
def create_fig3_1():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Column 1: Presentation Tier
    rect1 = patches.FancyBboxPatch((3, 5), 29, 90, boxstyle="round,pad=1.5", ec="#2563eb", fc="#eff6ff", lw=2)
    ax.add_patch(rect1)
    ax.text(17.5, 91, "PRESENTATION TIER\n(React 18 + Vite 5 + Tailwind)", ha='center', va='center', fontsize=9, fontweight='bold', color="#1e3a8a")

    p_boxes = [
        ("Auth & Session UI", "JWT Token, Role-Gated Shell, ProtectedRoute"),
        ("Live Dashboard", "Recharts Trends, Zone Donut, Real-Time KPIs"),
        ("Product & SKU Catalog", "Master Items, Barcodes, Pricing, Low-Stock"),
        ("Bin & Zone Manager", "Zone A/B/C Bins, Weight Capacity Bar, QR Code"),
        ("Stock Operations", "Inward, Outward, Transfer, Damage Quarantine"),
        ("Orders & Dispatch UI", "Order Queue, Location-Sorted Picking, Challan")
    ]
    for idx, (title, sub) in enumerate(p_boxes):
        y = 78 - idx * 13
        b = patches.FancyBboxPatch((5, y), 25, 9.5, boxstyle="round,pad=0.8", ec="#93c5fd", fc="#ffffff", lw=1.2)
        ax.add_patch(b)
        ax.text(17.5, y + 6.2, title, ha='center', va='center', fontsize=8, fontweight='bold', color="#1e293b")
        ax.text(17.5, y + 2.5, sub, ha='center', va='center', fontsize=6.5, color="#64748b")

    # Column 2: Application Tier
    rect2 = patches.FancyBboxPatch((35.5, 5), 29, 90, boxstyle="round,pad=1.5", ec="#d97706", fc="#fffbeb", lw=2)
    ax.add_patch(rect2)
    ax.text(50, 91, "APPLICATION & LOGIC TIER\n(Node.js 20+ & Express.js 4)", ha='center', va='center', fontsize=9, fontweight='bold', color="#92400e")

    a_boxes = [
        ("Auth & RBAC Middleware", "bcrypt 12 Salt Rounds, JWT Verification, Role Guard"),
        ("Capacity Engine", "Volumetric & Weight Allocation Constraint Checking"),
        ("Stock Ledger Engine", "Atomic Increment ($inc), Inward/Outward Ledger"),
        ("Order Allocation Engine", "Available = Total - Damaged - Reserved Rule"),
        ("Picking Route Optimizer", "Nearest-First Alphanumeric Sort by Location Code"),
        ("Real-Time Event Engine", "Socket.IO Broadcast, In-App Activity & Alerts")
    ]
    for idx, (title, sub) in enumerate(a_boxes):
        y = 78 - idx * 13
        b = patches.FancyBboxPatch((37.5, y), 25, 9.5, boxstyle="round,pad=0.8", ec="#fde68a", fc="#ffffff", lw=1.2)
        ax.add_patch(b)
        ax.text(50, y + 6.2, title, ha='center', va='center', fontsize=8, fontweight='bold', color="#1e293b")
        ax.text(50, y + 2.5, sub, ha='center', va='center', fontsize=6.5, color="#64748b")

    # Column 3: Data Tier
    rect3 = patches.FancyBboxPatch((68, 5), 29, 90, boxstyle="round,pad=1.5", ec="#059669", fc="#ecfdf5", lw=2)
    ax.add_patch(rect3)
    ax.text(82.5, 91, "DATA & STORAGE TIER\n(MongoDB 8 & Mongoose 8)", ha='center', va='center', fontsize=9, fontweight='bold', color="#065f46")

    d_boxes = [
        ("Users Collection", "Admin, Warehouse Staff, Dispatch Staff Records"),
        ("Products Collection", "SKU, Name, Barcode, Reorder Level, Unit Pricing"),
        ("Locations Collection", "Zone, Aisle, Rack, Shelf, Bin, Max Weight/Vol"),
        ("Stock Movements Collection", "Immutable Ledger (INWARD, OUTWARD, TRANSFER)"),
        ("Orders & Fulfilment", "Sequential ORD-00001, Reserve Tracking, Status"),
        ("Counter & Settings", "Atomic Sequence Counters, Store Currency & Rules")
    ]
    for idx, (title, sub) in enumerate(d_boxes):
        y = 78 - idx * 13
        b = patches.FancyBboxPatch((70, y), 25, 9.5, boxstyle="round,pad=0.8", ec="#a7f3d0", fc="#ffffff", lw=1.2)
        ax.add_patch(b)
        ax.text(82.5, y + 6.2, title, ha='center', va='center', fontsize=8, fontweight='bold', color="#1e293b")
        ax.text(82.5, y + 2.5, sub, ha='center', va='center', fontsize=6.5, color="#64748b")

    # Connectors
    for idx in range(6):
        y = 78 - idx * 13 + 4.75
        ax.annotate('', xy=(37.5, y), xytext=(30, y),
                    arrowprops=dict(arrowstyle="<->", color="#64748b", lw=1.5))
        ax.annotate('', xy=(70, y), xytext=(62.5, y),
                    arrowprops=dict(arrowstyle="<->", color="#64748b", lw=1.5))

    plt.tight_layout()
    plt.savefig('figures/fig3_1_architecture.png', bbox_inches='tight', dpi=300)
    plt.close()

# 2. Figure 3.2: MongoDB Entity-Relationship (ER) Schema
def create_fig3_2():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Draw ER boxes
    def draw_entity(x, y, w, h, title, fields, border="#0284c7"):
        b = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.8", ec=border, fc="#f8fafc", lw=1.5)
        ax.add_patch(b)
        # title bar
        tb = patches.Rectangle((x, y + h - 4.5), w, 4.5, fc=border)
        ax.add_patch(tb)
        ax.text(x + w/2, y + h - 2.5, title, ha='center', va='center', fontsize=8, fontweight='bold', color="#ffffff")
        for i, f in enumerate(fields):
            ax.text(x + 1.5, y + h - 7.5 - i * 3.3, f, ha='left', va='center', fontsize=6.5, color="#1e293b", family='monospace')

    # Users
    draw_entity(3, 62, 26, 32, "USERS", [
        "_id: ObjectId (PK)",
        "name: String",
        "email: String (Unique)",
        "password: Hash (bcrypt)",
        "role: 'admin'|'staff'",
        "status: 'active'|'inactive'",
        "createdAt: Date"
    ], border="#0369a1")

    # Products
    draw_entity(37, 62, 28, 32, "PRODUCTS", [
        "_id: ObjectId (PK)",
        "name: String",
        "sku: String (Unique)",
        "barcode: String",
        "category: String",
        "unitPrice: Number",
        "reorderLevel: Number",
        "reservedQuantity: Number"
    ], border="#059669")

    # Locations
    draw_entity(71, 62, 26, 32, "LOCATIONS", [
        "_id: ObjectId (PK)",
        "code: String (Unique)",
        "zone: 'Zone A'|'Zone B'",
        "aisle, rack, shelf, bin",
        "maxWeightKg: Number",
        "currentWeightKg: Number",
        "blocked: Boolean"
    ], border="#d97706")

    # Orders
    draw_entity(3, 10, 26, 38, "ORDERS", [
        "_id: ObjectId (PK)",
        "orderNumber: String (ORD-...)",
        "customerName: String",
        "customerPhone: String",
        "items: [{productId, qty}]",
        "status: 'PENDING'|'READY'",
        "totalAmount: Number",
        "createdAt: Date"
    ], border="#7c3aed")

    # StockMovements
    draw_entity(37, 10, 28, 38, "STOCK_MOVEMENTS", [
        "_id: ObjectId (PK)",
        "productId: ObjectId (FK)",
        "locationId: ObjectId (FK)",
        "type: 'IN'|'OUT'|'TRANS'|'DMG'",
        "quantity: Number",
        "toLocationId: ObjectId (FK)",
        "performedBy: ObjectId (FK)",
        "reason: String",
        "createdAt: Date"
    ], border="#dc2626")

    # Shipments / Invoices
    draw_entity(71, 10, 26, 38, "SHIPMENTS & INVOICES", [
        "_id: ObjectId (PK)",
        "orderId: ObjectId (FK)",
        "shipmentNumber: String (SHP)",
        "invoiceNumber: String (INV)",
        "carrier: String",
        "trackingNumber: String",
        "status: 'DISPATCHED'|'PAID'",
        "dispatchedAt: Date"
    ], border="#0d9488")

    # Connectors
    # Users -> StockMovements
    ax.annotate('', xy=(37, 30), xytext=(29, 70),
                arrowprops=dict(arrowstyle="->", color="#64748b", lw=1.2, ls="--"))
    ax.text(28, 48, "logs action", fontsize=6.5, color="#64748b", rotation=-40)

    # Products -> StockMovements
    ax.annotate('', xy=(51, 48), xytext=(51, 62),
                arrowprops=dict(arrowstyle="->", color="#64748b", lw=1.5))
    ax.text(52, 55, "1 : N (ledger)", fontsize=6.5, color="#64748b")

    # Locations -> StockMovements
    ax.annotate('', xy=(65, 30), xytext=(71, 62),
                arrowprops=dict(arrowstyle="->", color="#64748b", lw=1.5))
    ax.text(68, 48, "1 : N", fontsize=6.5, color="#64748b", rotation=40)

    # Orders -> Shipments
    ax.annotate('', xy=(71, 28), xytext=(29, 28),
                arrowprops=dict(arrowstyle="->", color="#64748b", lw=1.5))
    ax.text(47, 29, "1 : 1 (fulfil)", fontsize=6.5, color="#64748b")

    plt.tight_layout()
    plt.savefig('figures/fig3_2_er_diagram.png', bbox_inches='tight', dpi=300)
    plt.close()

# 3. Figure 3.3: System Class Diagram
def create_fig3_3():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    def draw_class(x, y, w, h, name, attrs, methods, color="#1e40af"):
        b = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.5", ec=color, fc="#ffffff", lw=1.5)
        ax.add_patch(b)
        tb = patches.Rectangle((x, y + h - 5), w, 5, fc=color)
        ax.add_patch(tb)
        ax.text(x + w/2, y + h - 2.8, name, ha='center', va='center', fontsize=8, fontweight='bold', color="#ffffff")
        
        # Attributes
        curr_y = y + h - 7.5
        for a in attrs:
            ax.text(x + 1.2, curr_y, a, fontsize=6, color="#334155")
            curr_y -= 2.6
        
        # Separator line
        ax.plot([x, x + w], [curr_y, curr_y], color="#cbd5e1", lw=1)
        curr_y -= 2.5
        
        # Methods
        for m in methods:
            ax.text(x + 1.2, curr_y, m, fontsize=6, color="#0f766e", style='italic')
            curr_y -= 2.6

    # Product
    draw_class(3, 55, 28, 40, "Product", [
        "- _id: ObjectId",
        "- name: String",
        "- sku: String",
        "- barcode: String",
        "- unitPrice: Number",
        "- reorderLevel: Number",
        "- reservedQty: Number"
    ], [
        "+ getAvailableStock(): int",
        "+ reserveStock(qty): bool",
        "+ releaseStock(qty): bool",
        "+ deductDispatched(qty): void"
    ], color="#0369a1")

    # Location
    draw_class(36, 55, 28, 40, "Location", [
        "- _id: ObjectId",
        "- code: String",
        "- zone: String",
        "- aisle, rack, shelf, bin",
        "- maxWeightKg: Number",
        "- currentWeightKg: Number",
        "- isBlocked: Boolean"
    ], [
        "+ validateCapacity(kg): bool",
        "+ updateOccupancy(delta): void",
        "+ generateQRCode(): String",
        "+ setBlocked(flag): void"
    ], color="#0d9488")

    # Order
    draw_class(69, 55, 28, 40, "Order", [
        "- _id: ObjectId",
        "- orderNumber: String",
        "- customer: Customer",
        "- items: OrderItem[]",
        "- status: OrderStatus",
        "- totalAmount: Number"
    ], [
        "+ createAndReserve(): bool",
        "+ generatePickingList(): Item[]",
        "+ confirmDispatch(): Shipment",
        "+ cancelOrder(): void"
    ], color="#7c3aed")

    # StockMovement (Ledger)
    draw_class(3, 5, 28, 42, "StockMovement", [
        "- _id: ObjectId",
        "- productId: ObjectId",
        "- locationId: ObjectId",
        "- type: MovementType",
        "- quantity: Number",
        "- toLocationId: ObjectId",
        "- reference: String",
        "- performedBy: ObjectId"
    ], [
        "+ recordInward(): LedgerEntry",
        "+ recordOutward(): LedgerEntry",
        "+ recordTransfer(): LedgerEntry",
        "+ recordDamage(): LedgerEntry"
    ], color="#b91c1c")

    # FulfilService
    draw_class(36, 5, 28, 42, "FulfilService", [
        "- orderModel: Model",
        "- shipmentModel: Model",
        "- locationModel: Model",
        "- counterModel: Model"
    ], [
        "+ generatePickList(orderId)",
        "+ packOrder(orderId, pkgData)",
        "+ dispatchShipment(orderId)",
        "+ generateDeliveryChallan(id)",
        "+ processReturn(returnReq)"
    ], color="#c2410c")

    # RBACMiddleware
    draw_class(69, 5, 28, 42, "RBACMiddleware", [
        "- secret: String",
        "- roleHierarchy: Map",
        "- permissionMatrix: Map"
    ], [
        "+ authenticateToken(req, res)",
        "+ requireRole(allowedRoles)",
        "+ checkAdminOnly(req, res)",
        "+ filterByAssignment(user, query)"
    ], color="#475569")

    # Connector lines
    ax.annotate('', xy=(36, 75), xytext=(31, 75), arrowprops=dict(arrowstyle="<->", color="#94a3b8", lw=1.2))
    ax.annotate('', xy=(69, 75), xytext=(64, 75), arrowprops=dict(arrowstyle="<->", color="#94a3b8", lw=1.2))
    ax.annotate('', xy=(50, 47), xytext=(50, 55), arrowprops=dict(arrowstyle="->", color="#94a3b8", lw=1.2))

    plt.tight_layout()
    plt.savefig('figures/fig3_3_class_diagram.png', bbox_inches='tight', dpi=300)
    plt.close()

# 4. Figure 3.4: Sequence Diagram for Inward & Order Fulfillment
def create_fig3_4():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    lifelines = [
        (10, "Staff / Client\n(React SPA)"),
        (30, "Express.js API\n& RBAC Guard"),
        (52, "Stock & Fulfil\nControllers"),
        (75, "MongoDB 8\n(Replica Set)"),
        (92, "Socket.IO\nRealtime Bus")
    ]

    for x, label in lifelines:
        b = patches.FancyBboxPatch((x-8, 88), 16, 9, boxstyle="round,pad=0.5", ec="#334155", fc="#f1f5f9", lw=1.2)
        ax.add_patch(b)
        ax.text(x, 92.5, label, ha='center', va='center', fontsize=7, fontweight='bold', color="#0f172a")
        ax.plot([x, x], [8, 88], color="#cbd5e1", ls="--", lw=1.2)

    messages = [
        (10, 30, 80, "1: POST /api/products/inward {sku, loc, qty}", True),
        (30, 52, 73, "2: verifyToken() -> checkCapacity(loc, weight)", True),
        (52, 75, 66, "3: txn: $inc(loc.qty, stock) + appendLedger()", True),
        (75, 52, 59, "4: Commit transaction -> 200 OK", False),
        (52, 92, 52, "5: emit('stock:updated', {sku, newQty})", True),
        (30, 10, 45, "6: HTTP 201 Created (Stock Inward recorded)", False),
        (10, 30, 37, "7: POST /api/orders {customer, items}", True),
        (30, 52, 30, "8: reserveStock() -> verify Available >= Qty", True),
        (52, 75, 23, "9: Atomic $inc(reservedQty) + Counter nextVal", True),
        (52, 10, 16, "10: HTTP 201 Order Confirmed (ORD-00042)", False),
        (52, 92, 9, "11: emit('order:created', {orderNumber})", True)
    ]

    for x1, x2, y, text, forward in messages:
        color = "#2563eb" if forward else "#059669"
        ls = "-" if forward else ":"
        ax.annotate('', xy=(x2, y), xytext=(x1, y),
                    arrowprops=dict(arrowstyle="->", color=color, lw=1.3, ls=ls))
        mid_x = (x1 + x2) / 2
        ax.text(mid_x, y + 1.8, text, ha='center', va='bottom', fontsize=6.5, color="#1e293b", fontweight='semibold')

    plt.tight_layout()
    plt.savefig('figures/fig3_4_sequence_diagram.png', bbox_inches='tight', dpi=300)
    plt.close()

# 5. Figure 3.5: Enterprise Use Case Interaction Diagram
def create_fig3_5():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # System boundary box
    sys_box = patches.FancyBboxPatch((28, 5), 68, 90, boxstyle="round,pad=1.5", ec="#2563eb", fc="#f8fafc", lw=2)
    ax.add_patch(sys_box)
    ax.text(62, 91, "SMART WAREHOUSE SYSTEM BOUNDARY", ha='center', va='center', fontsize=9, fontweight='bold', color="#1e3a8a")

    use_cases = [
        (48, 80, "User Authentication & JWT Session"),
        (76, 80, "Manage Users & Permissions (Admin)"),
        (48, 65, "Product Master & SKU Catalog Registry"),
        (76, 65, "Zone, Rack & Bin Capacity Allocation"),
        (48, 50, "Execute Stock Inward / Purchase Receiving"),
        (76, 50, "Stock Relocation & Inter-Bin Transfer"),
        (48, 35, "Quarantine Damaged & Expired Items"),
        (76, 35, "Customer Sales Order Entry & Reservation"),
        (48, 20, "Generate Location-Sorted Picking List"),
        (76, 20, "Package Staging & Delivery Challan Dispatch"),
        (48, 9, "Live Dashboard KPIs & Reorder Alerts"),
        (76, 9, "Inventory Valuation & Turnover Analytics")
    ]

    for ux, uy, utitle in use_cases:
        ellipse = patches.Ellipse((ux, uy), 24, 7.5, ec="#0284c7", fc="#e0f2fe", lw=1.2)
        ax.add_patch(ellipse)
        ax.text(ux, uy, utitle, ha='center', va='center', fontsize=6.2, fontweight='bold', color="#0369a1")

    # Actors on the left
    actors = [
        (12, 75, "ADMINISTRATOR\n(Full System Authority)"),
        (12, 45, "WAREHOUSE STAFF\n(Inventory & Inward Ops)"),
        (12, 18, "DISPATCH STAFF\n(Order Picking & Outward)")
    ]

    for ax_coord, ay_coord, alabel in actors:
        # stick figure head
        c = patches.Circle((ax_coord, ay_coord + 6), 2.5, ec="#1e293b", fc="#e2e8f0", lw=1.5)
        ax.add_patch(c)
        # body line
        ax.plot([ax_coord, ax_coord], [ay_coord + 3.5, ay_coord - 2], color="#1e293b", lw=1.5)
        # arms
        ax.plot([ax_coord - 3, ax_coord + 3], [ay_coord + 1.5, ay_coord + 1.5], color="#1e293b", lw=1.5)
        # legs
        ax.plot([ax_coord, ax_coord - 2.5], [ay_coord - 2, ay_coord - 6], color="#1e293b", lw=1.5)
        ax.plot([ax_coord, ax_coord + 2.5], [ay_coord - 2, ay_coord - 6], color="#1e293b", lw=1.5)
        ax.text(ax_coord, ay_coord - 9, alabel, ha='center', va='top', fontsize=6.5, fontweight='bold', color="#0f172a")

    # Connection lines
    # Admin to all top & management
    for target in [(36, 80), (64, 80), (36, 65), (64, 65), (36, 9), (64, 9)]:
        ax.annotate('', xy=target, xytext=(15, 75), arrowprops=dict(arrowstyle="-", color="#3b82f6", lw=1))
    
    # Warehouse staff to stock & bins
    for target in [(36, 65), (64, 65), (36, 50), (64, 50), (36, 35)]:
        ax.annotate('', xy=target, xytext=(15, 45), arrowprops=dict(arrowstyle="-", color="#10b981", lw=1))

    # Dispatch staff to orders, picking, dispatch
    for target in [(64, 35), (36, 20), (64, 20)]:
        ax.annotate('', xy=target, xytext=(15, 18), arrowprops=dict(arrowstyle="-", color="#f59e0b", lw=1))

    plt.tight_layout()
    plt.savefig('figures/fig3_5_usecase_diagram.png', bbox_inches='tight', dpi=300)
    plt.close()

# 6. Figure 3.6: User Interface Wireframe Hierarchy
def create_fig3_6():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Desktop Wireframe
    dt = patches.FancyBboxPatch((3, 5), 68, 90, boxstyle="round,pad=1.2", ec="#334155", fc="#ffffff", lw=2)
    ax.add_patch(dt)
    ax.text(37, 91, "DESKTOP RESPONSIVE LAYOUT (1280x800px)", ha='center', va='center', fontsize=8, fontweight='bold', color="#1e293b")

    # Topbar
    tb = patches.Rectangle((4.5, 80), 65, 7, fc="#0f172a")
    ax.add_patch(tb)
    ax.text(9, 83.5, "WareX WMS", ha='left', va='center', fontsize=7.5, fontweight='bold', color="#ffffff")
    ax.text(37, 83.5, "[ Global Search Palette: Ctrl + K ]", ha='center', va='center', fontsize=6.5, color="#94a3b8")
    ax.text(66, 83.5, "Admin Profile | Notifications (3)", ha='right', va='center', fontsize=6.5, color="#ffffff")

    # Sidebar
    sb = patches.Rectangle((4.5, 6.5), 16, 72.5, fc="#f8fafc", ec="#e2e8f0")
    ax.add_patch(sb)
    navs = ["Dashboard", "Products", "Item Groups", "Locations", "Stock Ops", "Movements", "Orders", "Picking", "Dispatch", "Analytics", "Users", "Settings"]
    for i, n in enumerate(navs):
        color = "#2563eb" if i == 0 else "#475569"
        weight = "bold" if i == 0 else "normal"
        ax.text(7, 75 - i * 5.6, f"* {n}", ha='left', va='center', fontsize=6.2, color=color, fontweight=weight)

    # Main Canvas
    # KPI row
    for k in range(4):
        kpi = patches.FancyBboxPatch((22 + k * 11.5, 67), 10.5, 11, boxstyle="round,pad=0.5", ec="#cbd5e1", fc="#f1f5f9")
        ax.add_patch(kpi)
        ax.text(27.2 + k * 11.5, 74, ["Total Products", "Stock Value", "Low Stock", "Capacity"][k], ha='center', va='center', fontsize=5.5, color="#64748b")
        ax.text(27.2 + k * 11.5, 70, ["43 Items", "Rs. 5,994", "3 Items", "78%"][k], ha='center', va='center', fontsize=7, fontweight='bold', color="#0f172a")

    # Chart 1: Movements Trend
    c1 = patches.FancyBboxPatch((22, 38), 23, 27, boxstyle="round,pad=0.5", ec="#cbd5e1", fc="#ffffff")
    ax.add_patch(c1)
    ax.text(33.5, 61, "Stock Movements Trend (Area)", ha='center', va='center', fontsize=6.5, fontweight='bold', color="#1e293b")
    # miniature line
    ax.plot([25, 29, 34, 38, 42], [43, 49, 45, 54, 50], color="#3b82f6", lw=1.5)

    # Chart 2: Zone Donut
    c2 = patches.FancyBboxPatch((46.5, 38), 22, 27, boxstyle="round,pad=0.5", ec="#cbd5e1", fc="#ffffff")
    ax.add_patch(c2)
    ax.text(57.5, 61, "Stock by Zone (Donut)", ha='center', va='center', fontsize=6.5, fontweight='bold', color="#1e293b")
    w = patches.Wedge((57.5, 48), 6, 0, 360, width=2.5, fc="#f59e0b")
    ax.add_patch(w)

    # Live Data Table
    dt_tbl = patches.FancyBboxPatch((22, 8), 46.5, 28, boxstyle="round,pad=0.5", ec="#cbd5e1", fc="#ffffff")
    ax.add_patch(dt_tbl)
    ax.text(24, 32.5, "Fast-Moving Inventory & Urgent Reorder List", ha='left', va='center', fontsize=6.5, fontweight='bold', color="#1e293b")
    for r in range(4):
        ax.plot([23, 67.5], [29 - r * 5.2, 29 - r * 5.2], color="#e2e8f0", lw=0.8)
        ax.text(24, 26.5 - r * 5.2, ["Fortune Sunflower Oil 1L", "Aashirvaad Atta 5kg", "Toor Dal Premium 1kg", "Tata Salt Iodized 1kg"][r], fontsize=5.8, color="#334155")
        ax.text(52, 26.5 - r * 5.2, ["Zone A - Bin 01", "Zone A - Bin 04", "Zone B - Bin 02", "Zone B - Bin 05"][r], fontsize=5.8, color="#64748b")
        ax.text(64, 26.5 - r * 5.2, ["IN STOCK", "LOW STOCK", "IN STOCK", "REORDER"][r], fontsize=5.5, fontweight='bold', color=["#16a34a", "#ea580c", "#16a34a", "#dc2626"][r])

    # Mobile Layout Wireframe (Right Side)
    mob = patches.FancyBboxPatch((74, 5), 23, 90, boxstyle="round,pad=1.2", ec="#334155", fc="#ffffff", lw=2)
    ax.add_patch(mob)
    ax.text(85.5, 91, "MOBILE LAYOUT (375px)", ha='center', va='center', fontsize=7.5, fontweight='bold', color="#1e293b")

    # Mobile Topbar
    mtb = patches.Rectangle((75, 80), 21, 7, fc="#0f172a")
    ax.add_patch(mtb)
    ax.text(77, 83.5, "= WareX", fontsize=7, fontweight='bold', color="#ffffff")
    ax.text(94, 83.5, "Bell", fontsize=6, color="#ffffff")

    # Mobile Cards
    for mc in range(3):
        m_card = patches.FancyBboxPatch((76, 56 - mc * 23), 19, 20, boxstyle="round,pad=0.5", ec="#cbd5e1", fc="#f8fafc")
        ax.add_patch(m_card)
        ax.text(85.5, 71 - mc * 23, ["Active Warehouse KPIs", "Fast Action Quick Menu", "Recent Activity Stream"][mc], ha='center', va='center', fontsize=6, fontweight='bold', color="#1e293b")
        ax.text(85.5, 64 - mc * 23, ["43 Products | 78% Cap", "[+ Stock] [- Order] [Pick]", "ORD-00042 Dispatched"][mc], ha='center', va='center', fontsize=5.5, color="#64748b")

    plt.tight_layout()
    plt.savefig('figures/fig3_6_wireframe_hierarchy.png', bbox_inches='tight', dpi=300)
    plt.close()

# 7. Figure 4.1: Pseudocode for Inward Stock Allocation & Capacity Check
def create_fig4_1():
    fig, ax = plt.subplots(figsize=(10, 5.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Border frame
    frame = patches.FancyBboxPatch((2, 2), 96, 96, boxstyle="round,pad=1", ec="#93c5fd", fc="#f8fafc", lw=1.5)
    ax.add_patch(frame)

    # Title header
    header = patches.Rectangle((2, 88), 96, 10, fc="#dbeafe")
    ax.add_patch(header)
    ax.text(5, 93, "Pseudocode: Inward Stock Allocation & Capacity Validation Engine", fontsize=8.5, fontweight='bold', color="#1e3a8a")

    lines = [
        "Algorithm 1: Transactional Inward Stock Allocation and Bin Capacity Enforcement",
        "-------------------------------------------------------------------------------------------------",
        "Input  : Product P (ID, UnitWeightKg), Target Location L (ID, MaxWeightKg, CurrentWeightKg), InwardQty Q",
        "Output : Updated Location Record L', Immutable Ledger Entry M, HTTP Status Code",
        "",
        "1:  Start atomic database session txn",
        "2:  Retrieve Location L within txn with lock",
        "3:  if L.blocked == true then",
        "4:      Rollback txn and return 400 Bad Request ('Location is blocked for maintenance')",
        "5:  end if",
        "6:  calculate incomingWeight <- Q * P.unitWeightKg",
        "7:  if (L.currentWeightKg + incomingWeight) > L.maxWeightKg then",
        "8:      Rollback txn and return 400 Bad Request ('Capacity limit exceeded for bin')",
        "9:  end if",
        "10: Execute atomic update on Location: $inc { currentWeightKg: incomingWeight }",
        "11: Execute atomic update on Product: $inc { totalStock: Q }",
        "12: Create StockMovement record M { type: 'INWARD', product: P._id, location: L._id, quantity: Q }",
        "13: Commit txn",
        "14: emit WebSocket event 'stock:inward' to active clients",
        "15: return 201 Created { message: 'Stock received successfully', ledgerId: M._id }"
    ]

    for i, line in enumerate(lines):
        color = "#1e293b"
        weight = 'normal'
        if i in [0, 1]:
            color = "#0369a1"
            weight = 'bold'
        elif i in [2, 3]:
            color = "#475569"
            weight = 'bold'
        ax.text(5, 83 - i * 4.6, line, fontsize=6.8, fontfamily='monospace', color=color, fontweight=weight)

    plt.tight_layout()
    plt.savefig('figures/fig4_1_pseudocode_inward.png', bbox_inches='tight', dpi=300)
    plt.close()

# 8. Figure 4.2: Nearest-First Picking Route Optimization Model
def create_fig4_2():
    fig, ax = plt.subplots(figsize=(10, 5.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    frame = patches.FancyBboxPatch((2, 2), 96, 96, boxstyle="round,pad=1", ec="#93c5fd", fc="#ffffff", lw=1.5)
    ax.add_patch(frame)

    header = patches.Rectangle((2, 88), 96, 10, fc="#dbeafe")
    ax.add_patch(header)
    ax.text(5, 93, "Mathematical Model: Nearest-First Picking Route Optimization Pipeline", fontsize=8.5, fontweight='bold', color="#1e3a8a")

    steps = [
        (15, 68, "Order Line Items\nUnsorted Item Array\n{P1, P2, P3, P4}"),
        (38, 68, "Location Resolver\nFetch (Zone, Aisle,\nRack, Shelf, Bin)"),
        (62, 68, "Geographical Key Gen\nKey = Zone.Aisle.\nRack.Shelf.Bin"),
        (85, 68, "Radix / Code Sorter\nSort Ascending\nNearest-First Sequence")
    ]

    for sx, sy, stext in steps:
        b = patches.FancyBboxPatch((sx-10, sy-10), 20, 20, boxstyle="round,pad=0.8", ec="#0284c7", fc="#f0f9ff", lw=1.2)
        ax.add_patch(b)
        ax.text(sx, sy, stext, ha='center', va='center', fontsize=6.8, fontweight='bold', color="#0369a1")

    # Arrows between pipeline steps
    ax.annotate('', xy=(28, 68), xytext=(25, 68), arrowprops=dict(arrowstyle="->", color="#0284c7", lw=1.5))
    ax.annotate('', xy=(52, 68), xytext=(48, 68), arrowprops=dict(arrowstyle="->", color="#0284c7", lw=1.5))
    ax.annotate('', xy=(75, 68), xytext=(72, 68), arrowprops=dict(arrowstyle="->", color="#0284c7", lw=1.5))

    # Warehouse Aisle Visual Simulation below
    ax.plot([10, 90], [42, 42], color="#cbd5e1", lw=1.5)
    ax.text(10, 45, "Aisle A1 (Front Loading Bay -> Rear Deep Storage)", fontsize=7, fontweight='bold', color="#475569")

    bins = [
        ("A-01-01", 18, 30, "Stop 1 (Atta)", "#16a34a"),
        ("A-01-04", 38, 30, "Stop 2 (Oil)", "#16a34a"),
        ("A-02-02", 58, 30, "Stop 3 (Dal)", "#16a34a"),
        ("B-01-01", 78, 30, "Stop 4 (Soap)", "#16a34a")
    ]

    for bname, bx, by, blabel, bcolor in bins:
        b = patches.FancyBboxPatch((bx-8, by-8), 16, 16, boxstyle="round,pad=0.5", ec=bcolor, fc="#f0fdf4", lw=1.2)
        ax.add_patch(b)
        ax.text(bx, by + 2, bname, ha='center', va='center', fontsize=7.5, fontweight='bold', color="#166534")
        ax.text(bx, by - 3.5, blabel, ha='center', va='center', fontsize=6, color="#475569")

    # Picking walk path line
    ax.plot([18, 38, 58, 78], [15, 15, 15, 15], color="#2563eb", lw=2, marker='o')
    ax.text(48, 8, "--> Pick Path Direction: Sequential Shortest Walk Distance (Zero Backtracking) -->", ha='center', va='center', fontsize=7, fontweight='bold', color="#1d4ed8")

    plt.tight_layout()
    plt.savefig('figures/fig4_2_picking_model.png', bbox_inches='tight', dpi=300)
    plt.close()

# 9. Figure 4.3: RBAC Matrix Box
def create_fig4_3():
    fig, ax = plt.subplots(figsize=(10, 5.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    frame = patches.FancyBboxPatch((2, 2), 96, 96, boxstyle="round,pad=1", ec="#93c5fd", fc="#ffffff", lw=1.5)
    ax.add_patch(frame)

    header = patches.Rectangle((2, 88), 96, 10, fc="#dbeafe")
    ax.add_patch(header)
    ax.text(5, 93, "Role-Based Access Control (RBAC) Permission Resolution Matrix", fontsize=8.5, fontweight='bold', color="#1e3a8a")

    headers = ["Role Tier", "Products & Locations", "Stock Inward & Adjust", "Customer Sales Orders", "Picking & Outbound", "Users & Settings"]
    rows = [
        ("admin", "Full Access (CRUD)", "Full Access (In/Out/Adj)", "Full Access (CRUD)", "Full Access (Pick/Ship)", "Full Governance"),
        ("warehouse_staff", "Read / Create / Update", "Full Access (Inward/Move)", "Read Only", "Read Picking List", "Blocked (HTTP 403)"),
        ("dispatch_staff", "Read Only", "Blocked (HTTP 403)", "Create / Update Orders", "Full Access (Pick/Ship)", "Blocked (HTTP 403)"),
        ("Unauthenticated", "Blocked (HTTP 401)", "Blocked (HTTP 401)", "Blocked (HTTP 401)", "Blocked (HTTP 401)", "Blocked (HTTP 401)")
    ]

    col_x = [5, 22, 38, 54, 70, 86]
    for i, h in enumerate(headers):
        ax.text(col_x[i], 82, h, fontsize=6.5, fontweight='bold', color="#0f172a")

    ax.plot([4, 96], [78, 78], color="#94a3b8", lw=1.2)

    for r_idx, (role, c1, c2, c3, c4, c5) in enumerate(rows):
        y = 70 - r_idx * 16
        bg_col = "#f8fafc" if r_idx % 2 == 0 else "#ffffff"
        r_box = patches.Rectangle((4, y - 5), 92, 13, fc=bg_col)
        ax.add_patch(r_box)

        ax.text(col_x[0], y, role, fontsize=6.8, fontweight='bold', color="#1e40af" if role != "Unauthenticated" else "#dc2626")
        ax.text(col_x[1], y, c1, fontsize=6.2, color="#334155")
        ax.text(col_x[2], y, c2, fontsize=6.2, color="#334155")
        ax.text(col_x[3], y, c3, fontsize=6.2, color="#334155")
        ax.text(col_x[4], y, c4, fontsize=6.2, color="#334155")
        ax.text(col_x[5], y, c5, fontsize=6.2, color="#dc2626" if "Blocked" in c5 else "#16a34a", fontweight='bold' if "Governance" in c5 or "Blocked" in c5 else 'normal')
        ax.plot([4, 96], [y - 6, y - 6], color="#e2e8f0", lw=0.8)

    plt.tight_layout()
    plt.savefig('figures/fig4_3_rbac_matrix.png', bbox_inches='tight', dpi=300)
    plt.close()

# 10. Figure 4.4: Pseudocode for Order Dispatch & Atomic Stock Deduction
def create_fig4_4():
    fig, ax = plt.subplots(figsize=(10, 5.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    frame = patches.FancyBboxPatch((2, 2), 96, 96, boxstyle="round,pad=1", ec="#93c5fd", fc="#f8fafc", lw=1.5)
    ax.add_patch(frame)

    header = patches.Rectangle((2, 88), 96, 10, fc="#dbeafe")
    ax.add_patch(header)
    ax.text(5, 93, "Pseudocode: Outbound Dispatch, Atomic Stock Deduction & Shipment", fontsize=8.5, fontweight='bold', color="#1e3a8a")

    lines = [
        "Algorithm 2: Order Dispatch Clearance, Physical Stock Deduction, and Challan Generation",
        "-------------------------------------------------------------------------------------------------",
        "Input  : Order ID ordId, Dispatch Operator U, Carrier C, TrackingNumber T",
        "Output : Dispatched Order Record, New Shipment S (SHP-xxxxx), Delivery Challan",
        "",
        "1:  Start atomic database session txn",
        "2:  Fetch Order ord <- Order.findById(ordId) within txn",
        "3:  if ord.status != 'CONFIRMED' and ord.status != 'PACKED' then",
        "4:      Rollback txn and return 400 Bad Request ('Order is not staged for dispatch')",
        "5:  end if",
        "6:  for each LineItem item in ord.items do",
        "7:      // Decrement reserved stock and physical stock atomically",
        "8:      Product.updateOne({ _id: item.productId }, { $inc: { reservedQuantity: -item.quantity, totalStock: -item.quantity } }, { session: txn })",
        "9:      Location.updateOne({ _id: item.locationId }, { $inc: { currentWeightKg: -(item.quantity * item.unitWeightKg) } }, { session: txn })",
        "10:     Create StockMovement record { type: 'OUTWARD', product: item.productId, quantity: item.quantity, reference: ord.orderNumber }",
        "11: end for",
        "12: nextShipmentNo <- Counter.getNextSequence('shipment')",
        "13: Create Shipment S { shipmentNumber: nextShipmentNo, orderId: ord._id, carrier: C, tracking: T, status: 'DISPATCHED' }",
        "14: ord.status <- 'DISPATCHED'",
        "15: Commit txn; emit WebSocket event 'order:dispatched'",
        "16: return 200 OK { shipment: S, order: ord, challanUrl: `/shipments/${S._id}/challan` }"
    ]

    for i, line in enumerate(lines):
        color = "#1e293b"
        weight = 'normal'
        if i in [0, 1]:
            color = "#0369a1"
            weight = 'bold'
        elif i in [2, 3]:
            color = "#475569"
            weight = 'bold'
        ax.text(5, 83 - i * 4.6, line, fontsize=6.8, fontfamily='monospace', color=color, fontweight=weight)

    plt.tight_layout()
    plt.savefig('figures/fig4_4_pseudocode_dispatch.png', bbox_inches='tight', dpi=300)
    plt.close()

if __name__ == '__main__':
    print('Generating figure 3.1...')
    create_fig3_1()
    print('Generating figure 3.2...')
    create_fig3_2()
    print('Generating figure 3.3...')
    create_fig3_3()
    print('Generating figure 3.4...')
    create_fig3_4()
    print('Generating figure 3.5...')
    create_fig3_5()
    print('Generating figure 3.6...')
    create_fig3_6()
    print('Generating figure 4.1...')
    create_fig4_1()
    print('Generating figure 4.2...')
    create_fig4_2()
    print('Generating figure 4.3...')
    create_fig4_3()
    print('Generating figure 4.4...')
    create_fig4_4()
    print('All diagrams generated successfully!')
