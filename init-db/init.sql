-- Create database only if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Bookstore')
BEGIN
    PRINT 'Creating database [Bookstore]...';
    CREATE DATABASE [Bookstore];
END
ELSE
BEGIN
    PRINT 'Database [Bookstore] already exists.';
END
GO

USE [Bookstore];
GO

-- Create table if not exists
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='books' AND xtype='U')
BEGIN
    CREATE TABLE books (
        id BIGINT IDENTITY PRIMARY KEY,
        title NVARCHAR(255),
        author NVARCHAR(255),
        category NVARCHAR(100),
        price FLOAT,
        isbn NVARCHAR(100),
        coverUrl NVARCHAR(255)
    );
    PRINT '✅ Table [books] created.';
END
GO

-- -- Insert 12 English books (prices in บาท)
-- INSERT INTO books (title, author, category, price, isbn, coverUrl)
-- VALUES
-- (N'The Great Gatsby', N'F. Scott Fitzgerald', N'Classic', 259.00, N'9780743273565', N'https://picsum.photos/200/300?1'),
-- (N'To Kill a Mockingbird', N'Harper Lee', N'Classic', 279.00, N'9780061120084', N'https://picsum.photos/200/300?2'),
-- (N'1984', N'George Orwell', N'Dystopian', 239.00, N'9780451524935', N'https://picsum.photos/200/300?3'),
-- (N'Pride and Prejudice', N'Jane Austen', N'Romance', 199.00, N'9781503290563', N'https://picsum.photos/200/300?4'),
-- (N'The Catcher in the Rye', N'J.D. Salinger', N'Classic', 219.00, N'9780316769488', N'https://picsum.photos/200/300?5'),
-- (N'The Hobbit', N'J.R.R. Tolkien', N'Fantasy', 299.00, N'9780547928227', N'https://picsum.photos/200/300?6'),
-- (N'Harry Potter and the Sorcerer''s Stone', N'J.K. Rowling', N'Fantasy', 349.00, N'9780590353427', N'https://picsum.photos/200/300?7'),
-- (N'The Alchemist', N'Paulo Coelho', N'Philosophy', 269.00, N'9780062315007', N'https://picsum.photos/200/300?8'),
-- (N'The Subtle Art of Not Giving a F*ck', N'Mark Manson', N'Self-Help', 319.00, N'9780062457714', N'https://picsum.photos/200/300?9'),
-- (N'Atomic Habits', N'James Clear', N'Self-Improvement', 359.00, N'9780735211292', N'https://picsum.photos/200/300?10'),
-- (N'The Midnight Library', N'Matt Haig', N'Fiction', 289.00, N'9780525559474', N'https://picsum.photos/200/300?11'),
-- (N'Becoming', N'Michelle Obama', N'Biography', 399.00, N'9781524763138', N'https://picsum.photos/200/300?12');
-- GO

-- PRINT '📚 12 sample English books inserted successfully (prices in บาท)!';
-- GO
