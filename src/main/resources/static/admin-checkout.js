// ⚙️ Configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Get order ID from URL parameter (?orderId=1)
const urlParams = new URLSearchParams(window.location.search);
const ORDER_ID = urlParams.get('orderId');

let currentOrder = null;
let currentPayment = null;

// 📅 Format date (Thai Buddhist calendar)
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = getThaiMonth(date.getMonth());
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
}

function getThaiMonth(monthIndex) {
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return months[monthIndex];
}

// ⏰ Format time
function formatTime(timeString) {
    if (!timeString) return '-';
    if (timeString.includes('T')) {
        const date = new Date(timeString);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    return timeString.substring(0, 5);
}

// 🖼️ Open slip modal
function openSlipModal(slipUrl) {
    const modal = document.getElementById('slipModal');
    const img = document.getElementById('slipImage');
    img.src = slipUrl;
    modal.classList.add('active');
}

// ❌ Close slip modal
function closeSlipModal() {
    const modal = document.getElementById('slipModal');
    modal.classList.remove('active');
}

// Click outside to close
document.getElementById('slipModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeSlipModal();
    }
});

// 👤 Get username from User API
async function getUsername(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`);
        if (response.ok) {
            const user = await response.json();
            return user.username || `User${userId}`;
        }
    } catch (error) {
        console.error('Error fetching user:', error);
    }
    return `User${userId}`;
}

// 💳 Get payment for order
async function getPaymentForOrder(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/payments/order/${orderId}`);
        if (response.ok) {
            const payments = await response.json();
            // Return first payment if array, or the payment itself
            return Array.isArray(payments) ? payments[0] : payments;
        }
    } catch (error) {
        console.error('Error fetching payment:', error);
    }
    return null;
}

// 📦 Load order details
async function loadOrderDetails() {
    if (!ORDER_ID) {
        document.getElementById('checkoutContent').innerHTML = `
            <div class="error">❌ No order ID provided</div>
        `;
        return;
    }

    const contentDiv = document.getElementById('checkoutContent');
    const usernameDiv = document.getElementById('username');
    
    try {
        // ✅ Fetch order by ID using the correct endpoint
        const response = await fetch(`${API_BASE_URL}/orders/order/${ORDER_ID}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch order');
        }

        currentOrder = await response.json();
        
        // Get username
        const username = await getUsername(currentOrder.userId);
        usernameDiv.textContent = `Username: ${username}`;

        // Get payment info
        currentPayment = await getPaymentForOrder(ORDER_ID);

        // Build HTML
        let html = `
            <div class="section">
                <h2 class="section-title">Confirmed order:</h2>
        `;

        // Add items
        if (currentOrder.items && currentOrder.items.length > 0) {
            currentOrder.items.forEach(item => {
                html += `
                    <div class="order-item">
                        <span class="item-quantity">${item.quantity}</span>
                        <span class="item-name">${item.title}</span>
                        <span class="item-price">฿${(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                `;
            });
        }

        html += `
                <div class="summary-row" style="margin-top: 30px;">
                    <span class="label">Shipping Fee</span>
                    <span class="value">฿${currentOrder.shippingFee ? currentOrder.shippingFee.toFixed(0) : '40'}</span>
                </div>
                <div class="summary-row">
                    <span class="label">Discount</span>
                    <span class="value">฿${currentOrder.discount ? '-' + currentOrder.discount.toFixed(0) : '-40'}</span>
                </div>
                <div class="summary-row total">
                    <span class="label">Total</span>
                    <span class="value">฿${currentOrder.total ? currentOrder.total.toFixed(0) : '0'}</span>
                </div>
            </div>

            <div class="section">
                <h2 class="section-title">Payment method:</h2>
                <div class="payment-info">
        `;

        // Payment info
        if (currentPayment) {
            html += `
                    <div class="info-row">
                        <span class="info-value">${currentPayment.bankName || 'ธนาคารกสิกรไทย'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-value">${currentPayment.accountNumber || 'xxx-x-x9999-x'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-value">นาง สาว เธอ กลอง เฮ้อคิส</span>
                    </div>
                    <div class="info-row" style="margin-top: 20px;">
                        <span class="info-label">Amount:</span>
                        <span class="info-value">${currentPayment.amount.toFixed(2)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Date:</span>
                        <span class="info-value">${formatDate(currentPayment.transferDate)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Time:</span>
                        <span class="info-value">${formatTime(currentPayment.transferTime)}</span>
                    </div>
            `;

            if (currentPayment.slipFileName) {
                const slipUrl = `http://localhost:8080/uploads/${currentPayment.slipFileName}`;
                html += `
                    <div class="info-row" style="margin-top: 10px;">
                        <span class="info-label">E-slip:</span>
                        <div class="slip-preview">
                            <svg class="slip-icon" viewBox="0 0 24 24" fill="none" stroke="#6b5d4f" stroke-width="2" onclick="openSlipModal('${slipUrl}')">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="M21 21L16.65 16.65"/>
                                <line x1="11" y1="8" x2="11" y2="14"/>
                                <line x1="8" y1="11" x2="14" y2="11"/>
                            </svg>
                            <a class="slip-link" onclick="openSlipModal('${slipUrl}')">${currentPayment.slipFileName}</a>
                        </div>
                    </div>
                `;
            }
        } else {
            // No payment uploaded yet
            html += `
                    <div class="info-row">
                        <span class="info-value">ธนาคารกสิกรไทย</span>
                    </div>
                    <div class="info-row">
                        <span class="info-value">xxx-x-x9999-x</span>
                    </div>
                    <div class="info-row">
                        <span class="info-value">นาง สาว เธอ กลอง เฮ้อคิส</span>
                    </div>
                    <div class="info-row" style="margin-top: 20px;">
                        <span class="info-label">Amount:</span>
                        <span class="info-value">${currentOrder.total.toFixed(2)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Date:</span>
                        <span class="info-value">${formatDate(currentOrder.orderDate)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Time:</span>
                        <span class="info-value">${formatTime(currentOrder.orderDate)}</span>
                    </div>
                    <div class="info-row" style="margin-top: 10px;">
                        <span class="info-label">E-slip:</span>
                        <span class="info-value" style="color: #d9534f;">No payment slip uploaded yet</span>
                    </div>
                    <div class="no-slip-warning">
                        ⚠️ Customer hasn't uploaded payment slip yet.
                    </div>
            `;
        }

        html += `
                </div>
            </div>
        `;

        contentDiv.innerHTML = html;

    } catch (error) {
        console.error('Error loading order:', error);
        contentDiv.innerHTML = `
            <div class="error">
                ❌ Failed to load order details.
                <br><small>${error.message}</small>
            </div>
        `;
    }
}

// 🚀 Initialize on page load
window.addEventListener('DOMContentLoaded', loadOrderDetails);