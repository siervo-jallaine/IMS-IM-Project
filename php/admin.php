<?php
// Configure session settings before starting the session
ini_set('session.cookie_lifetime', 0);
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Lax');

session_start();

// Enhanced session validation
if (!isset($_SESSION['username']) ||
    !isset($_SESSION['role']) ||
    $_SESSION['role'] !== 'admin' ||
    !isset($_SESSION['logged_in']) ||
    $_SESSION['logged_in'] !== true) {

    // Clear any existing session data
    session_destroy();
    header("Location: login.php");
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Amacio's Coffee Shop - Inventory</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../css/admin.css">
</head>
<body>
    <div class="container">
        <!-- Sidebar Navigation -->
        <aside class="sidebar">
            <div class="profile">
                <div class="avatar"></div>
                <p class="admin-label">Admin</p>
            </div>
            <nav class="nav">
                <button class="nav-item active" data-section="dashboard" onclick="switchSection('dashboard')">
                    <i class="fas fa-tachometer-alt"></i>
                    Dashboard
                </button>
                <button class="nav-item" data-section="sales" onclick="switchSection('sales')">
                    <i class="fas fa-cash-register"></i>
                    Sales
                </button>
                <button class="nav-item" data-section="products" onclick="switchSection('products')">
                    <i class="fas fa-box"></i>
                    Products
                </button>
                <div class="nav-item dropdown">
                    <button class="dropdown-toggle" id="supplyDropdown" onclick="toggleDropdown()">
                        <i class="fas fa-truck"></i>
                        Supply
                        <i class="fas fa-chevron-down dropdown-icon"></i>
                    </button>

                </div>
                               <!-- Sidebar Supply Dropdown -->
                <div class="dropdown-menu" id="supplyDropdownMenu">
                    <button class="dropdown-item" data-section="supply-list" onclick="switchSection('supply-list')">Supply List</button>
                    <button class="dropdown-item" data-section="added-supply" onclick="switchSection('added-supply')">Added Supply</button>
                </div>
                <button class="nav-item" data-section="suppliers" onclick="switchSection('suppliers')">
                    <i class="fas fa-user-group"></i>
                    Suppliers
                </button>
                <button class="nav-item" data-section="user-management" onclick="switchSection('user-management')">
                    <i class="fas fa-users"></i>
                    User Management
                </button>
            </nav>
            <a href="#" class="logout" onclick="confirmLogout(event)">
                <i class="fas fa-sign-out-alt"></i>
                Log out
            </a>
        </aside>

        <!-- Main Content Area -->
        <main class="main-content">
            <!-- Dashboard Section -->
            <section id="dashboard" class="content-section active">
                <header class="page-header">
                    <h1>Amacio's Coffee Shop - Inventory</h1>
                </header>
                <div class="dashboard">
                    <div class="card medium-card">
                        <h2>Low Stocks Alert</h2>
                        <div class="card-content">
                            <table class="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Current Stock</th>
                                        <th>Min Level</th>
                                    </tr>
                                </thead>
                                <tbody id="lowStockTableBody">
                                    <tr>
                                        <td>Coffee Beans</td>
                                        <td>5 kg</td>
                                        <td>10 kg</td>
                                    </tr>
                                    <tr>
                                        <td>Sugar</td>
                                        <td>2 kg</td>
                                        <td>5 kg</td>
                                    </tr>
                                    <tr>
                                        <td>Coffee Beans</td>
                                        <td>5 kg</td>
                                        <td>10 kg</td>
                                    </tr>
                                    <tr>
                                        <td>Coffee Beans</td>
                                        <td>5 kg</td>
                                        <td>10 kg</td>
                                    </tr>
                                    <tr>
                                        <td>Coffee Beans</td>
                                        <td>5 kg</td>
                                        <td>10 kg</td>
                                    </tr>
                                    <!-- More rows will be added dynamically -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="card large-card">
                        <h2>Inventory Overview</h2>
                        <div class="card-content">
                            <table class="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th>Total Items</th>
                                    </tr>
                                </thead>
                                <tbody id="inventoryOverviewBody">
                                    <tr>
                                        <td>Coffee Products</td>
                                        <td>25</td>
                                    </tr>
                                    <tr>
                                        <td>Beverages</td>
                                        <td>15</td>
                                    </tr>
                                    <tr>
                                        <td>Pastries</td>
                                        <td>12</td>
                                    </tr>
                                    <tr>
                                        <td>Supplies</td>
                                        <td>8</td>
                                    </tr>
                                    <!-- More rows will be added dynamically -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="card small-card">
                        <h2>Monthly Usage Summary</h2>
                        <div class="card-content">
                            <table class="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Month</th>
                                        <th>Usage Rate</th>
                                    </tr>
                                </thead>
                                <tbody id="usageSummaryBody">
                                    <tr>
                                        <td>Current</td>
                                        <td>85%</td>
                                    </tr>
                                    <tr>
                                        <td>Previous</td>
                                        <td>78%</td>
                                    </tr>
                                    <!-- More rows will be added dynamically -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="card full-width stats-overview">
                    <h2>Quick Stats</h2>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value" id="totalProducts">0</div>
                            <div class="stat-label">Total Products</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="totalSuppliers">0</div>
                            <div class="stat-label">Total Suppliers</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="totalSales">0</div>
                            <div class="stat-label">Total Sales</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="lowStockItems">2</div>
                            <div class="stat-label">Low Stock Items</div>
                        </div>
                    </div>
                </div>
         </section>

            <!-- Sales Section -->
            <section id="sales" class="content-section">
                <header class="page-header sales-header">
                    <h1><i class="fas fa-cash-register"></i> Sales Management</h1>
                    <div class="actions-group">
                      <div class="search-wrapper">
                        <input type="text" id="salesSearch" onkeyup="filterSales()" placeholder="Search sales..." class="search-input">
                        <i class="fas fa-search search-icon"></i>
                      </div>
                      <button class="btn btn-primary" id="addSaleBtn" onclick="openModal('saleModal')">
                        <i class="fas fa-plus"></i> Add Sale
                      </button>
                    </div>
                  </header>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Product Name</th>
                                <th>Quantity</th>
                                <th>Entered by</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="salesTableBody">
                            <!-- Sales data will be populated here -->
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- Products Section -->
            <section id="products" class="content-section">
                <div id="categoryView">
                    <header class="page-header category-header">
                        <h1><i class="fas fa-box"></i> Product Categories</h1>
                        <div class="actions-group">
                          <div class="search-wrapper">
                            <input type="text" id="categorySearch" placeholder="Search category..." onkeyup="filterCategories()" class="search-input">
                            <i class="fas fa-search search-icon"></i>
                          </div>
                          <button class="btn btn-primary" id="addCategoryBtn" onclick="openModal('categoryModal')">
                            <i class="fas fa-plus"></i> Add Category
                          </button>
                        </div>
                      </header>

                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Category Name</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="categoryTableBody">
                                <!-- Categories will be populated here -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <div id="productView" style="display: none;">
                    <header class="page-header product-header">
                        <div class="page-title-group">
                          <h1>
                            <button class="btn btn-secondary" id="backToCategoriesBtn" onclick="showCategoryView()">
                              <i class="fas fa-arrow-left"></i> Back
                            </button>
                            <i class="fas fa-coffee"></i> PRODUCT [name] / All Products
                          </h1>
                          <div class="search-wrapper">
                            <input type="text" id="productSearch" onkeyup="filterProducts()" placeholder="Search product..." class="search-input">
                            <i class="fas fa-search search-icon"></i>
                          </div>
                        </div>
                        <button class="btn btn-primary" id="addProductBtn" onclick="openModal('productModal')">
                          ADD PRODUCT
                        </button>
                      </header>

                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Product Name</th>
                                    <th>Product Size</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="productTableBody">
                                <!-- Products will be populated here -->
                            </tbody>
                        </table>
                    </div>
                </div>

            </section>

            <!-- Supply List Section -->
            <section id="supply-list" class="content-section">
                <header class="page-header supply-header">
                    <h1><i class="fas fa-list"></i> Supply List</h1>
                    <div class="actions-group">
                      <div class="search-wrapper">
                        <input type="text" id="supplySearch" onkeyup="filterSupplies()" placeholder="Search supply..." class="search-input">
                        <i class="fas fa-search search-icon"></i>
                      </div>
                      <button class="btn btn-primary" onclick="openModal('supplyModal')">
                        <i class="fas fa-plus"></i> Add Supply
                      </button>
                    </div>
                  </header>

                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Supply Name</th>
                                <th>Quantity</th>
                                <th>Unit</th>
                            </tr>
                        </thead>
                        <tbody id="supplyTableBody">
                            <!-- Supply data will be populated here -->
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- Added Supply Section -->
            <section id="added-supply" class="content-section">
                <header class="page-header added-supply-header">
                    <h1><i class="fas fa-plus-circle"></i> Added Supply</h1>
                    <div class="actions-group">
                      <div class="search-wrapper">
                        <input type="text" id="addedSupplySearch" onkeyup="filterAddedSupplies()" placeholder="Search added supply..." class="search-input">
                        <i class="fas fa-search search-icon"></i>
                      </div>
                      <button class="btn btn-primary" onclick="openModal('supplyModal')">
                        <i class="fas fa-plus"></i> Add Supply
                      </button>
                    </div>
                  </header>

                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Supply Name</th>
                                <th>Quantity</th>
                                <th>Unit</th>
                                <th>Recieved by</th>
                                <th>Date Added</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="addedSupplyTableBody">
                            <!-- Added supply data will be populated here -->
                        </tbody>
                    </table>
                </div>
            </section>


            <!-- Suppliers Section -->
            <section id="suppliers" class="content-section">
                <header class="page-header supplier-header">
                    <h1><i class="fas fa-user-group"></i> Suppliers</h1>
                    <div class="actions-group">
                      <div class="search-wrapper">
                        <input type="text" id="supplierSearch" onkeyup="filterSuppliers()" placeholder="Search supplier..." class="search-input">
                        <i class="fas fa-search search-icon"></i>
                      </div>
                      <button class="btn btn-primary" id="addSupplierBtn" onclick="openModal('supplierModal')">
                        <i class="fas fa-plus"></i> Add Supplier
                      </button>
                    </div>
                  </header>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Supply Name</th>
                                <th>Supplier Name</th>
                                <th>Contact Number</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="supplierTableBody">
                            <!-- Supplier data will be populated here -->
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- User Management Section -->
            <section id="user-management" class="content-section">
                <header class="page-header user-header">
                    <h1><i class="fas fa-users"></i> User Management</h1>
                    <div class="actions-group">
                      <div class="search-wrapper">
                        <input type="text" id="userSearch" onkeyup="filterUsers()" placeholder="Search user..." class="search-input">
                        <i class="fas fa-search search-icon"></i>
                      </div>
                      <button class="btn btn-primary" id="addUserBtn" onclick="openModal('userModal')">
                        <i class="fas fa-plus"></i> Add User
                      </button>
                    </div>
                  </header>

                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="userTableBody">
                            <!-- User data will be populated here -->
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    </div>

    <!-- Modal Templates -->
    <div class="modal" id="saleModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="saleModalTitle">Add Sale</h2>
                <button class="close-btn" onclick="closeModal('saleModal')">&times;</button>
            </div>
            <form id="saleForm" onsubmit="saveSale(event)">
                <div class="form-group" id="autocomplete-container">
                    <label for="saleProductName">Product Name</label>
                    <input type="text"
                            id="saleProductName"
                            autocomplete="off"
                            required>
                    <div id="productSuggestions" class="suggestions-list"></div>
                </div>

                <div class="form-group">
                    <label for="saleProductSize">Product Size</label>
                    <select id="saleProductSize" required>
                        <option value="">Select Size</option>
                        <option value="Shot">Shot</option>
                        <option value="12 oz">12 oz</option>
                        <option value="16 oz">16 oz</option>
                    </select>
                </div>

                <!-- new: Entered By -->
                <div class="form-group">
                    <label for="saleEnteredBy">Entered By</label>
                    <input type="text" id="saleEnteredBy" value="<?php echo htmlspecialchars($_SESSION['username'] ?? ''); ?>" required readonly>
                </div>

                <!-- new: Quantity as a number‐input -->
                <div class="form-group">
                    <label for="saleQuantityInput">Quantity</label>
                    <div class="quantity-control">
                    <button type="button" class="qty-btn" onclick="changeQuantity('saleQuantityInput', -1)">-</button>
                    <input
                        type="number"
                        id="saleQuantityInput"
                        min="1"
                        value="1"
                        required
                    >
                    <button type="button" class="qty-btn" onclick="changeQuantity('saleQuantityInput', 1)">+</button>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Save</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('saleModal')">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Category Modal -->
    <div class="modal" id="categoryModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="categoryModalTitle">Add Category</h2>
                <button class="close-btn" onclick="closeModal('categoryModal')">&times;</button>
            </div>
            <form id="categoryForm" onsubmit="saveCategory(event)">
                <div class="form-group">
                    <label for="categoryName">Category Name</label>
                    <input type="text" id="categoryName" autocomplete="off" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Save</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('categoryModal')">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Product Modal -->
    <div class="modal" id="productModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="productModalTitle">Add Product</h2>
                <button class="close-btn" onclick="closeModal('productModal')">&times;</button>
            </div>
            <form id="productForm" onsubmit="saveProduct(event)">
                <div class="form-group">
                    <label for="productName">Product Name</label>
                    <input type="text" id="productName" name="product_name" required>
                </div>

                <div class="form-group">
                    <label for="productSize">Product Size</label>
                    <select id="productSize" name="product_size" required>
                        <option value="">Select Size</option>
                        <option value="Shot">Shot</option>
                        <option value="12 oz">12 oz</option>
                        <option value="16 oz">16 oz</option>
                    </select>
                </div>

                <input type="hidden" id="hiddenCategoryId" name="category_id">

                <div class="form-group">
                    <label>Ingredients</label>
                    <div id="ingredientsList"></div>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="addIngredientRow()">+ Add Ingredient</button>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Add</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('productModal')">Cancel</button>
                </div>
            </form>

        </div>
    </div>

    <!-- Supply Modal -->
    <div class="modal" id="supplyModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="supplyModalTitle">Add Supply</h2>
                <button class="close-btn" onclick="closeModal('supplyModal')">&times;</button>
            </div>
            <form id="supplyForm" onsubmit="return saveSupply(event)">
                <div class="form-group">
                    <label for="supplyName">Supply Name</label>
                    <input type="text" id="supplyName" required>
                </div>
                <div class="form-group">
                    <label for="supplyQuantity">Quantity</label>
                    <input type="number" id="supplyQuantity" required>
                </div>
                <div class="form-group">
                    <label for="supplyReceivedBy">Received By</label>
                    <input type="text" id="supplyReceivedBy" required>
                </div>
                <div class="form-group">
                    <label for="supplyUnit">Unit</label>
                    <input type="text" id="supplyUnit" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Save</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('supplyModal')">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Supplier Modal -->
    <div class="modal" id="supplierModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="supplierModalTitle">Add Supplier</h2>
                <button class="close-btn" onclick="closeModal('supplierModal')">&times;</button>
            </div>
            <form id="supplierForm" onsubmit="saveSupplier(event)">
                <div class="form-group">
                    <label for="supplierSupplyName">Supply Name</label>
                    <input type="text" id="supplierSupplyName" required>
                </div>
                <div class="form-group">
                    <label for="supplierName">Supplier Name</label>
                    <input type="text" id="supplierName" required>
                </div>
                <div class="form-group">
                    <label for="supplierNumber">Contact Number</label>
                    <input type="text" id="supplierNumber" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Save</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('supplierModal')">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <!-- User Modal -->
    <div class="modal" id="userModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="userModalTitle">Add User</h2>
                <button class="close-btn" onclick="closeModal('userModal')">&times;</button>
            </div>
            <form id="userForm" onsubmit="saveUser(event)">
                <div class="form-group">
                    <label for="userUsername">Username</label>
                    <input type="text" id="userUsername" required>
                </div>
                <div class="form-group">
                    <label for="userEmail">Email</label>
                    <input type="email" id="userEmail" required>
                </div>
                <div class="form-group">
                    <label for="userPassword">Password</label>
                    <input type="password" id="userPassword" required>
                </div>
                <div class="form-group">
                    <label for="userRole">Role</label>
                    <select id="userRole" required>
                        <option value="">Select Role</option>
                        <option value="Admin">Admin</option>
                        <option value="Staff">Staff</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Save</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('userModal')">Cancel</button>
                </div>
            </form>
        </div>
    </div>
    <!-- Add Ingredients Modal after your existing modals -->
    <div class="modal" id="ingredientsModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="ingredientsModalTitle">Product Ingredients</h2>
                <button class="close-btn" onclick="closeModal('ingredientsModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div id="ingredientsContent">
                    <!-- Ingredients will be populated here -->
                </div>
            </div>
        </div>
    </div>

    <!-- Logout Confirmation Modal -->
    <div class="modal" id="logoutConfirmModal">
        <div class="modal-content">
        <div class="modal-header">
            <h2>Confirm Logout</h2>
            <button class="close-btn" onclick="closeModal('logoutConfirmModal')">&times;</button>
        </div>
        <div class="modal-body" style="padding: 20px; font-size: 16px;">
            Are you sure you want to log out?
        </div>
        <div class="form-actions">
            <button class="btn btn-primary" onclick="performLogout()">Log Out</button>
            <button class="btn btn-secondary" onclick="closeModal('logoutConfirmModal')">Cancel</button>
        </div>
        </div>
    </div>
    <script src="../js/admin.js"></script>
</body>
</html>
