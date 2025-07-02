// Global Variables
let currentEditingId = null;
let currentSection = 'dashboard';

// Data Storage with localStorage integration
let data = {
    sales: JSON.parse(localStorage.getItem('salesData')) || [],
    categories: JSON.parse(localStorage.getItem('categoriesData')) || ['Espresso', 'Brewed', 'Hot Coffee', 'Iced Coffee', 'Frappe'],
    products: JSON.parse(localStorage.getItem('productsData')) || [
        {
            id: 1,
            name: "Espresso Macchiato",
            size: "SHOT",
            category: "Espresso",
            stock: 20,
            ingredients: [
                { name: "Coffee Beans", amount: "1 Gram" },
                { name: "Full Cream Milk", amount: "15 ML" }
            ]
        },
        {
            id: 2,
            name: "Espresso",
            size: "SHOT",
            category: "Espresso",
            stock: 15,
            ingredients: [
                { name: "Coffee Beans", amount: "1 Gram" },
                { name: "Full Cream Milk", amount: "15 ML" }
            ]
        },
        {
            id: 3,
            name: "Iced Americano",
            size: "12oz",
            category: "Iced Coffee",
            stock: 10,
            ingredients: [
                { name: "Coffee Beans", amount: "2 Grams" },
                { name: "Ice Cubes", amount: "100 ML" },
                { name: "Water", amount: "200 ML" }
            ]
        }
    ],

    supplies: JSON.parse(localStorage.getItem('suppliesData')) || [
        { id: 1, name: "Robusta Coffee Beans", quantity: 1, unit: "PG" },
        { id: 2, name: "Caramel Sauce", quantity: 1, unit: "BTL" },
        { id: 3, name: "Chocolate Sauce", quantity: 1, unit: "BTL" },
        { id: 4, name: "Hazel Nut Syrup", quantity: 1, unit: "BTL" },
        { id: 5, name: "Fresh Milk", quantity: 1, unit: "CTN" }
    ],
    addedSupplies: JSON.parse(localStorage.getItem('addedSuppliesData')) || [],
    suppliers: JSON.parse(localStorage.getItem('suppliersData')) || [
        { id: 1, name: 'Coffee Beans', number: '09xxxxxxxxx', contact: 'Jeff Valdez' },
        { id: 2, name: 'Caramel Sauce', number: '09xxxxxxxxx', contact: 'Jaydee Guzman' },
        { id: 3, name: 'Chocolate Sauce', number: '09xxxxxxxxx', contact: 'Jaydee Guzman' },
        { id: 4, name: 'Hazel Nut Syrup', number: '09xxxxxxxxx', contact: 'Jaydee Guzman' },
        { id: 5, name: 'Fresh Milk', number: '09xxxxxxxxx', contact: 'Stella Yuro' }
    ],
    users: JSON.parse(localStorage.getItem('usersData')) || [
        { id: 1, name: "Jaydee", role: "Admin", status: "Active", login: "May 11, 2025, 11:19:52 pm" },
        { id: 2, name: "Aydee", role: "Staff", status: "Active", login: "May 11, 2025, 11:19:52 pm" },
        { id: 3, name: "Nate", role: "Staff", status: "Active", login: "May 11, 2025, 11:19:52 pm" },
        { id: 4, name: "Hazel", role: "Staff", status: "Active", login: "May 11, 2025, 11:19:52 pm" },
        { id: 5, name: "Olivia", role: "Staff", status: "Active", login: "May 11, 2025, 11:19:52 pm" }
    ]
};

data.sales = data.sales.map(sale => ({
    id: sale.id,
    productName: sale.productName,
    quantity: sale.quantity,
    date: sale.date
}));

// Utility Functions
function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
    return Date.now() + Math.random();
}

function formatDate() {
    return new Date().toLocaleString("en-US", {
        month: "short", day: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
    });
}

// Modal Functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);

  // Reset form for new entries
  if (modalId === 'userModal' && document.getElementById('userModalTitle').textContent !== 'Edit User') {
      document.getElementById('userForm').reset();
      document.getElementById('userModalTitle').textContent = 'Add User';
      document.getElementById('userPassword').required = true;
      delete document.getElementById('userForm').dataset.userId;
  }

  modal.classList.add('show');
}


function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
    currentEditingId = null;
    // Reset modal titles
    resetModalTitles();
}

function resetModalTitles() {
    const modalTitles = {
        'saleModalTitle': 'Add Sale',
        'categoryModalTitle': 'Add Category',
        'productModalTitle': 'Add Product',
        'supplyModalTitle': 'Add Supply',
        'supplierModalTitle': 'Add Supplier',
        'userModalTitle': 'Add Staff'
    };

    Object.keys(modalTitles).forEach(titleId => {
        const titleElement = document.getElementById(titleId);
        if (titleElement) {
            titleElement.textContent = modalTitles[titleId];
        }
    });
}

// Quantity Control Functions
function changeQuantity(elementId, delta) {
    const el = document.getElementById(elementId);
    if (!el) return;

    // If it's a number‐input, change its .value
    if (el.tagName === 'INPUT' && el.type === 'number') {
      let val = parseInt(el.value, 10) || 1;
      val = Math.max(1, val + delta);
      el.value = val;
    }
    // fallback for any spans you might still have
    else {
      let val = parseInt(el.textContent, 10) || 1;
      val = Math.max(1, val + delta);
      el.textContent = val;
    }
  }

function changeQty(type, delta) {
    const element = document.getElementById(type);
    if (element) {
        let current = parseInt(element.textContent);
        current = Math.max(1, current + delta);
        element.textContent = current;
    }
}

// Navigation Functions
function initializeNavigation() {
    // Handle dropdown toggle
    const supplyDropdown = document.getElementById('supplyDropdown');
    if (supplyDropdown) {
        supplyDropdown.addEventListener('click', toggleDropdown);
    }
}

// Fix the dropdown toggle function
function toggleDropdown() {
    const dropdown = document.querySelector('.dropdown');
    const dropdownMenu = document.getElementById("supplyDropdownMenu");

    if (dropdown && dropdownMenu) {
        dropdown.classList.toggle('open');
        dropdownMenu.classList.toggle('show');
    }
}

// Update the switchSection function to handle dropdown items
function switchSection(sectionName) {
    // Hide all content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav items
    document.querySelectorAll('.nav-item, .dropdown-toggle, .dropdown-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Add active class to appropriate nav item
    const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');

        // If it's a dropdown item, also highlight the main dropdown
        if (activeNavItem.classList.contains('dropdown-item')) {
            const dropdownToggle = document.querySelector('.dropdown-toggle');
            if (dropdownToggle) {
                dropdownToggle.classList.add('active');
            }
        }
    }

    currentSection = sectionName;

    // Load section-specific data
    loadSectionData(sectionName);
}

// Initialize dropdown functionality properly
document.addEventListener('DOMContentLoaded', function() {
    // Setup dropdown toggle
    const supplyDropdown = document.getElementById('supplyDropdown');
    if (supplyDropdown) {
        supplyDropdown.addEventListener('click', function(e) {
            e.preventDefault();
            toggleDropdown();
        });
    }

    // Setup dropdown menu items
    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section) {
                switchSection(section);
            }
        });
    });


    // Initialize all other modules
    initializeNavigation();
    initializeSales();
    initializeProducts();
    initializeSupplies();
    initializeSuppliers();
    initializeUsers();
    setupModalClosing();
    updateDashboardStats();
    switchSection('dashboard');
});


function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'sales':
            renderSales();
            break;
        case 'products':
            renderCategories();
            showCategoryView();
            break;
        case 'supply-list':
            renderSupplies(); // Read-only supply list
            break;
        case 'added-supply':
            renderAddedSupplies(); // Full CRUD functionality
            break;
        case 'suppliers':
            renderSuppliers();
            break;
        case 'user-management':
            renderUsers();
            break;
        case 'dashboard':
            updateDashboardStats();
            break;
    }
}


// Dashboard Functions
function updateDashboardStats() {
    const totalProductsEl = document.getElementById('totalProducts');
    const totalSuppliersEl = document.getElementById('totalSuppliers');
    const totalSalesEl = document.getElementById('totalSales');

    if (totalProductsEl) totalProductsEl.textContent = data.products.length;
    if (totalSuppliersEl) totalSuppliersEl.textContent = data.suppliers.length;
    if (totalSalesEl) totalSalesEl.textContent = data.sales.length;
}

// Sales Functions
function initializeSales() {
    const addSaleBtn = document.getElementById('addSaleBtn');
    const saleForm = document.getElementById('saleForm');
}

function renderSales() {
    const tbody = document.getElementById('salesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    data.sales.forEach((sale, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${sale.productName}</td>
            <td>${sale.quantity}</td>
            <td>${sale.enteredBy}</td>
            <td>${sale.date}</td>
            <td class="action-btns">
                <button class="btn btn-success" onclick="editSale(${sale.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteSale(${sale.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function saveSale(e) {
    e.preventDefault();

    const productName  = document.getElementById('saleProductName').value.trim();
    const quantity     = parseInt(document.getElementById('saleQuantityInput').value, 10);
    const enteredBy    = document.getElementById('saleEnteredBy').value.trim();          // ← new
    const date         = formatDate();

    if (!productName || !enteredBy || quantity < 1) {
      alert('Please fill in all required fields');
      return;
    }

    const saleData = {
      id: currentEditingId || generateId(),
      productName,
      quantity,
      enteredBy,     // ← new
      date
    };

    if (currentEditingId) {
      const idx = data.sales.findIndex(s => s.id === currentEditingId);
      if (idx > -1) data.sales[idx] = saleData;
    } else {
      data.sales.push(saleData);
    }

    saveToLocalStorage('salesData', data.sales);
    renderSales();
    closeModal('saleModal');
    updateDashboardStats();
  }


  function editSale(id) {
    const sale = data.sales.find(s => s.id === id);
    if (!sale) return;
    document.getElementById('saleProductName').value   = sale.productName;
    document.getElementById('saleEnteredBy').value     = sale.enteredBy;
    document.getElementById('saleQuantityInput').value = sale.quantity;   // ← set .value
    document.getElementById('saleModalTitle').textContent = 'Edit Sale';
    currentEditingId = id;
    openModal('saleModal');
  }


function deleteSale(id) {
    if (confirm('Are you sure you want to delete this sale?')) {
        data.sales = data.sales.filter(sale => sale.id !== id);
        saveToLocalStorage('salesData', data.sales);
        renderSales();
        updateDashboardStats();
    }
}

// Alternative Sales Functions (from sales.js reference)
function addSale() {
    const name = document.getElementById("productName")?.value;
    const qty = document.getElementById("quantity")?.textContent;
    const addOn = document.getElementById("addOn")?.value;
    const addOnQty = document.getElementById("addOnQty")?.textContent;
    const date = new Date().toLocaleString("en-US", {
        month: "short", day: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
    });

    if (!name) {
        alert('Please enter a product name');
        return;
    }

    const table = document.getElementById("salesTableBody");
    if (table) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${data.sales.length + 1}</td>
            <td><strong>${name}</strong></td>
            <td>${qty}</td>
            <td>${date}</td>
            <td class="actions">
                <button class="edit-btn" onclick="editSale(this)">✏️</button>
                <button class="delete-btn" onclick="deleteSale(this)">🗑️</button>
            </td>
        `;
        table.appendChild(row);

        // Add to data array
        data.sales.push({
            id: generateId(),
            productName: name,
            quantity: parseInt(qty),
            addOn: addOn,
            addOnQty: parseInt(addOnQty),
            date: date
        });

        saveToLocalStorage('salesData', data.sales);
        closeModal('modal');
    }
}

function resetForm() {
    const productName = document.getElementById("productName");
    const addOn = document.getElementById("addOn");
    const quantity = document.getElementById("quantity");
    const addOnQty = document.getElementById("addOnQty");

    if (productName) productName.value = "Ice Americano";
    if (addOn) addOn.value = "Vanilla Syrup";
    if (quantity) quantity.textContent = "1";
    if (addOnQty) addOnQty.textContent = "1";
}

function deleteRow(button) {
    if (confirm("Are you sure you want to delete this sale?")) {
        const row = button.closest("tr");
        row.remove();
    }
}

// Products Functions
function initializeProducts() {
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const addProductBtn = document.getElementById('addProductBtn');
    const categoryForm = document.getElementById('categoryForm');
    const productForm = document.getElementById('productForm');
    const backToCategoriesBtn = document.getElementById('backToCategoriesBtn');

    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => openModal('categoryModal'));
    }

    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            const hiddenInput = document.getElementById('hiddenCategoryId');
            if (hiddenInput) hiddenInput.value = currentCategoryName;
            openModal('productModal');
        });
    }

    if (categoryForm) {
        categoryForm.addEventListener('submit', saveCategory);
    }

    if (productForm) {
        productForm.addEventListener('submit', saveProduct);
    }

    if (backToCategoriesBtn) {
        backToCategoriesBtn.addEventListener('click', showCategoryView);
    }

    // Initialize category dropdown
    updateProductCategoryDropdown();
}

function renderCategories() {
    const tbody = document.getElementById('categoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    data.categories.forEach((category, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${category}</td>
            <td class="action-btns">
                <button class="btn btn-success" onclick="showProducts('${category}')">
                    View Products
                </button>
                <button class="btn btn-danger" onclick="deleteCategory(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Update product category dropdown
    updateProductCategoryDropdown();
}

// Add this new function after renderCategories
function updateProductCategoryDropdown() {
    const categorySelect = document.getElementById('productCategory');
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        data.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }
}

function renderProducts(categoryFilter = null) {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    let productsToShow = categoryFilter
        ? data.products.filter(product => product.category === categoryFilter)
        : data.products;

    productsToShow.forEach((product, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${product.name}</td>
            <td>${product.size || 'N/A'}</td>
            <td>
                <button class="action-btn view-btn" onclick="showIngredients(${product.id})">
                    View Ingredients
                </button>
                <button class="action-btn delete-btn" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Ingredients Modal Functions
function showIngredients(productId) {
    const product = data.products.find(p => p.id === productId);
    if (!product) return;

    // Set modal title
    const modalTitle = document.getElementById('ingredientsModalTitle');
    if (modalTitle) {
        modalTitle.textContent = `${product.name} - Ingredients`;
    }

    // Populate ingredients content
    const ingredientsContent = document.getElementById('ingredientsContent');
    if (ingredientsContent && product.ingredients) {
        ingredientsContent.innerHTML = product.ingredients.map(ingredient => `
            <div class="ingredient-item">
                <span class="ingredient-name">${ingredient.name}</span>
                <span class="ingredient-amount">${ingredient.amount}</span>
            </div>
        `).join('');
    } else {
        ingredientsContent.innerHTML = '<p>No ingredients data available.</p>';
    }

    // Show modal
    openModal('ingredientsModal');
}

function saveCategory(e) {
    e.preventDefault();

    const categoryName = document.getElementById('categoryName')?.value;

    if (!categoryName) {
        alert('Please enter a category name');
        return;
    }

    if (currentEditingId) {
        // Edit existing category
        const index = data.categories.findIndex((cat, idx) => idx === currentEditingId);
        if (index !== -1) {
            data.categories[index] = categoryName;
        }
    } else {
        // Add new category
        data.categories.push(categoryName);
    }

    saveToLocalStorage('categoriesData', data.categories);
    renderCategories();
    closeModal('categoryModal');
}

function saveProduct(e) {
    e.preventDefault();

    const productName = document.getElementById('productName')?.value;
    const productSize = document.getElementById('productSize')?.value;
    const category = document.getElementById('hiddenCategoryId')?.value;
    const categoryId = document.getElementById('hiddenCategoryId')?.value;

    if (!productName || !productSize || !categoryId) {
    alert('Please fill in all required fields');
    return;
    }

    const productData = {
        id: currentEditingId || generateId(),
        name: productName,
        size: productSize,
        category: categoryId,
        stock: 0,
        ingredients: []
    };

    const newProduct = {
        name: productName,
        size: productSize,
        categoryId: categoryId // pulled from hidden input
    };

    addProductToTable(newProduct);

    if (currentEditingId) {
        const index = data.products.findIndex(product => product.id === currentEditingId);
        if (index !== -1) {
            data.products[index] = productData;
        }
    } else {
        data.products.push(productData);
    }

    saveToLocalStorage('productsData', data.products);
    renderProducts();
    closeModal('productModal');
    updateDashboardStats();

    // Clear form
    document.getElementById('productForm').reset();
    console.log("Adding Product:", productData);

}


function editProduct(id) {
    const product = data.products.find(p => p.id === id);
    if (product) {
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productModalTitle').textContent = 'Edit Product';
        currentEditingId = id;
        openModal('productModal');
    }
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        data.products = data.products.filter(product => product.id !== id);
        saveToLocalStorage('productsData', data.products);
        renderProducts();
        updateDashboardStats();
    }
}

function showProducts(category) {
    showProductView();
    renderProducts(category);
    currentCategoryName = category;
}

function showCategoryView() {
    const categoryView = document.getElementById('categoryView');
    const productView = document.getElementById('productView');

    if (categoryView) categoryView.style.display = 'block';
    if (productView) productView.style.display = 'none';
}

function showProductView() {
    const categoryView = document.getElementById('categoryView');
    const productView = document.getElementById('productView');

    if (categoryView) categoryView.style.display = 'none';
    if (productView) productView.style.display = 'block';
}

function showProductList() {
    showProductView();
    renderProducts();
}

function showCategoryList() {
    showCategoryView();
    renderCategories();
}

function deleteCategory(index) {
    if (confirm('Are you sure you want to delete this category?')) {
        data.categories.splice(index, 1);
        saveToLocalStorage('categoriesData', data.categories);
        renderCategories();
    }
}

// Supply Functions - Updated for read-only Supply List
function initializeSupplies() {
    const addSupplyBtn = document.getElementById('addSupplyBtn');
    const supplyForm = document.getElementById('supplyForm');

    if (addSupplyBtn) {
        addSupplyBtn.addEventListener('click', () => openModal('supplyModal'));
    }

    if (supplyForm) {
        supplyForm.addEventListener('submit', saveSupply);
    }
}

// Alternative Supply Functions (from supply list reference)
function showAddModal() {
    openModal('addModal');
}

function hideAddModal() {
    closeModal('addModal');
}

function addSupply() {
    const name = document.getElementById("supplyName")?.value;
    const qty = document.getElementById("quantity")?.value;
    const unit = document.getElementById("unit")?.value;

    if (!name || !qty || !unit) {
        alert("All fields required");
        return;
    }

    data.supplies.push({
        id: generateId(),
        name,
        quantity: parseInt(qty),
        unit
    });

    saveToLocalStorage('suppliesData', data.supplies);
    renderSupplies();
    hideAddModal();
}

// Supplier Functions
function initializeSuppliers() {
    const addSupplierBtn = document.getElementById('addSupplierBtn');
    const supplierForm = document.getElementById('supplierForm');

    if (addSupplierBtn) {
        addSupplierBtn.addEventListener('click', () => openModal('supplierModal'));
    }

    if (supplierForm) {
        supplierForm.addEventListener('submit', saveSupplier);
    }
}

function renderSuppliers() {
  fetch('suppliers_api.php?action=load')
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              const tbody = document.getElementById('supplierTableBody');
              tbody.innerHTML = '';

              data.data.forEach((supplier, index) => {
                  const row = document.createElement('tr');
                  row.innerHTML = `
                      <td>${index + 1}</td>
                      <td>${escapeHtml(supplier.supply_name)}</td>
                      <td>${escapeHtml(supplier.supplier_name)}</td>
                      <td>${escapeHtml(supplier.contact_no || 'N/A')}</td>
                      <td class="action-btns">
                          <button class="btn btn-success" onclick="editSupplier(${supplier.supply_supplier_id}, '${escapeHtml(supplier.supplier_name)}', '${escapeHtml(supplier.contact_no || '')}', '${escapeHtml(supplier.supply_name)}')">
                              <i class="fas fa-edit"></i>
                          </button>
                          <button class="btn btn-sm btn-danger" onclick="deleteSupplier(${supplier.supply_supplier_id})">
                              <i class="fas fa-trash"></i>
                          </button>
                      </td>
                  `;
                  tbody.appendChild(row);
              });
          } else {
              console.error('Failed to load suppliers:', data.error);
              showNotification('Failed to load suppliers', 'error');
          }
      })
      .catch(error => {
          console.error('Error loading suppliers:', error);
          showNotification('Error loading suppliers', 'error');
      });
}

function saveSupplier(event) {
  event.preventDefault();

  const isEdit = document.getElementById('supplierModalTitle').textContent === 'Edit Supplier';
  const supplyName = document.getElementById('supplierSupplyName').value.trim();
  const supplierName = document.getElementById('supplierName').value.trim();
  const contactNumber = document.getElementById('supplierNumber').value.trim();

  if (!supplyName || !supplierName) {
      showNotification('Please fill in all required fields', 'error');
      return;
  }

  const data = {
      supplyName: supplyName,
      supplierName: supplierName,
      contactNumber: contactNumber
  };

  if (isEdit) {
      data.supply_supplier_id = parseInt(document.getElementById('supplierForm').dataset.editId);
  }

  const url = isEdit ? 'suppliers_api.php?action=update' : 'suppliers_api.php?action=add';
  const method = isEdit ? 'PUT' : 'POST';

  fetch(url, {
      method: method,
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          showNotification(data.message, 'success');
          closeModal('supplierModal');
          renderSuppliers();
          document.getElementById('supplierForm').reset();
      } else {
          showNotification(data.error || 'Operation failed', 'error');
      }
  })
  .catch(error => {
      console.error('Error:', error);
      showNotification('An error occurred', 'error');
  });
}

function editSupplier(supplySupplierID, supplierName, contactNumber, supplyName) {
  document.getElementById('supplierModalTitle').textContent = 'Edit Supplier';
  document.getElementById('supplierSupplyName').value = supplyName;
  document.getElementById('supplierName').value = supplierName;
  document.getElementById('supplierNumber').value = contactNumber;

  // Make sure the supply name field is editable in edit mode
  document.getElementById('supplierSupplyName').removeAttribute('readonly');
  document.getElementById('supplierSupplyName').removeAttribute('disabled');

  document.getElementById('supplierForm').dataset.editId = supplySupplierID;
  openModal('supplierModal');
}

function deleteSupplier(supplySupplierID) {
  if (!confirm('Are you sure you want to remove this supplier?')) {
      return;
  }

  fetch('suppliers_api.php?action=delete', {
      method: 'DELETE',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ supply_supplier_id: supplySupplierID })
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          showNotification(data.message, 'success');
          renderSuppliers();
      } else {
          showNotification(data.error || 'Failed to remove supplier', 'error');
      }
  })
  .catch(error => {
      console.error('Error:', error);
      showNotification('An error occurred', 'error');
  });
}

function filterSuppliers() {
  const searchTerm = document.getElementById('supplierSearch').value.toLowerCase();
  const tbody = document.getElementById('supplierTableBody');
  const rows = tbody.getElementsByTagName('tr');

  for (let row of rows) {
      const cells = row.getElementsByTagName('td');
      let found = false;

      // Search in supply name, supplier name, and contact number
      for (let i = 1; i <= 3; i++) {
          if (cells[i] && cells[i].textContent.toLowerCase().includes(searchTerm)) {
              found = true;
              break;
          }
      }

      row.style.display = found ? '' : 'none';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


// User Management Functions
function initializeUsers() {
    const addUserBtn = document.getElementById('addUserBtn');
    const userForm = document.getElementById('userForm');

    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => openModal('userModal'));
    }

    if (userForm) {
        userForm.addEventListener('submit', saveUser);
    }
}

// Close modal when clicking outside
function setupModalClosing() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
                currentEditingId = null;
                resetModalTitles();
            }
        });
    });
}

function addProductToTable(product) {
    const tableBody = document.getElementById('productTableBody');

    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${tableBody.children.length + 1}</td>
        <td>${product.name}</td>
        <td>${product.size}</td>
        <td>
            <button class="btn btn-secondary btn-sm">Edit</button>
            <button class="btn btn-danger btn-sm">Delete</button>
        </td>
    `;

    tableBody.appendChild(newRow);
}

function confirmLogout(event) {
    event.preventDefault();
    openModal('logoutConfirmModal');
  }

  function performLogout() {
    closeModal('logoutConfirmModal');
    // You can redirect to your login page or clear localStorage here
    window.location.href = "logout.php"; // Adjust as needed
  }

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize navigation
    initializeNavigation();

    // Initialize all modules
    initializeSales();
    initializeProducts();
    initializeSupplies();
    initializeSuppliers();
    initializeUsers();

    // Setup modal closing
    setupModalClosing();

    // Load initial data
    updateDashboardStats();

    // Default section is dashboard, make sure it's active
    switchSection('dashboard');
});

// Supply List Functions (Read-only)
function renderSupplies() {
  fetch('supply_list.php')
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              const tbody = document.getElementById('supplyTableBody');
              tbody.innerHTML = '';

              data.data.forEach((supply, index) => {
                  const row = document.createElement('tr');
                  row.innerHTML = `
                      <td>${index + 1}</td>
                      <td>${supply.supply_name}</td>
                      <td>${supply.quantity}</td>
                      <td>${supply.unit}</td>
                  `;
                  tbody.appendChild(row);
              });
          } else {
              console.error('Error loading supplies:', data.error);
              showAlert('Error loading supplies: ' + data.error, 'error');
          }
      })
      .catch(error => {
          console.error('Error:', error);
          showAlert('Error loading supplies', 'error');
      });
}

// Filter functions
function filterSupplies() {
  const searchTerm = document.getElementById('supplySearch').value.toLowerCase();
  const tableRows = document.querySelectorAll('#supplyTableBody tr');

  tableRows.forEach(row => {
      const supplyName = row.cells[1].textContent.toLowerCase();
      const unit = row.cells[3].textContent.toLowerCase();

      if (supplyName.includes(searchTerm) || unit.includes(searchTerm)) {
          row.style.display = '';
      } else {
          row.style.display = 'none';
      }
  });
}

function showAlert(message, type = 'info') {
  const alert = document.createElement('div');
  alert.className = `custom-alert alert-${type}`;
  alert.textContent = message;

  document.body.appendChild(alert);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    alert.remove();
  }, 3000);
}

// notification.js
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function renderAddedSupplies() {
  fetch('added_supply_api.php?action=load')
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              const tbody = document.getElementById('addedSupplyTableBody');
              tbody.innerHTML = '';

              data.data.forEach((supply, index) => {
                  const row = document.createElement('tr');
                  row.innerHTML = `
                      <td>${index + 1}</td>
                      <td>${escapeHtml(supply.supply_name)}</td>
                      <td>${parseFloat(supply.quantity).toFixed(2)}</td>
                      <td>${escapeHtml(supply.unit)}</td>
                      <td>${escapeHtml(supply.received_by)}</td>
                      <td>${formatDate(supply.date_added)}</td>
                      <td class="action-btns">
                          <button class="btn btn-success" onclick="editAddedSupply(${supply.purchase_item_id}, '${escapeHtml(supply.supply_name)}', ${supply.quantity}, '${escapeHtml(supply.unit)}', '${escapeHtml(supply.received_by)}')">
                              <i class="fas fa-edit"></i>
                          </button>
                          <button class="btn btn-sm btn-danger" onclick="deleteAddedSupply(${supply.purchase_item_id})">
                              <i class="fas fa-trash"></i>
                          </button>
                      </td>
                  `;
                  tbody.appendChild(row);
              });
          } else {
              console.error('Failed to load added supplies:', data.error);
              showNotification('Failed to load added supplies', 'error');
          }
      })
      .catch(error => {
          console.error('Error loading added supplies:', error);
          showNotification('Error loading added supplies', 'error');
      });
}

// Add a flag to prevent double submission
let isSubmitting = false;

function saveAddedSupply(event) {
  event.preventDefault();
  event.stopPropagation();

  // Prevent double submission
  if (isSubmitting) {
      return false;
  }

  isSubmitting = true;

  const isEdit = document.getElementById('supplyModalTitle').textContent === 'Edit Supply';
  const supplyName = document.getElementById('supplyName').value.trim();
  const quantity = parseFloat(document.getElementById('supplyQuantity').value);
  const unit = document.getElementById('supplyUnit').value.trim();
  const receivedBy = document.getElementById('supplyReceivedBy').value.trim();

  if (!supplyName || !quantity || quantity <= 0 || !unit || !receivedBy) {
      showNotification('Please fill in all fields with valid values', 'error');
      isSubmitting = false;
      return false;
  }

  const data = {
      supplyName: supplyName,
      quantity: quantity,
      unit: unit,
      receivedBy: receivedBy
  };

  if (isEdit) {
      data.purchase_item_id = parseInt(document.getElementById('supplyForm').dataset.editId);
  }

  const url = isEdit ? 'added_supply_api.php?action=update' : 'added_supply_api.php?action=add';
  const method = isEdit ? 'PUT' : 'POST';

  fetch(url, {
      method: method,
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          showNotification(data.message, 'success');
          closeModal('supplyModal');
          renderAddedSupplies();
          document.getElementById('supplyForm').reset();

          // Reset modal title for next use
          document.getElementById('supplyModalTitle').textContent = 'Add Supply';
          delete document.getElementById('supplyForm').dataset.editId;
      } else {
          showNotification(data.error || 'Operation failed', 'error');
      }
  })
  .catch(error => {
      console.error('Error:', error);
      showNotification('An error occurred', 'error');
  })
  .finally(() => {
      // Reset the flag after the request completes
      isSubmitting = false;
  });

  return false;
}

function editAddedSupply(purchaseItemId, supplyName, quantity, unit, receivedBy) {
  document.getElementById('supplyModalTitle').textContent = 'Edit Supply';
  document.getElementById('supplyName').value = supplyName;
  document.getElementById('supplyQuantity').value = quantity;
  document.getElementById('supplyUnit').value = unit;
  document.getElementById('supplyReceivedBy').value = receivedBy;
  document.getElementById('supplyForm').dataset.editId = purchaseItemId;
  openModal('supplyModal');
}

function deleteAddedSupply(purchaseItemId) {
  if (!confirm('Are you sure you want to delete this supply entry? This will also reduce the inventory quantity.')) {
      return;
  }

  fetch('added_supply_api.php?action=delete', {
      method: 'DELETE',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ purchase_item_id: purchaseItemId })
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          showNotification(data.message, 'success');
          renderAddedSupplies();
      } else {
          showNotification(data.error || 'Failed to delete supply', 'error');
      }
  })
  .catch(error => {
      console.error('Error:', error);
      showNotification('An error occurred', 'error');
  });
}

function filterAddedSupplies() {
  const searchTerm = document.getElementById('addedSupplySearch').value.toLowerCase();
  const tbody = document.getElementById('addedSupplyTableBody');
  const rows = tbody.getElementsByTagName('tr');

  for (let row of rows) {
      const cells = row.getElementsByTagName('td');
      let found = false;

      // Search in supply name, received by
      for (let i = 1; i <= 4; i++) {
          if (cells[i] && cells[i].textContent.toLowerCase().includes(searchTerm)) {
              found = true;
              break;
          }
      }

      row.style.display = found ? '' : 'none';
  }
}

function saveSupply(event) {
  event.preventDefault();
  event.stopPropagation();

  // Check which section is currently active
  const currentSection = document.querySelector('.content-section.active').id;

  if (currentSection === 'added-supply' || currentSection === 'supply-list') {
      return saveAddedSupply(event);
  } else {
      showNotification('Unknown section', 'error');
      closeModal('supplyModal');
      return false;
  }
}

//User Management Functions
function renderUsers() {
  fetch('user_management.php?action=list')
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              const tbody = document.getElementById('userTableBody');
              tbody.innerHTML = '';

              data.data.forEach((user, index) => {
                  const row = document.createElement('tr');
                  row.innerHTML = `
                      <td>${index + 1}</td>
                      <td>${escapeHtml(user.username)}</td>
                      <td>${escapeHtml(user.email)}</td>
                      <td>${escapeHtml(user.role)}</td>
                      <td class="action-btns">
                          <button class="btn btn-success" onclick="editUser(${user.user_id})">
                              <i class="fas fa-edit"></i> Edit
                          </button>
                          <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.user_id})">
                              <i class="fas fa-trash"></i> Delete
                          </button>
                      </td>
                  `;
                  tbody.appendChild(row);
              });
          } else {
              showNotification('Error loading users: ' + data.error, 'error');
          }
      })
      .catch(error => {
          console.error('Error:', error);
          showNotification('Error loading users', 'error');
      });
}

function saveUser(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const isEdit = document.getElementById('userModalTitle').textContent === 'Edit User';
  const userId = form.dataset.userId;

  const userData = {
      username: document.getElementById('userUsername').value,
      email: document.getElementById('userEmail').value,
      role: document.getElementById('userRole').value
  };

  // Only include password if it's provided (for edits) or if it's a new user
  const password = document.getElementById('userPassword').value;
  if (password || !isEdit) {
      userData.password = password;
  }

  const url = isEdit ?
      `user_management.php?action=update&id=${userId}` :
      'user_management.php?action=create';
  const method = isEdit ? 'PUT' : 'POST';

  fetch(url, {
      method: method,
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          showNotification(data.message, 'success');
          closeModal('userModal');
          renderUsers();
      } else {
          showNotification('Error: ' + data.error, 'error');
      }
  })
  .catch(error => {
      console.error('Error:', error);
      showNotification('Error saving user', 'error');
  });
}

function editUser(userId) {
  fetch(`user_management.php?action=get&id=${userId}`)
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              const user = data.data;

              // Populate form
              document.getElementById('userUsername').value = user.username;
              document.getElementById('userEmail').value = user.email;
              document.getElementById('userRole').value = user.role;
              document.getElementById('userPassword').value = ''; // Clear password field

              // Update modal title and form
              document.getElementById('userModalTitle').textContent = 'Edit User';
              document.getElementById('userForm').dataset.userId = userId;

              // Make password optional for edits
              document.getElementById('userPassword').required = false;

              openModal('userModal');
          } else {
              showNotification('Error loading user: ' + data.error, 'error');
          }
      })
      .catch(error => {
          console.error('Error:', error);
          showNotification('Error loading user', 'error');
      });
}

function deleteUser(userId) {
  if (confirm('Are you sure you want to delete this user?')) {
      fetch(`user_management.php?action=delete&id=${userId}`, {
          method: 'DELETE'
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              showNotification(data.message, 'success');
              renderUsers();
          } else {
              showNotification('Error: ' + data.error, 'error');
          }
      })
      .catch(error => {
          console.error('Error:', error);
          showNotification('Error deleting user', 'error');
      });
  }
}

function filterUsers() {
  const searchTerm = document.getElementById('userSearch').value.toLowerCase();
  const tbody = document.getElementById('userTableBody');
  const rows = tbody.getElementsByTagName('tr');

  for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const username = row.cells[1].textContent.toLowerCase();
      const email = row.cells[2].textContent.toLowerCase();
      const role = row.cells[3].textContent.toLowerCase();

      if (username.includes(searchTerm) || email.includes(searchTerm) || role.includes(searchTerm)) {
          row.style.display = '';
      } else {
          row.style.display = 'none';
      }
  }
}