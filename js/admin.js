// Global Variables
let currentEditingId = null;
let currentSection = 'dashboard';

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

// ======================== not used function ============================================================
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

function switchSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    document.querySelectorAll('.nav-item, .dropdown-toggle, .dropdown-item').forEach(item => {
        item.classList.remove('active');
    });

    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }

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

document.addEventListener('DOMContentLoaded', function() {
    const supplyDropdown = document.getElementById('supplyDropdown');
    if (supplyDropdown) {
        supplyDropdown.addEventListener('click', function(e) {
            e.preventDefault();
            toggleDropdown();
        });
    }

    const dropdownItems = document.querySelectorAll('.dropdown-item');

    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section) {
                switchSection(section);
            }
        });
    });

    loadSales();
    loadCategories();
    // Initialize all other modules
    console.log('DOM fully loaded ✅');
    setupAutocomplete('saleProductName', 'productSuggestions', 'get_product_names.php');
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
            loadSales();
            // setupAutocomplete('saleProductName', 'productSuggestions', 'get_product_names.php');
            break;
        case 'products':
            loadCategories();
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

function setupAutocomplete(inputId, suggestionBoxId, dataUrl) {
    const input = document.getElementById(inputId);
    const suggestionsBox = document.getElementById(suggestionBoxId);
    let suggestionsData = [];

    // Fetch suggestions (e.g. product names)
    fetch(dataUrl)
        .then(res => res.json())
        .then(data => {
            suggestionsData = data;
        });

    // 🟩 This listens for user typing
    input.addEventListener('input', () => {
        const query = input.value.toUpperCase();
        console.log("Query:", query);
        suggestionsBox.innerHTML = '';

        if (query.length === 0) {
            suggestionsBox.style.display = 'none';
            return;
        }

        const matches = suggestionsData.filter(item =>
            item.toUpperCase().startsWith(query)
        );

        console.log(matches)

        if (matches.length === 0) {
            suggestionsBox.style.display = 'none';
            return;
        }

        matches.forEach(name => {
            const item = document.createElement('div');
            item.textContent = name;
            item.classList.add('autocomplete-item');
            item.addEventListener('click', () => {
                input.value = name;
                suggestionsBox.innerHTML = '';
                suggestionsBox.style.display = 'none';
            });
            suggestionsBox.appendChild(item);
        });

        suggestionsBox.style.display = 'block';
    });

    input.addEventListener('blur', () => {
        // Wait a moment to allow click on suggestion before hiding
        setTimeout(() => {
            suggestionsBox.innerHTML = '';
            suggestionsBox.style.display = 'none';
        }, 200);
    });
}

// Dashboard Functions
function updateDashboardStats() {
    const totalProductsEl = document.getElementById('totalProducts');
    const totalSuppliersEl = document.getElementById('totalSuppliers');
    const totalSalesEl = document.getElementById('totalSales');

    // if (totalProductsEl) totalProductsEl.textContent = data.products.length;
    // if (totalSuppliersEl) totalSuppliersEl.textContent = data.suppliers.length;
    // if (totalSalesEl) totalSalesEl.textContent = data.sales.length;
}

// Sales Functions
function initializeSales() {
    const addSaleBtn = document.getElementById('addSaleBtn');
    const saleForm = document.getElementById('saleForm');
}

function loadSales() {
    fetch('get_sales.php')
        .then(response => response.json())
        .then(data => {
            window.salesData = data;
            renderSales(data);
        })
        .catch(error => {
            console.error('Error fetching sales:', error);
        });
}


function renderSales(salesList = window.salesData) {
    const tbody = document.getElementById('salesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    salesList.forEach((sale, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${sale.product_name} (${sale.size_label})</td>
            <td>${sale.quantity_sold}</td>
            <td>${sale.entered_by}</td>
            <td>${sale.usage_date}</td>
            <td class="action-btns">
                <button class="btn btn-success" onclick="editSale(${sale.usage_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteSale(${sale.usage_id})">
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
    const productSize  = document.getElementById('saleProductSize').value;
    const quantity     = parseInt(document.getElementById('saleQuantityInput').value, 10);
    const enteredBy    = document.getElementById('saleEnteredBy').value.trim();

    if (!productName || !productSize || !enteredBy || quantity < 1) {
        alert('Please fill in all required fields');
        return;
    }

    // Prepare data to send
    const formData = new FormData();
    formData.append('usage_id', currentEditingId || '');
    formData.append('product_name', productName);
    formData.append('size_label', productSize);
    formData.append('quantity_sold', quantity);
    formData.append('entered_by', enteredBy);

    fetch('save_sale.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(response => {
        if (response.success) {
            alert('Sale saved successfully!');
            closeModal('saleModal');
            currentEditingId = null;
            loadSales(); // Re-fetch updated list
        } else {
            alert('Failed to save sale: ' + response.message);
        }
    })
    .catch(error => {
        console.error('Error saving sale:', error);
        alert('Error saving sale. See console for details.');
    });
}



function editSale(id) {
    console.log("clicked", id);

    const sale = window.salesData.find(s => s.usage_id == id);
    if (!sale) {
        console.warn("Sale not found for ID:", id);
        return;
    }

    document.getElementById('saleProductName').value   = sale.product_name;
    document.getElementById('saleProductSize').value   = sale.size_label;
    document.getElementById('saleEnteredBy').value     = sale.entered_by;
    document.getElementById('saleQuantityInput').value = sale.quantity_sold;
    document.getElementById('saleModalTitle').textContent = 'Edit Sale';

    currentEditingId = id;
    openModal('saleModal');
}

function deleteSale(id) {
    if (!confirm('Are you sure you want to delete this sale?')) return;

    fetch('delete_sale.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usage_id: id })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('Sale deleted successfully');
            loadSales();
            updateDashboardStats();
        } else {
            alert('Failed to delete sale: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Delete error:', error);
        alert('An error occurred while deleting the sale.');
    });
}

function filterSales() {
    const input = document.getElementById('salesSearch');
    const searchTerm = input.value.toLowerCase().trim();

    const filtered = window.salesData.filter(sale => {
        const text = `${sale.product_name} ${sale.size_label} ${sale.entered_by} ${sale.usage_date}`.toLowerCase();
        return text.includes(searchTerm);
    });

    renderSales(filtered);
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

// =================== Products Functions =================== //
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

    if (productForm) {
        productForm.addEventListener('submit', saveProduct);
    }

    if (backToCategoriesBtn) {
        backToCategoriesBtn.addEventListener('click', showCategoryView);
    }
}

function loadCategories() {
    fetch('get_categories.php')
        .then(res => res.json())
        .then(data => {
            window.categoriesData = data;
            renderCategories(data);
        })
        .catch(error => {
            console.error('Error fetching categories:', error);
        });
}

function renderCategories(categoryList = window.categoriesData) {
    const tbody = document.getElementById('categoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    categoryList.forEach((category, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${category.category_name}</td>
            <td class="action-btns">
                <button class="btn btn-success" onclick="showProducts(${category.category_id})">
                    View Products
                </button>
                <button class="btn btn-success" onclick="editCategory(${category.category_id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteCategory(${category.category_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function editCategory(id) {
    const category = window.categoriesData.find(c => c.category_id == id);
    console.log("Editing Category:", category);
    if (!category) {
        console.warn('Category not found for ID:', id);
        return;
    }
    document.getElementById('categoryName').value = category.category_name;
    document.getElementById('categoryModalTitle').textContent = 'Edit Category';
    currentEditingId = id;

    openModal('categoryModal');
}

function saveCategory(e) {
    e.preventDefault();

    const categoryName = document.getElementById('categoryName').value.trim();
    if (!categoryName) {
        alert('Category name is required');
        return;
    }

    const formData = new FormData();
    formData.append('category_id', currentEditingId || '');
    formData.append('category_name', categoryName);

    fetch('save_category.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(response => {
        if (response.success) {
            alert('Category saved successfully!');
            closeModal('categoryModal');
            currentCategoryEditingId = null;
            loadCategories();
        } else {
            alert('Failed to save category: ' + response.message);
        }
    })
    .catch(err => {
        console.error('Error saving category:', err);
        alert('Error occurred while saving category.');
    });
}

function deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category?')) return;

    fetch('delete_category.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category_id: id })
    })
    .then(res => res.json())
    .then(result => {
        if (result.success) {
            alert('Category deleted successfully');
            loadCategories();
        } else {
            alert('Failed to delete category: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Error deleting category:', error);
        alert('An error occurred while deleting the category.');
    });
}

function renderProducts(categoryId) {
    const tbody = document.getElementById('productTableBody');
    if (!tbody || !categoryId) return;

    tbody.innerHTML = '';

    fetch(`get_products.php?category_id=${categoryId}`)
        .then(res => res.json())
        .then(response => {
            if (!response.success) {
                console.error('Fetch error:', response.message);
                return;
            }

            const products = response.data;

            products.forEach((product, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${product.product_name}</td>
                    <td>${product.size_label || 'N/A'}</td>
                    <td>
                        <button class="btn btn-success" onclick="showIngredients(${product.product_variant_id})">
                            View Ingredients
                        </button>
                        <button class="btn btn-primary" onclick="editProduct(${product.product_variant_id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger" onclick="deleteProduct(${product.product_variant_id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading products:', error);
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