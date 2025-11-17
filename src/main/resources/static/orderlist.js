const API_BASE = "http://localhost:8080/api";
let allOrders = [];
let usersCache = {};

function checkAdminAuth() {
    const email = localStorage.getItem('email');
    
    if (email?.toLowerCase() !== 'admin@admin.com') {
        alert('Access denied');
        window.location.href = 'login.html'; 
        return false;
    }
    return true;
}

async function getUsername(userId) {
    if (usersCache[userId]) return usersCache[userId];
    try {
        const res = await fetch(`${API_BASE}/users/${userId}`);
        if (res.ok) {
            const user = await res.json();
            usersCache[userId] = user.username;
            return user.username;
        }
    } catch { }
    return "User" + userId;
}

function formatDate(d) {
    return new Date(d).toLocaleDateString("th-TH");
}

function formatTime(d) {
    return new Date(d).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

function getStatusClass(status) {
    // COMPLETE and PAID are 'status-complete'
    if (status === 'PAID' || status === 'COMPLETE') return 'status-complete';
    if (status === 'CANCELLED') return 'status-cancelled';
    return 'status-pending';
}

function getStatusText(status) {
    if (status === 'PAID' || status === 'COMPLETE') return 'Complete'; // This logic is confusing, 'PAID' is often not 'Complete' but is treated as such here for display.
    if (status === 'CANCELLED') return 'Cancelled';
    return 'Pending';
}

async function loadOrders() {
    const body = document.getElementById("ordersTableBody");
    if (!body) return console.error('❌ tbody#ordersTableBody ไม่พบใน DOM');

    try {
        const res = await fetch(`${API_BASE}/orders/admin/list`);
        if (!res.ok) throw new Error("Fetch failed");

        allOrders = await res.json();

        if (!allOrders.length) {
            body.innerHTML = `<tr><td colspan="8" class="empty-state">ไม่พบคำสั่งซื้อ</td></tr>`;
            return;
        }

        const rows = await Promise.all(
            allOrders.map(async o => {
                const username = o.username || await getUsername(o.userId);
                const totalQty = o.amount || 0;
                
                // 💡 REVISED LOGIC: Buttons should only be disabled if the status is 'CANCELLED' or 'COMPLETE'.
                // 'PAID' orders are now editable.
                const isDisabled = o.status === 'CANCELLED' || o.status === 'COMPLETE'; 
                const disabledAttr = isDisabled ? 'disabled' : '';

                return `
<tr>
    <td>${username}</td>
    <td>${o.book || "-"}</td>
    <td>${o.time || "-"}</td>
    <td>${o.date || "-"}</td>
    <td>${totalQty}</td>
    <td>฿${o.price?.toFixed(0) || 0}</td>
    <td><span class="status-badge ${getStatusClass(o.status)}">${getStatusText(o.status)}</span></td>
    <td>
        <div class="action-cell">
            <button class="btn-approve" onclick="approveOrder(${o.orderId})" ${disabledAttr} title="Change Status to PAID/COMPLETE">✓</button>
            <button class="btn-reject" onclick="rejectOrder(${o.orderId})" ${disabledAttr} title="Cancel">✗</button>
            <a href="admin-checkout.html?orderId=${o.orderId}" class="btn-view" title="View Details">🔍 View</a>
        </div>
    </td>
</tr>`;
            })
        );

        body.innerHTML = rows.join("");

    } catch (err) {
        console.error('Error loading orders:', err);
        body.innerHTML = `<tr><td colspan="8" class="empty-state">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
    }
}

async function approveOrder(orderId) {
    // 💡 If the order is already 'PAID', we assume 'Approve' means moving to 'COMPLETE'.
    // We check the current status in `allOrders`.
    const currentOrder = allOrders.find(o => o.orderId === orderId);
    let targetStatus = 'PAID';
    let confirmMessage = 'ยืนยันการอนุมัติคำสั่งซื้อนี้?\nสถานะจะเปลี่ยนเป็น "PAID"';

    if (currentOrder && currentOrder.status === 'PAID') {
        targetStatus = 'COMPLETE';
        confirmMessage = 'ยืนยันการทำเครื่องหมายว่าคำสั่งซื้อนี้เสร็จสมบูรณ์?\nสถานะจะเปลี่ยนเป็น "COMPLETE"';
    } else if (currentOrder && currentOrder.status === 'PENDING') {
        targetStatus = 'PAID';
        confirmMessage = 'ยืนยันการอนุมัติคำสั่งซื้อนี้?\nสถานะจะเปลี่ยนเป็น "PAID"';
    }

    if (!confirm(confirmMessage)) return;

    try {
        const res = await fetch(`${API_BASE}/orders/${orderId}/status?status=${targetStatus}`, { method: 'POST' });
        if (res.ok) {
            alert(`✅ เปลี่ยนสถานะเป็น "${targetStatus}" เรียบร้อยแล้ว`);
            loadOrders();
        } else {
            const error = await res.text();
            alert('❌ เกิดข้อผิดพลาด: ' + error);
        }
    } catch (err) {
        console.error('Error approving order:', err);
        alert('❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
    }
}

async function rejectOrder(orderId) {
    if (!confirm('ยืนยันการยกเลิกคำสั่งซื้อนี้?\nสถานะจะเปลี่ยนเป็น "CANCELLED"')) return;
    try {
        const res = await fetch(`${API_BASE}/orders/${orderId}/status?status=CANCELLED`, { method: 'POST' });
        if (res.ok) {
            alert('✅ ยกเลิกคำสั่งซื้อเรียบร้อยแล้ว');
            loadOrders();
        } else {
            const error = await res.text();
            alert('❌ เกิดข้อผิดพลาด: ' + error);
        }
    } catch (err) {
        console.error('Error rejecting order:', err);
        alert('❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (checkAdminAuth()) {
        loadOrders();
    }
});