// ⚙️ Configuration
const API_BASE_URL = 'http://localhost:8080/api';

// ✅ LOGIN CHECK - Redirect if not admin
function checkAdminAuth() {
    const email = localStorage.getItem('email');
    if (email?.toLowerCase() !== 'admin@admin.com') {
        alert('Access denied');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Get order ID from URL parameter (?orderId=1)
const urlParams = new URLSearchParams(window.location.search);
const ORDER_ID = urlParams.get('orderId');

let currentOrder = null;
let currentPayment = null;

// 📅 Format date (Thai Buddhist calendar)
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
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
        console.log('🔍 Fetching payment for order:', orderId);
        const response = await fetch(`${API_BASE_URL}/payments/order/${orderId}`);
        
        if (!response.ok) {
            console.warn('⚠️ Payment not found (might not be submitted yet)');
            return null;
        }
        
        const payments = await response.json();
        console.log('📦 Payment response:', payments);
        
        // ✅ Handle both array and single object
        if (Array.isArray(payments)) {
            const payment = payments.length > 0 ? payments[0] : null;
            console.log('✅ Using payment:', payment);
            return payment;
        } else {
            console.log('✅ Using payment:', payments);
            return payments;
        }
    } catch (error) {
        console.error('❌ Error fetching payment:', error);
        return null;
    }
}

// ✅ Format bank name for display
function getBankDisplayName(bankCode) {
    const banks = {
        'kbank': 'ธนาคารกสิกรไทย (KBANK)',
        'scb': 'ธนาคารไทยพาณิชย์ (SCB)',
        'KBANK': 'ธนาคารกสิกรไทย (KBANK)',
        'SCB': 'ธนาคารไทยพาณิชย์ (SCB)'
    };
    return banks[bankCode] || bankCode;
}

// Load order details
async function loadOrderDetails() {
    // ✅ Check auth first
    if (!checkAdminAuth()) {
        return;
    }

    if (!ORDER_ID) {
        document.getElementById('checkoutContent').innerHTML = `
            <div class="error">❌ No order ID provided</div>
        `;
        return;
    }

    const contentDiv = document.getElementById('checkoutContent');
    const usernameDiv = document.getElementById('username');
    
    try {
        // ✅ FIXED: Use the correct endpoint that matches your backend
        console.log('🔍 Fetching order from:', `${API_BASE_URL}/orders/order/${ORDER_ID}`);
        
        const response = await fetch(`${API_BASE_URL}/orders/order/${ORDER_ID}`);
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Server error:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch order'}`);
        }

        currentOrder = await response.json();
        
        console.log('✅ Order loaded successfully:', currentOrder);
        
        // Get username
        const username = await getUsername(currentOrder.userId);
        usernameDiv.textContent = `Username: ${username}`;

        // Get payment info
        currentPayment = await getPaymentForOrder(ORDER_ID);
        console.log('💰 Current payment:', currentPayment);

        // Build HTML
        let html = `
            <div class="section">
                <h2 class="section-title">Confirmed order:</h2>
        `;

        // Add items - with better error handling
        if (currentOrder.items && currentOrder.items.length > 0) {
            currentOrder.items.forEach(item => {
                // ✅ Handle multiple possible field names
                const itemName = item.title || item.bookTitle || item.name || 'Unknown Item';
                const itemPrice = parseFloat(item.price) || 0;
                const itemQuantity = parseInt(item.quantity) || 1;
                
                html += `
                    <div class="order-item">
                        <span class="item-quantity">${itemQuantity}</span>
                        <span class="item-name">${itemName}</span>
                        <span class="item-price">฿${(itemPrice * itemQuantity).toFixed(0)}</span>
                    </div>
                `;
            });
        } else {
            html += `<div class="order-item" style="color: #999;">No items found</div>`;
        }

        html += `
                <div class="summary-row" style="margin-top: 30px;">
                    <span class="label">Shipping Fee</span>
                    <span class="value">฿${currentOrder.shippingFee ? currentOrder.shippingFee.toFixed(0) : '40'}</span>
                </div>
                <div class="summary-row">
                    <span class="label">Discount</span>
                    <span class="value">-฿${currentOrder.discount ? currentOrder.discount.toFixed(0) : '0'}</span>
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

        // ✅ Payment info with safe fallbacks
        if (currentPayment) {
            console.log('💳 Displaying payment info:', currentPayment);
            
            const bankName = currentPayment.bankName || 'Unknown Bank';
            const accountNum = currentPayment.accountNumber || '123-4-56789-0';
            const amount = parseFloat(currentPayment.amount) || 0;
            const transferDate = currentPayment.transferDate;
            const transferTime = currentPayment.transferTime;
            
            html += `
                    <div class="info-row">
                        <span class="info-value">${getBankDisplayName(bankName)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-value">${accountNum}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-value">ร้านบุ๊คสโตร์</span>
                    </div>
                    <div class="info-row" style="margin-top: 20px;">
                        <span class="info-label">Amount:</span>
                        <span class="info-value">฿${amount.toFixed(2)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Date:</span>
                        <span class="info-value">${formatDate(transferDate)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Time:</span>
                        <span class="info-value">${formatTime(transferTime)}</span>
                    </div>
            `;

            // ✅ Show slip if available
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
            } else {
                html += `
                    <div class="info-row" style="margin-top: 10px;">
                        <span class="info-label">E-slip:</span>
                        <span class="info-value" style="color: #999;">No slip file uploaded</span>
                    </div>
                `;
            }
        } else {
            // ✅ No payment record yet
            html += `
                    <div class="info-row">
                        <span class="info-value" style="color: #999;">Payment information not submitted yet</span>
                    </div>
                    <div class="info-row" style="margin-top: 20px;">
                        <span class="info-label">Expected Amount:</span>
                        <span class="info-value">฿${currentOrder.total.toFixed(2)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Order Date:</span>
                        <span class="info-value">${formatDate(currentOrder.orderDate)}</span>
                    </div>
                    <div class="no-slip-warning">
                        ℹ️ Customer hasn't submitted payment information yet.
                    </div>
            `;
        }

        html += `
                </div>
            </div>
        `;

        contentDiv.innerHTML = html;

    } catch (error) {
        console.error('❌ Error loading order:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            orderId: ORDER_ID,
            apiUrl: `${API_BASE_URL}/orders/order/${ORDER_ID}`
        });
        
        contentDiv.innerHTML = `
            <div class="error">
                ❌ Failed to load order details.
                <br><br><strong>Error:</strong> ${error.message}
                <br><br>
                <strong>Troubleshooting:</strong>
                <ul style="text-align: left; margin: 10px 0;">
                    <li>Order ID: ${ORDER_ID}</li>
                    <li>API URL: ${API_BASE_URL}/orders/order/${ORDER_ID}</li>
                    <li>Check if backend is running on http://localhost:8080</li>
                    <li>Open browser console (F12) for detailed errors</li>
                    <li>Try accessing API directly in new tab</li>
                </ul>
                <button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;cursor:pointer;">
                    🔄 Retry
                </button>
            </div>
        `;
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', loadOrderDetails);