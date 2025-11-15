// Logout functionality
// ฟังก์ชันสำหรับจัดการ Logout

/**
 * ฟังก์ชัน logout - เรียก API backend เพื่อ logout และลบข้อมูลจาก localStorage
 */
async function logout() {
    const userId = localStorage.getItem("userId");
    
    try {
        // เรียก API logout ที่ backend
        const response = await fetch("http://localhost:8080/api/users/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: userId ? Number(userId) : null
            })
        });

        const result = await response.json();
        
        // ลบข้อมูลทั้งหมดจาก localStorage
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        localStorage.removeItem("email");
        
        // ลบข้อมูล cart count ที่เกี่ยวข้องกับ user
        if (userId) {
            localStorage.removeItem(`cartCount_${userId}`);
        }
        
        // ลบ cart count สำหรับ guest
        localStorage.removeItem("cartCount_guest");
        
        // แสดงข้อความสำเร็จ
        if (result.success) {
            alert("✅ " + (result.message || "Logout successful!"));
        } else {
            // แม้ว่า backend จะไม่สำเร็จ แต่เราก็ลบ localStorage แล้ว
            alert("✅ Logged out successfully!");
        }
        
        // Redirect ไปหน้า login
        window.location.href = "login.html";
        
    } catch (error) {
        console.error("⚠️ Error during logout:", error);
        
        // แม้ว่าจะมี error แต่ก็ลบ localStorage เพื่อความปลอดภัย
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        localStorage.removeItem("email");
        if (userId) {
            localStorage.removeItem(`cartCount_${userId}`);
        }
        localStorage.removeItem("cartCount_guest");
        
        alert("✅ Logged out (local data cleared)");
        window.location.href = "login.html";
    }
}

/**
 * ตรวจสอบว่าผู้ใช้ login อยู่หรือไม่
 */
function isLoggedIn() {
    return localStorage.getItem("userId") !== null;
}

/**
 * อัปเดต UI ของ profile icon ให้แสดง logout เมื่อ login อยู่
 */
function updateProfileIcon() {
    const profileLinks = document.querySelectorAll('a[href="login.html"].icon, a.icon[aria-label="Login"]');
    
    profileLinks.forEach(link => {
        if (isLoggedIn()) {
            // เปลี่ยนเป็น logout เมื่อ login อยู่
            link.setAttribute("aria-label", "Logout");
            link.setAttribute("title", "Logout");
            link.onclick = function(e) {
                e.preventDefault();
                logout();
            };
        } else {
            // ถ้ายังไม่ login ให้ไปหน้า login ตามปกติ
            link.onclick = null;
        }
    });
}

// อัปเดต profile icon เมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
    updateProfileIcon();
});
