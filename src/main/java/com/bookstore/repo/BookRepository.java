package com.bookstore.repo;

import com.bookstore.model.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface BookRepository extends JpaRepository<Book, Long> {

    // ✅ Search books by title (already exists)
    List<Book> findByTitleContainingIgnoreCase(String keyword);

    // ✅ Get unique categories directly from DB
    @Query("SELECT DISTINCT b.category FROM Book b WHERE b.category IS NOT NULL")
    List<String> findDistinctCategories();
    
    List<Book> findByCategoryContainingIgnoreCase(String category);
    List<Book> findByTitleContainingIgnoreCaseAndCategoryContainingIgnoreCase(String keyword, String category);
    
    List<Book> findByStockGreaterThan(int stock);
    
}
