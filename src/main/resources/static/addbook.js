document.addEventListener("DOMContentLoaded", () => {

    // -------------------------------
    // 0) เช็กสิทธิ์ Admin
    // -------------------------------
    const email = localStorage.getItem('email');
    if (email?.toLowerCase() !== 'admin@admin.com') {
        alert('Access denied');
        window.location.href = 'index.html';
        return;
    }

    // -------------------------------
    // 1) เริ่มต้นฟอร์มและ element ต่าง ๆ
    // -------------------------------
    const form = document.getElementById("bookForm");
    const categorySelect = document.getElementById("categorySelect");
    const categoryInput = document.getElementById("categoryInput");
    const insertPhotoBtn = document.getElementById('insertPhotoBtn');
    const coverInput = document.getElementById('coverInput');
    const coverPreview = document.getElementById('coverPreview');

    const existingCategories = [];

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // 1. กำหนดค่า Category ที่จะส่ง
        let finalCategory;
        if (categorySelect.style.display !== "none" && categorySelect.value && categorySelect.value !== "__custom__") {
            finalCategory = categorySelect.value;
        } else if (categoryInput.style.display !== "none") {
            finalCategory = categoryInput.value.trim();
        } else {
            finalCategory = categorySelect.value;
        }
        if (!finalCategory || finalCategory.trim() === "") {
            finalCategory = "Uncategorized";
        }

        // 2. สร้าง FormData และ Append ข้อมูลทั้งหมดทีละฟิลด์
        const formData = new FormData();
        formData.append("title", form.title.value);
        formData.append("author", form.author.value);

        const priceValue = parseFloat(form.price.value) || 0.00;
        formData.append("price", priceValue);

        formData.append("isbn", form.isbn.value);
        formData.append("category", finalCategory);
        formData.append("description", form.description.value);
        formData.append("stock", form.stock.value);

        const coverFile = document.getElementById("coverInput").files[0];
        if (coverFile) {
            formData.append("cover", coverFile);
        }

        // 3. ส่งข้อมูลไปที่ Endpoint ที่ถูกต้อง
        const res = await fetch("/api/books/upload", {
            method: "POST",
            body: formData
        });

        if (res.ok) {
            alert("เพิ่มหนังสือพร้อมรูปเรียบร้อย!");
            form.reset(); // ล้างฟอร์ม
            window.location.href = "booklist.html"; // Redirect ไปหน้า list
        } else {
            const errorText = await res.text();
            console.error("Server Error Response:", errorText);
            alert(`การเพิ่มหนังสือล้มเหลว! (${res.status} ${res.statusText})\nโปรดตรวจสอบ Console Error`);
        }
    });

    // ----------------------------------------------------
    // Logic การจัดการรูปภาพ (ไม่เปลี่ยนแปลง)
    // ----------------------------------------------------
    insertPhotoBtn.addEventListener('click', () => coverInput.click());

    coverInput.addEventListener('change', function () {
        const file = this.files[0];
        const coverPlaceholder = document.getElementById('coverPlaceholder');

        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                coverPreview.src = e.target.result;
                coverPreview.style.display = 'block';
                coverPlaceholder.style.display = 'none';
            }
            reader.readAsDataURL(file);
        } else {
            coverPreview.src = '';
            coverPreview.style.display = 'none';
            coverPlaceholder.style.display = 'block';
        }
    });

    // ----------------------------------------------------
    // Logic การดึงและจัดการ Categories (ไม่เปลี่ยนแปลง)
    // ----------------------------------------------------
    fetch('/api/books/categories')
        .then(res => res.json())
        .then(categoriesFromDB => {
            categoriesFromDB.forEach(cat => {
                const option = document.createElement("option");
                option.value = cat;
                option.textContent = cat;
                categorySelect.appendChild(option);
                existingCategories.push(cat);
            });

            // เพิ่ม option สุดท้ายสำหรับพิมพ์เอง
            const customOption = document.createElement("option");
            customOption.value = "__custom__";
            customOption.textContent = "พิมพ์หมวดหมู่เพิ่มเติม...";
            categorySelect.appendChild(customOption);
        })
        .catch(err => console.error("Error fetching categories:", err));

    // เมื่อเลือก dropdown
    categorySelect.addEventListener("change", function () {
        if (categorySelect.value === "__custom__") {
            categorySelect.style.display = "none";
            categoryInput.style.display = "block";
            categoryInput.focus();
        }
    });

    // ถ้าพิมพ์หมวดหมู่ใหม่เสร็จ (Enter) → คืน dropdown + เพิ่ม option ใหม่
    categoryInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            const value = categoryInput.value.trim();
            if (value && !existingCategories.includes(value)) {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = value;
                categorySelect.insertBefore(option, categorySelect.lastElementChild);
                categorySelect.value = value;
                existingCategories.push(value);
            }
            categoryInput.value = "";
            categoryInput.style.display = "none";
            categorySelect.style.display = "block";
        }
    });
});