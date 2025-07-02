// Global Variables
let currentEditingId = null;
let currentSection = 'dashboard';
let isSubmitting = false;

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

    const dropdownItems = document.querySelectorAll('.dropdown-item');

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

    loadSales();
    // Initialize all other modules
    setupAutocomplete('saleProductName', 'productSuggestions', 'get_product_names.php');
    initializeNavigation();
    initializeSales();
    initializeProducts();
    initializeSupplies();
    initializeSuppliers();
    // initializeUsers();
    setupModalClosing();
    updateDashboardStats();
    switchSection('dashboard');
});


function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'sales':
            loadSales();
            // renderSales();
            break;
        case 'products':
            renderCategories();
            showCategoryView();
            break;
        case 'supply-list':
            renderSupplies();
            break;
        case 'added-supply':
            renderAddedSupplies();
            break;
        case 'suppliers':
            renderSuppliers();
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

    if (totalProductsEl) totalProductsEl.textContent = data.products.length;
    if (totalSuppliersEl) totalSuppliersEl.textContent = data.suppliers.length;
    if (totalSalesEl) totalSalesEl.textContent = data.sales.length;
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
            loadSales();
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
        addProductBtn.addEventListener('click', () => openModal('productModal'));
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
}

function renderCategories() {
    const tbody = document.getElementById('categoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    fetch('get_categories.php')
        .then(response => response.json())
        .then(categories => {
            if (!Array.isArray(categories)) return;

            categories.forEach((category, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${category.category_name}</td>
                    <td class="action-btns">
                        <button class="btn btn-success" onclick="showProducts(${category.category_id})">
                            View Products
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error fetching categories:', error);
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
                        <button class="action-btn view-btn" onclick="showIngredients(${product.product_variant_id})">
                            View Ingredients
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
function showIngredients(productVariantId) {
    console.log("clicked")
    const modalTitle = document.getElementById('ingredientsModalTitle');
    const ingredientsContent = document.getElementById('ingredientsContent');

    if (!modalTitle || !ingredientsContent) return;

    fetch(`get_ingredients.php?product_variant_id=${productVariantId}`)
        .then(res => res.json())
        .then(response => {
            if (!response.success) {
                ingredientsContent.innerHTML = `<p>${response.message}</p>`;
                modalTitle.textContent = 'Ingredients';
                return;
            }

            const ingredients = response.data;
            const productName = response.product_name || 'Product';
            const sizeLabel = response.size_label || '';

            modalTitle.textContent = `${productName} (${sizeLabel}) - Ingredients`;

            if (ingredients.length > 0) {
                ingredientsContent.innerHTML = ingredients.map(ingredient => `
                    <div class="ingredient-item">
                        <span class="ingredient-name">${ingredient.name}</span>
                        <span class="ingredient-amount">${ingredient.quantity} ${ingredient.unit}</span>
                    </div>
                `).join('');
            } else {
                ingredientsContent.innerHTML = '<p>No ingredients found for this product.</p>';
            }

            openModal('ingredientsModal');
        })
        .catch(error => {
            console.error('Error fetching ingredients:', error);
            ingredientsContent.innerHTML = '<p>Error loading ingredients.</p>';
            modalTitle.textContent = 'Ingredients';
        });
}

function showProducts(category) {
    showProductView();
    renderProducts(category);
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
    // renderProducts();
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

// Render Supply List (READ-ONLY - No edit/delete actions)
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

function saveSupply(e) {
  e.preventDefault();

  // grab the form values
  const nameEl     = document.getElementById('supplyName');
  const qtyEl      = document.getElementById('supplyQuantity');
  const unitEl     = document.getElementById('supplyUnit');
  const name       = nameEl.value.trim();
  const quantity   = parseInt(qtyEl.value, 10) || 0;
  const unit       = unitEl.value.trim();

  if (!name || !unit) {
    alert('Please fill in all required fields');
    return;
  }

  // build the supply record
  const supplyRecord = {
    id: currentEditingId || generateId(),
    name,
    quantity,
    unit
  };

  if (currentEditingId) {
    // editing existing supply
    const idx = data.supplies.findIndex(s => s.id === currentEditingId);
    if (idx > -1) data.supplies[idx] = supplyRecord;
  } else {
    // adding new supply
    data.supplies.push(supplyRecord);
  }

  // persist & re-render
  saveToLocalStorage('suppliesData', data.supplies);
  renderSupplies();

  // clean up
  closeModal('supplyModal');
  nameEl.value = '';
  qtyEl.value  = '';
  unitEl.value = '';
  currentEditingId = null;
  document.getElementById('supplyModalTitle').textContent = 'Add Supply';
}


function renderAddedSupplies() {
  const tbody = document.getElementById('addedSupplyTableBody');
  tbody.innerHTML = '';

  data.addedSupplies.forEach((s, i) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${i+1}</td>
      <td>${s.name}</td>
      <td>${s.quantity}</td>
      <td>${s.unit}</td>
      <td>${s.receivedBy}</td>
      <td>${s.dateAdded}</td>
      <td class="action-btns">
        <button class="btn btn-success" onclick="editAddedSupply(${s.id})">
          <i class="fas fa-edit"></i>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}



function editAddedSupply(id) {
  const supply = data.addedSupplies.find(s => s.id === id);
  if (supply) {
      document.getElementById('supplyName').value = supply.name;
      document.getElementById('supplyQuantity').value = supply.quantity;
      document.getElementById('supplyUnit').value = supply.unit;
      document.getElementById('supplyModalTitle').textContent = 'Edit Added Supply';
      currentEditingId = id;
      openModal('supplyModal');
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

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize navigation
    initializeNavigation();

    // Initialize all modules
    initializeSales();
    initializeProducts();
    initializeSupplies();

    // Setup modal closing
    setupModalClosing();

    // Load initial data
    updateDashboardStats();

    // Default section is dashboard, make sure it's active
    switchSection('dashboard');
});

function confirmLogout(event) {
    event.preventDefault();
    openModal('logoutConfirmModal');
  }

  function performLogout() {
    closeModal('logoutConfirmModal');
    window.location.href = "logout.php"; // Adjust if you use a different page
  }


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