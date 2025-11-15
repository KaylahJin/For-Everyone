package com.bookstore.controller;

import com.bookstore.model.Book;
import com.bookstore.repo.BookRepository;
import com.bookstore.storage.FileStorageService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@CrossOrigin(origins = "*") // dev-friendly; narrow later if you want
@RestController
@RequestMapping("/api/books")
public class BookController {

    private final BookRepository bookRepository;
    private final FileStorageService storage;

    public BookController(BookRepository bookRepository, FileStorageService storage) {
        this.bookRepository = bookRepository;
        this.storage = storage;
    }

    // ---------- CUSTOMER SIDE ----------
    // show only in-stock books to users
    @GetMapping
    public List<Book> getAllVisible() {
        return bookRepository.findByStockGreaterThan(0);
    }

    // ---------- ADMIN SIDE ----------
    // list ALL (including stock = 0)
    @GetMapping("/all")
    public List<Book> getAllForAdmin() {
        return bookRepository.findAll();
    }

    // add (JSON only, no image) - fallback path from admin.html
    @PostMapping
    public ResponseEntity<Book> addBook(@RequestBody Book book) {
        if (book.getStock() < 0) book.setStock(0);
        return ResponseEntity.ok(bookRepository.save(book));
    }

    // add WITH image upload (preferred)
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createWithUpload(
            @RequestParam String title,
            @RequestParam String author,
            @RequestParam Double price,
            @RequestParam(required = false) String isbn,
            @RequestParam String category,
            @RequestParam(required = false) String description,
            @RequestParam Integer stock,
            @RequestParam(required = false) MultipartFile cover
    ) {
        try {
            String coverUrl = null;
            if (cover != null && !cover.isEmpty()) {
                String fileName = storage.saveFile(cover);  // your FileStorageService
                coverUrl = "/uploads/" + fileName;          // <- public URL
            }

            Book b = new Book();
            b.setTitle(title);
            b.setAuthor(author);
            b.setPrice(price);
            b.setIsbn(isbn);
            b.setCategory(category);
            b.setDescription(description);
            b.setStock(stock == null ? 0 : Math.max(0, stock));
            b.setCoverUrl(coverUrl);

            return ResponseEntity.ok(bookRepository.save(b));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Upload failed: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Book> getBookById(@PathVariable Long id) {
        return bookRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
}

    // update stock (used by +/- buttons)
    @PutMapping("/{id}/stock")
    public ResponseEntity<?> updateStock(@PathVariable Long id, @RequestParam int stock) {
        return bookRepository.findById(id)
                .map(b -> {
                    b.setStock(Math.max(0, stock));
                    bookRepository.save(b);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // delete
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBook(@PathVariable Long id) {
        if (!bookRepository.existsById(id)) return ResponseEntity.notFound().build();
        bookRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // categories (for datalist)
    @GetMapping("/categories")
    public List<String> categories() {
        return bookRepository.findDistinctCategories();
    }
}
