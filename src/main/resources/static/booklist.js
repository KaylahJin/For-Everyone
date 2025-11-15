document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("bookList");
    const ADMIN_LIST_URL = 'http://localhost:8080/api/books/all'; 
    const API_URL = 'http://localhost:8080/api/books';

    // ฟังก์ชันหลักในการดึงและแสดงผลหนังสือ
    const fetchAndRenderBooks = () => {
        fetch(ADMIN_LIST_URL)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(books => {
                console.log("Books fetched:", books);
                container.innerHTML = ""; // ล้างรายการเดิมก่อน

                books.forEach(book => {
                    const card = document.createElement("div");
                    card.className = "book-card";
                    
                    card.innerHTML = `
                        <div class="delete-book">
                            <i class="bi bi-trash delete-book-icon" data-action="delete" data-book-id="${book.id}"></i>
                        </div>
                        
                        <img src="${book.coverUrl}" alt="${book.title}">
                        
                        <div class="info">
                            <div class="title">${book.title}</div>
                            <div class="author">${book.author}</div>
                            <div class="price">฿${book.price}</div>
                        </div>
                        
                        <div class="stock-book" data-book-id="${book.id}">
                            <i class="bi bi-dash-circle-fill" data-action="minus"></i>
                            <input type="number" 
                                class="quantity-input" 
                                value="${book.stock}" 
                                min="0" 
                                data-book-id="${book.id}"> 
                            <i class="bi bi-plus-circle-fill" data-action="plus"></i>
                        </div>
                    `;

                    container.appendChild(card);
                });
            })
            .catch(err => {
                console.error("Error fetching books:", err);
                container.innerHTML = `<p style="color: red;">ไม่สามารถโหลดรายการหนังสือได้: ${err.message}</p>`;
            });
    };

    // ----------------------------------------------------
    // ฟังก์ชันจัดการ API Call สำหรับการอัปเดต Stock
    // ----------------------------------------------------
    const updateStockOnServer = async (bookId, newStockValue) => {
        // Endpoint ใน Controller คือ PUT /api/books/{id}/stock?stock={newStockValue}
        const url = `${API_URL}/${bookId}/stock?stock=${newStockValue}`;

        try {
            const res = await fetch(url, {
                method: 'PUT'
                // ไม่ต้องใส่ body เพราะส่ง stock ผ่าน Query Parameter
            });

            if (res.ok) {
                console.log(`Stock for Book ID ${bookId} updated to ${newStockValue} successfully.`);
                // อัปเดตตัวเลข Stock ด้านบน (Stock: XX) หลังอัปเดตสำเร็จ
                const stockDisplay = document.getElementById(`stockDisplay_${bookId}`);
                if (stockDisplay) {
                    stockDisplay.textContent = newStockValue;
                }
            } else {
                alert(`อัปเดต Stock ล้มเหลวสำหรับ ID ${bookId}.`);
                console.error("Server update failed:", res.statusText);
            }
        } catch (error) {
            console.error("Network or Fetch Error:", error);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อเพื่ออัปเดต Stock");
        }
    };
    
    // ----------------------------------------------------
    // ฟังก์ชันจัดการ API Call สำหรับการลบหนังสือ
    // ----------------------------------------------------
    const deleteBookOnServer = async (bookId, cardElement) => {
        if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบหนังสือ ID: ${bookId}?`)) return;

        const url = `${API_URL}/${bookId}`;
        try {
            const res = await fetch(url, {
                method: 'DELETE'
            });

            if (res.ok) {
                console.log(`Book ID ${bookId} deleted successfully.`);
                cardElement.remove(); // ลบ Card ออกจาก DOM หากลบสำเร็จ
            } else {
                alert(`ลบหนังสือ ID ${bookId} ล้มเหลว.`);
                console.error("Server delete failed:", res.statusText);
            }
        } catch (error) {
            console.error("Network or Fetch Error:", error);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อลบหนังสือ");
        }
    };


    // ----------------------------------------------------
    // ฟังก์ชันจัดการการเปลี่ยนแปลง Stock ใน DOM และส่งไป Server
    // ----------------------------------------------------
    const handleStockUpdate = (inputElement, change) => {
        let currentQuantity = parseInt(inputElement.value);
        
        // 1. คำนวณค่าใหม่
        if (change) {
            currentQuantity += change;
        }
        
        // 2. บังคับค่าต่ำสุด (ตาม requirement ให้เห็น stock 0 ได้)
        if (isNaN(currentQuantity) || currentQuantity < 0) {
            currentQuantity = 0; 
        }
        
        inputElement.value = currentQuantity;
        const bookId = inputElement.getAttribute('data-book-id');

        // 3. ส่งค่าใหม่ไป Server
        updateStockOnServer(bookId, currentQuantity);
    };


    // ----------------------------------------------------
    // Event Listeners
    // ----------------------------------------------------

    // 1. Event Listener สำหรับการคลิกปุ่มบวก/ลบ และปุ่มลบ
    container.addEventListener('click', (e) => {
        const target = e.target;
        const action = target.getAttribute('data-action');
        
        if (action === 'plus' || action === 'minus') {
            // คลิกปุ่ม + หรือ -
            const inputElement = target.closest('.stock-book').querySelector('.quantity-input');
            const change = (action === 'plus') ? 1 : -1;
            
            handleStockUpdate(inputElement, change);
        
        } else if (action === 'delete') {
            // คลิกปุ่มลบ (ถังขยะ)
            const cardToRemove = target.closest('.book-card');
            const bookId = target.getAttribute('data-book-id');
            
            deleteBookOnServer(bookId, cardToRemove);
        }
    });

    // 2. Event Listener สำหรับการพิมพ์ค่า (Change Event)
    container.addEventListener('change', (e) => {
        const target = e.target;
        if (target.matches('.quantity-input')) {
            // พิมพ์ค่าใหม่ใน input box
            handleStockUpdate(target, 0); // เรียก update โดยไม่มีการเปลี่ยนแปลงค่า (change=0)
        }
    });
    
    // เริ่มต้นดึงและแสดงผลหนังสือเมื่อหน้าเว็บโหลดเสร็จ
    fetchAndRenderBooks();
});