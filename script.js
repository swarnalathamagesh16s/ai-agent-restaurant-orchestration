// Initial Data
const defaultProducts = [
    { id: 1, name: 'Tamil Magazine Vol.1', category: 'Magazine', price: 150.00, image: 'magazine' },
    { id: 2, name: 'Weekly Newsletter', category: 'Newsletter', price: 50.00, image: 'newsletter' },
    { id: 3, name: 'Tamil Yearbook 2025', category: 'Yearbook', price: 500.00, image: 'yearbook' },
    { id: 4, name: 'Event Flyer Design', category: 'Flyer', price: 250.00, image: 'flyer' }
];

// State
let products = JSON.parse(localStorage.getItem('et_products')) || defaultProducts;
let cart = [];
let sales = JSON.parse(localStorage.getItem('et_sales')) || [];

// DOM Elements
const productsContainer = document.getElementById('products-container');
const cartItemsContainer = document.getElementById('cart-items');
const subtotalEl = document.getElementById('subtotal-price');
const taxEl = document.getElementById('tax-price');
const totalEl = document.getElementById('total-price');
const searchInput = document.getElementById('search-input');
const currentDateEl = document.getElementById('current-date');
const inventoryTableBody = document.getElementById('inventory-table-body');
const salesTableBody = document.getElementById('sales-table-body');
const payModalTotal = document.getElementById('pay-modal-total');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateCartUI();
    updateDate();
    initReports();
});

// Navigation
function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    if (viewName === 'pos') {
        document.getElementById('pos-view').classList.add('active');
        document.querySelector('.nav-btn:nth-child(1)').classList.add('active');
        renderProducts(); // Refresh in case changes were made
    } else if (viewName === 'admin') {
        renderInventory();
        document.getElementById('admin-view').classList.add('active');
        document.querySelector('.nav-btn:nth-child(2)').classList.add('active');
    } else if (viewName === 'reports') {
        generateReport();
        document.getElementById('reports-view').classList.add('active');
        document.querySelector('.nav-btn:nth-child(3)').classList.add('active');
    }
}

function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.innerText = new Date().toLocaleDateString('en-US', options);
}

// --- POS Logic ---

function renderProducts(filterText = '') {
    productsContainer.innerHTML = '';

    const filtered = products.filter(p => p.name.toLowerCase().includes(filterText.toLowerCase()));

    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => addToCart(product.id);

        const colorMap = {
            'Magazine': '#e74c3c',
            'Newsletter': '#3498db',
            'Yearbook': '#f1c40f',
            'Flyer': '#9b59b6',
            'Other': '#34495e'
        };
        const bg = colorMap[product.category] || '#95a5a6';

        // Using icon mapping
        const iconMap = {
            'Magazine': 'fa-book-open',
            'Newsletter': 'fa-newspaper',
            'Yearbook': 'fa-graduation-cap',
            'Flyer': 'fa-paper-plane',
            'Other': 'fa-box'
        };
        const icon = iconMap[product.category] || 'fa-box';

        card.innerHTML = `
            <div class="product-img" style="background-color: ${bg}; display: flex; align-items: center; justify-content: center; color: white;">
                <i class="fa-solid ${icon}" style="font-size: 2.5rem;"></i>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-category">${product.category}</p>
                <div class="product-price">₹${parseFloat(product.price).toFixed(2)}</div>
            </div>
        `;
        productsContainer.appendChild(card);
    });
}

function filterProducts() {
    renderProducts(searchInput.value);
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-msg">
                <i class="fa-solid fa-basket-shopping"></i>
                <p>Cart is empty</p>
            </div>
        `;
    }

    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>₹${item.price} x ${item.qty}</p>
            </div>
            <div class="cart-item-actions">
                <button class="qty-btn" onclick="changeQty(${item.id}, -1)">-</button>
                <span>${item.qty}</span>
                <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        cartItemsContainer.appendChild(div);
    });

    calculateTotals();
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        removeFromCart(id);
    } else {
        updateCartUI();
    }
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    updateCartUI();
}

function clearCart() {
    cart = [];
    updateCartUI();
}

function calculateTotals() {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    subtotalEl.innerText = `₹${subtotal.toFixed(2)}`;
    taxEl.innerText = `₹${tax.toFixed(2)}`;
    totalEl.innerText = `₹${total.toFixed(2)}`;
    payModalTotal.innerText = `₹${total.toFixed(2)}`;
}

// --- Payment & Billing ---

function showPaymentModal() {
    if (cart.length === 0) {
        alert("Cart is empty!");
        return;
    }
    document.getElementById('payment-modal').style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function processPayment() {
    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0) * 1.05;
    const order = {
        id: Date.now(),
        date: new Date().toISOString(),
        items: [...cart],
        total: total
    };

    sales.push(order);
    localStorage.setItem('et_sales', JSON.stringify(sales));

    const printArea = document.getElementById('print-area');
    const dateStr = new Date().toLocaleString();
    let itemsHtml = '';
    cart.forEach(item => {
        itemsHtml += `
            <tr>
                <td>${item.name} <br> <small>x${item.qty}</small></td>
                <td style="text-align:right">₹${(item.price * item.qty).toFixed(2)}</td>
            </tr>
        `;
    });

    printArea.innerHTML = `
        <div class="bill-header">
            <h3>Endrum Tamil</h3>
            <p>Digital Design Studio</p>
            <p>${dateStr}</p>
            <p>Order #${order.id.toString().slice(-6)}</p>
        </div>
        <table class="bill-items">
            ${itemsHtml}
        </table>
        <div class="bill-total">
            Total Includes 5% Tax<br>
            <strong>Grand Total: ₹${total.toFixed(2)}</strong>
        </div>
        <div class="bill-footer">
            <p>Thank you for choosing Endrum Tamil!</p>
            <p>www.endrumtamil.com</p>
        </div>
    `;

    clearCart();
    closeModal('payment-modal');
    setTimeout(() => window.print(), 500); // Small delay to ensure render
}

// --- Admin Logic (CRUD) ---

function renderInventory() {
    inventoryTableBody.innerHTML = '';
    products.forEach(p => {
        const tr = document.createElement('tr');
        const colorMap = { 'Magazine': '#e74c3c', 'Newsletter': '#3498db', 'Yearbook': '#f1c40f', 'Flyer': '#9b59b6' };
        const bg = colorMap[p.category] || '#95a5a6';

        tr.innerHTML = `
            <td><div style="width:30px;height:30px;background:${bg};border-radius:4px;"></div></td>
            <td>${p.name}</td>
            <td>${p.category}</td>
            <td>₹${p.price.toFixed(2)}</td>
            <td>
                <button class="action-btn" onclick="openProductModal(${p.id})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="action-btn delete" onclick="deleteProduct(${p.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        inventoryTableBody.appendChild(tr);
    });
}

function openProductModal(editId = null) {
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');

    if (editId) {
        title.innerText = "Edit Product";
        const p = products.find(x => x.id === editId);
        document.getElementById('prod-id').value = p.id;
        document.getElementById('prod-name').value = p.name;
        document.getElementById('prod-category').value = p.category;
        document.getElementById('prod-price').value = p.price;
        document.getElementById('prod-image-select').value = p.image || 'default';
    } else {
        title.innerText = "Add Product";
        form.reset();
        document.getElementById('prod-id').value = '';
    }

    document.getElementById('product-modal').style.display = 'flex';
}

function handleProductSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const name = document.getElementById('prod-name').value;
    const category = document.getElementById('prod-category').value;
    const price = parseFloat(document.getElementById('prod-price').value);
    const imgSelect = document.getElementById('prod-image-select').value;

    if (id) {
        // Update
        const idx = products.findIndex(p => p.id == id);
        if (idx !== -1) {
            products[idx] = { ...products[idx], name, category, price, image: imgSelect };
        }
    } else {
        // Create
        const newProduct = {
            id: Date.now(),
            name,
            category,
            price,
            image: imgSelect
        };
        products.push(newProduct);
    }

    localStorage.setItem('et_products', JSON.stringify(products));

    closeModal('product-modal');
    renderInventory();
    renderProducts();
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem('et_products', JSON.stringify(products));
        renderInventory();
        renderProducts();
    }
}

// --- Reports Logic ---
function initReports() {
    const monthSelect = document.getElementById('report-month');
    const d = new Date();
    // Simplified: Just showing 'Current Month' concept
    // In real app, loop and adding options
}

function generateReport() {
    const totalSales = sales.reduce((acc, order) => acc + order.total, 0);
    const totalOrders = sales.length;

    // Top Product
    const productCounts = {};
    sales.forEach(order => {
        order.items.forEach(item => {
            productCounts[item.name] = (productCounts[item.name] || 0) + item.qty;
        });
    });

    let topProd = '-';
    let maxCount = 0;
    for (const [name, count] of Object.entries(productCounts)) {
        if (count > maxCount) {
            maxCount = count;
            topProd = name;
        }
    }

    document.getElementById('report-total-sales').innerText = '₹' + totalSales.toFixed(2);
    document.getElementById('report-total-orders').innerText = totalOrders;
    document.getElementById('report-top-product').innerText = topProd;

    salesTableBody.innerHTML = '';
    const recentSales = sales.slice().reverse().slice(0, 10);
    recentSales.forEach(order => {
        const itemNames = order.items.map(i => i.name).join(', ');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${order.id.toString().slice(-6)}</td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td>${itemNames}</td>
            <td>₹${order.total.toFixed(2)}</td>
        `;
        salesTableBody.appendChild(tr);
    });
}

function printReport() {
    window.print();
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}
