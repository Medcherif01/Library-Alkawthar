document.addEventListener('DOMContentLoaded', () => {
    
    // ===================================
    // STRUCTURE DE DONNÉES
    // ===================================
    let books = [
        { isbn: '978-3-16-148410-0', title: 'Le Petit Prince', subject: 'Conte', level: 'A2', language: 'Français', cornerName: 'Récits Français', cornerNumber: 'A1', totalCopies: 5, loanedCopies: 2 },
        { isbn: '978-1-40-885565-2', title: 'Harry Potter', subject: 'Fantasy', level: 'B1', language: 'Anglais', cornerName: 'Fantasy Anglaise', cornerNumber: 'B3', totalCopies: 10, loanedCopies: 8 },
        { isbn: '978-0-74-753269-9', title: 'Les Misérables', subject: 'Classique', level: 'C1', language: 'Français', cornerName: 'Classiques', cornerNumber: 'A2', totalCopies: 3, loanedCopies: 1 }
    ];

    let loans = [
        { isbn: '978-3-16-148410-0', studentName: 'أحمد علي', loanDate: '2025-09-01', returnDate: '2025-09-15' },
        { isbn: '978-3-16-148410-0', studentName: 'سارة محمد', loanDate: '2025-09-02', returnDate: '2025-09-16' },
        { isbn: '978-1-40-885565-2', studentName: 'فاطمة الزهراء', loanDate: '2025-09-05', returnDate: '2025-09-20' }
    ];

    // ===================================
    // SÉLECTION DES ÉLÉMENTS DU DOM
    // ===================================
    const loginPage = document.getElementById('login-page');
    const dashboardPage = document.getElementById('dashboard-page');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const totalBooksStat = document.getElementById('total-books-stat');
    const loanedBooksStat = document.getElementById('loaned-books-stat');
    const availableBooksStat = document.getElementById('available-books-stat');
    const booksTableBody = document.getElementById('books-table-body');
    const searchInput = document.getElementById('search-input');
    const isbnScanner = document.getElementById('isbn-scanner');
    const bookDetailsView = document.getElementById('book-details-view');
    const addBookForm = document.getElementById('add-book-form');
    const excelFileInput = document.getElementById('excel-file-input');
    const uploadExcelBtn = document.getElementById('upload-excel-btn');
    const uploadStatus = document.getElementById('upload-status');
    const loanForm = document.getElementById('loan-form');
    const loanIsbnInput = document.getElementById('loan-isbn');
    const loanBookTitle = document.getElementById('loan-book-title');
    const returnBtn = document.getElementById('return-btn');
    const viewLoansBtn = document.getElementById('view-loans-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const loansModal = document.getElementById('loans-modal');
    const loansModalContent = document.getElementById('loans-modal-content');
    const editModal = document.getElementById('edit-modal');
    const editBookForm = document.getElementById('edit-book-form');
    const loanSearchInput = document.getElementById('loan-search-input');

    // ===================================
    // FONCTIONS DE GESTION DES DONNÉES
    // ===================================

    const updateStats = () => {
        const totalBooks = books.reduce((sum, book) => sum + book.totalCopies, 0);
        const loanedCount = books.reduce((sum, book) => sum + book.loanedCopies, 0);
        
        totalBooksStat.textContent = totalBooks;
        loanedBooksStat.textContent = loanedCount;
        availableBooksStat.textContent = totalBooks - loanedCount;
    };

    const renderTable = (bookList) => {
        booksTableBody.innerHTML = '';
        const currentLang = document.documentElement.lang || 'ar';
        const availabilityTexts = { ar: "متاح", fr: "disponible(s)", en: "available" };
        const actionsTexts = { ar: { edit: "تعديل", delete: "حذف" }, fr: { edit: "Modifier", delete: "Supprimer" }, en: { edit: "Edit", delete: "Delete" } };

        bookList.forEach(book => {
            const availableCopies = book.totalCopies - book.loanedCopies;
            const availabilityClass = availableCopies > 0 ? 'status-available' : 'status-unavailable';
            const availabilityText = `${availableCopies} / ${book.totalCopies} ${availabilityTexts[currentLang] || availabilityTexts['en']}`;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${book.isbn}</td>
                <td>${book.title}</td>
                <td>${book.cornerName}</td>
                <td>${book.cornerNumber}</td>
                <td><span class="${availabilityClass}">${availabilityText}</span></td>
                <td class="actions-cell">
                    <button class="btn-action btn-edit" title="${actionsTexts[currentLang].edit}"><i class="fas fa-edit"></i></button>
                    <button class="btn-action btn-delete" title="${actionsTexts[currentLang].delete}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            
            row.querySelector('.btn-edit').addEventListener('click', () => openEditModal(book.isbn));
            row.querySelector('.btn-delete').addEventListener('click', () => deleteBook(book.isbn));

            booksTableBody.appendChild(row);
        });
    };
    
    const initializeDashboard = () => {
        updateStats();
        renderTable(books);
    };
    
    const deleteBook = (isbn) => {
        const bookTitle = books.find(b => b.isbn === isbn)?.title || 'ce livre';
        const currentLang = document.documentElement.lang;
        const confirmMsg = {
            ar: `هل أنت متأكد من رغبتك في حذف كتاب "${bookTitle}"؟`,
            fr: `Êtes-vous sûr de vouloir supprimer le livre "${bookTitle}" ?`,
            en: `Are you sure you want to delete the book "${bookTitle}"?`
        };
        
        if (confirm(confirmMsg[currentLang] || confirmMsg['en'])) {
            books = books.filter(book => book.isbn !== isbn);
            loans = loans.filter(loan => loan.isbn !== isbn);
            initializeDashboard();
            alert('تم حذف الكتاب بنجاح.');
        }
    };

    // ===================================
    // GESTION DES MODALES
    // ===================================
    
    const openModal = (modalElement) => {
        modalOverlay.style.display = 'flex';
        modalElement.style.display = 'flex';
    };

    const closeModal = () => {
        modalOverlay.style.display = 'none';
        loansModal.style.display = 'none';
        editModal.style.display = 'none';
    };
    
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
    document.querySelectorAll('.close-modal-btn').forEach(btn => btn.addEventListener('click', closeModal));

    const openEditModal = (isbn) => {
        const book = books.find(b => b.isbn === isbn);
        if (!book) return;

        document.getElementById('edit-isbn-original').value = book.isbn;
        document.getElementById('edit-title').value = book.title;
        document.getElementById('edit-isbn').value = book.isbn;
        document.getElementById('edit-quantity').value = book.totalCopies;
        document.getElementById('edit-subject').value = book.subject || '';
        document.getElementById('edit-level').value = book.level || '';
        document.getElementById('edit-language').value = book.language || '';
        document.getElementById('edit-corner-name').value = book.cornerName;
        document.getElementById('edit-corner-number').value = book.cornerNumber;
        openModal(editModal);
    };

    // ===================================
    // GESTION DES PRÊTS
    // ===================================

    const returnLoan = (isbn, studentName) => {
        const loanIndex = loans.findIndex(l => l.isbn === isbn && l.studentName === studentName);
        if (loanIndex === -1) {
            alert("لم يتم العثور على الإعارة.");
            return;
        }

        const book = books.find(b => b.isbn === isbn);
        if (book && book.loanedCopies > 0) {
            book.loanedCopies--;
        }

        loans.splice(loanIndex, 1);
        
        displayLoans(loanSearchInput.value); 
        initializeDashboard();
    };

    const displayLoans = (searchTerm = '') => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        
        const filteredLoans = loans.filter(loan => {
            const book = books.find(b => b.isbn === loan.isbn);
            const bookTitle = book ? book.title.toLowerCase() : '';
            return loan.studentName.toLowerCase().includes(lowerCaseSearchTerm) ||
                   bookTitle.includes(lowerCaseSearchTerm) ||
                   loan.isbn.includes(lowerCaseSearchTerm);
        });

        if (filteredLoans.length === 0) {
            loansModalContent.innerHTML = `<p style="text-align: center; padding: 1rem;">لا توجد نتائج مطابقة.</p>`;
            return;
        }

        const currentLang = document.documentElement.lang;
        const headers = {
            ar: ["اسم الطالب", "عنوان الكتاب", "تاريخ الإعارة", "تاريخ التسليم", "إجراء"],
            fr: ["Nom de l'élève", "Titre du livre", "Date d'emprunt", "Date de retour", "Action"],
            en: ["Student Name", "Book Title", "Loan Date", "Return Date", "Action"]
        };
        const returnText = { ar: "إرجاع", fr: "Retourner", en: "Return" };
        
        let tableHTML = `<table id="loans-table"><thead><tr>
            <th>${headers[currentLang][0]}</th>
            <th>${headers[currentLang][1]}</th>
            <th>${headers[currentLang][2]}</th>
            <th>${headers[currentLang][3]}</th>
            <th>${headers[currentLang][4]}</th>
        </tr></thead><tbody>`;
        
        filteredLoans.forEach(loan => {
            const book = books.find(b => b.isbn === loan.isbn);
            tableHTML += `<tr>
                <td>${loan.studentName}</td>
                <td>${book ? book.title : 'غير متوفر'}</td>
                <td>${loan.loanDate}</td>
                <td>${loan.returnDate}</td>
                <td>
                    <button class="btn-action btn-return" data-isbn="${loan.isbn}" data-student="${loan.studentName}">
                        <i class="fas fa-undo"></i> ${returnText[currentLang]}
                    </button>
                </td>
            </tr>`;
        });
        tableHTML += `</tbody></table>`;
        loansModalContent.innerHTML = tableHTML;

        document.querySelectorAll('.btn-return').forEach(button => {
            button.addEventListener('click', (e) => {
                const isbn = e.currentTarget.dataset.isbn;
                const student = e.currentTarget.dataset.student;
                returnLoan(isbn, student);
            });
        });
    };

    // ===================================
    // GESTION DES ÉVÉNEMENTS
    // ===================================

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (document.getElementById('username').value === 'Alkawthar@30' && document.getElementById('password').value === 'Alkawthar@30') {
                loginPage.style.display = 'none';
                dashboardPage.style.display = 'block';
                initializeDashboard();
            } else {
                loginError.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة.';
            }
        });
    }

    if(logoutBtn) logoutBtn.addEventListener('click', () => {
        dashboardPage.style.display = 'none';
        loginPage.style.display = 'flex';
        if(loginForm) { loginForm.reset(); loginError.textContent = ''; }
    });
    
    if(isbnScanner) isbnScanner.addEventListener('change', (e) => {
        const isbn = e.target.value.trim();
        const book = books.find(b => b.isbn === isbn);
        if (book) {
            bookDetailsView.innerHTML = `<strong>${book.title}</strong><br>الكمية الإجمالية: ${book.totalCopies}<br>الكمية المعارة: ${book.loanedCopies}`;
        } else {
            bookDetailsView.innerHTML = `<p class="placeholder">لم يتم العثور على كتاب بهذا ISBN.</p>`;
        }
        e.target.value = '';
    });

    if(uploadExcelBtn) uploadExcelBtn.addEventListener('click', () => {
        if (excelFileInput.files.length === 0) {
            uploadStatus.textContent = 'الرجاء اختيار ملف أولاً.'; return;
        }
        const file = excelFileInput.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                let addedCount = 0;
                let updatedCount = 0;
                json.forEach(row => {
                    if (!row['ISBN'] || !row['Title']) return;
                    const newBook = {
                        title: row['Title'],
                        isbn: String(row['ISBN']).trim(),
                        totalCopies: parseInt(row['QTY'], 10) || 1,
                        subject: row['Subject'] || '',
                        level: row['level'] || '',
                        language: row['language'] || '',
                        cornerName: row['Corner name'] || 'غير محدد',
                        cornerNumber: String(row['Corner number'] || '0'),
                        loanedCopies: 0
                    };
                    const existingBook = books.find(b => b.isbn === newBook.isbn);
                    if (existingBook) {
                        existingBook.totalCopies += newBook.totalCopies;
                        updatedCount++;
                    } else {
                        books.push(newBook);
                        addedCount++;
                    }
                });
                initializeDashboard();
                uploadStatus.textContent = `تمت المعالجة: ${addedCount} كتاب جديد، ${updatedCount} كتاب محدث.`;
            } catch (error) {
                uploadStatus.textContent = "خطأ في قراءة الملف. تأكد من أنه ملف Excel صالح.";
                console.error(error);
            }
        };
        reader.readAsArrayBuffer(file);
    });

    if(searchInput) searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        renderTable(books.filter(b => b.title.toLowerCase().includes(searchTerm) || b.isbn.includes(searchTerm)));
    });

    if(addBookForm) addBookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newBook = {
            isbn: document.getElementById('new-isbn').value.trim(),
            title: document.getElementById('new-title').value,
            totalCopies: parseInt(document.getElementById('new-quantity').value, 10),
            subject: document.getElementById('new-subject').value,
            level: document.getElementById('new-level').value,
            language: document.getElementById('new-language').value,
            cornerName: document.getElementById('new-corner-name').value,
            cornerNumber: document.getElementById('new-corner-number').value,
            loanedCopies: 0
        };
        const existingBook = books.find(b => b.isbn === newBook.isbn);
        if (existingBook) {
            existingBook.totalCopies += newBook.totalCopies;
        } else {
            books.push(newBook);
        }
        addBookForm.reset();
        initializeDashboard();
        alert('تمت إضافة الكتاب بنجاح!');
    });

    if(editBookForm) editBookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const originalIsbn = document.getElementById('edit-isbn-original').value;
        const bookIndex = books.findIndex(b => b.isbn === originalIsbn);
        if (bookIndex === -1) return;
        const loanedCopies = books[bookIndex].loanedCopies;
        const newTotalCopies = parseInt(document.getElementById('edit-quantity').value, 10);
        if (newTotalCopies < loanedCopies) {
            alert('لا يمكن أن تكون الكمية الإجمالية أقل من عدد الكتب المعارة.');
            return;
        }
        books[bookIndex] = {
            title: document.getElementById('edit-title').value,
            isbn: document.getElementById('edit-isbn').value.trim(),
            totalCopies: newTotalCopies,
            subject: document.getElementById('edit-subject').value,
            level: document.getElementById('edit-level').value,
            language: document.getElementById('edit-language').value,
            cornerName: document.getElementById('edit-corner-name').value,
            cornerNumber: document.getElementById('edit-corner-number').value,
            loanedCopies: loanedCopies
        };
        initializeDashboard();
        closeModal();
        alert('تم تحديث الكتاب بنجاح.');
    });

    if(loanIsbnInput) loanIsbnInput.addEventListener('input', (e) => {
        const book = books.find(b => b.isbn === e.target.value.trim());
        loanBookTitle.textContent = book ? book.title : '-';
    });
    
    if(loanForm) loanForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const isbn = loanIsbnInput.value.trim();
        const book = books.find(b => b.isbn === isbn);
        if (!book) { alert('لم يتم العثور على كتاب بهذا ISBN.'); return; }
        if (book.loanedCopies >= book.totalCopies) {
            alert('لا يمكن إعارة هذا الكتاب. جميع النسخ معارة بالفعل.'); return;
        }
        loans.push({
            isbn: isbn,
            studentName: document.getElementById('student-name').value,
            loanDate: document.getElementById('loan-date').value,
            returnDate: document.getElementById('return-date').value,
        });
        book.loanedCopies++;
        initializeDashboard();
        loanForm.reset();
        loanBookTitle.textContent = '-';
        alert(`تمت إعارة نسخة من كتاب "${book.title}" بنجاح!`);
    });

    if(returnBtn) returnBtn.addEventListener('click', () => {
        const isbn = loanIsbnInput.value.trim();
        const studentName = document.getElementById('student-name').value;
        if (!isbn || !studentName) {
            alert('الرجاء إدخال ISBN واسم الطالب لإتمام عملية الإرجاع.'); return;
        }
        const loanIndex = loans.findIndex(l => l.isbn === isbn && l.studentName.toLowerCase() === studentName.toLowerCase());
        if (loanIndex !== -1) {
            returnLoan(isbn, loans[loanIndex].studentName); // Use the exact name from the loan
            loanForm.reset();
            loanBookTitle.textContent = '-';
            alert(`تم إرجاع الكتاب بنجاح.`);
        } else {
            alert('لم يتم العثور على عملية إعارة مطابقة لهذا الكتاب والطالب.');
        }
    });

    if(viewLoansBtn) viewLoansBtn.addEventListener('click', () => {
        displayLoans();
        openModal(loansModal);
        loanSearchInput.value = '';
        loanSearchInput.focus();
    });

    if(loanSearchInput) loanSearchInput.addEventListener('input', (e) => {
        displayLoans(e.target.value);
    });

    // ===================================
    // SYSTÈME DE TRADUCTION
    // ===================================
    const fullTranslations = {
        ar: { title: "مكتبة الكوثر", welcome_title: "مرحباً بكم في مكتبة مدارس الكوثر العالمية", welcome_subtitle: "الرجاء إدخال بيانات الاعتماد الخاصة بك للوصول إلى لوحة التحكم.", username_label: "اسم المستخدم", password_label: "كلمة المرور", login_btn: "تسجيل الدخول", dashboard_title: "لوحة تحكم مكتبة الكوثر", school_name: "مدارس الكوثر العالمية", logout_btn_title: "تسجيل الخروج", stats_title: "إحصائيات المكتبة", total_books: "إجمالي الكتب", loaned_books: "الكتب المعارة", available_books: "الكتب المتاحة", scanner_title: "بحث سريع بالباركود", scanner_label: "امسح ISBN الكتاب هنا:", scanner_placeholder: "امسح الباركود...", scanner_instruction: "الرجاء مسح كتاب ضوئياً لعرض معلوماته.", excel_upload_title: "إضافة عبر ملف Excel", excel_instruction: "اختر ملف (.xlsx) بالأعمدة: Title, ISBN, QTY, Subject, level, language, Corner name, Corner number", choose_file_btn: "اختر ملف...", upload_btn: "رفع الملف", search_book_title: "البحث في المخزون", search_placeholder: "ابحث بالعنوان أو ISBN...", isbn_col: "ISBN", title_col: "العنوان", corner_name_col: "اسم الركن", corner_num_col: "رقم الركن", availability_col: "الإتاحة", actions_col: "الإجراءات", add_book_title: "تسجيل كتاب جديد يدوياً", book_title_label: "عنوان الكتاب", save_book_btn: "حفظ الكتاب", manage_loan_title: "إدارة الإعارة والعودة", student_name_label: "اسم الطالب", loan_book_btn: "إعارة الكتاب", return_book_btn: "إرجاع الكتاب", corner_name_label: "اسم الركن", corner_num_label: "رقم الركن", quantity_label: "الكمية", subject_label: "المادة", level_label: "المستوى", language_label: "اللغة", loan_date_label: "تاريخ الإعارة", return_date_label: "تاريخ التسليم", footer_text: "© 2025 مدارس الكوثر العالمية - جميع الحقوق محفوظة.", view_loans_btn: "عرض الطلاب المستعيرين", loaned_books_list_title: "قائمة الكتب المعارة", edit_book_title: "تعديل معلومات الكتاب", save_changes_btn: "حفظ التغييرات", loan_search_placeholder: "ابحث بالاسم، العنوان، أو امسح ISBN...", return_action: "إرجاع" },
        fr: { title: "Bibliothèque Al-Kawthar", welcome_title: "Bienvenue à la bibliothèque des écoles Al-Kawthar", welcome_subtitle: "Veuillez entrer vos identifiants pour accéder.", username_label: "Nom d'utilisateur", password_label: "Mot de passe", login_btn: "Connexion", dashboard_title: "Tableau de bord de la bibliothèque", school_name: "Écoles Internationales Al-Kawthar", logout_btn_title: "Déconnexion", stats_title: "Statistiques", total_books: "Total Livres", loaned_books: "Livres Empruntés", available_books: "Livres Disponibles", scanner_title: "Scan rapide par code-barres", scanner_label: "Scannez l'ISBN du livre ici :", scanner_placeholder: "Scanner le code-barres...", scanner_instruction: "Veuillez scanner un livre pour voir ses détails.", excel_upload_title: "Ajout via fichier Excel", excel_instruction: "Choisissez un fichier (.xlsx) avec les colonnes : Title, ISBN, QTY, Subject, level, language, Corner name, Corner number", choose_file_btn: "Choisir un fichier...", upload_btn: "Télécharger", search_book_title: "Rechercher dans l'inventaire", search_placeholder: "Rechercher par titre ou ISBN...", isbn_col: "ISBN", title_col: "Titre", corner_name_col: "Nom du Coin", corner_num_col: "N° Coin", availability_col: "Disponibilité", actions_col: "Actions", add_book_title: "Ajouter un livre manuellement", book_title_label: "Titre du livre", save_book_btn: "Enregistrer", manage_loan_title: "Gérer les prêts et retours", student_name_label: "Nom de l'élève", loan_book_btn: "Emprunter", return_book_btn: "Retourner", corner_name_label: "Nom du coin", corner_num_label: "Numéro du coin", quantity_label: "Quantité", subject_label: "Matière", level_label: "Niveau", language_label: "Langue", loan_date_label: "Date d'emprunt", return_date_label: "Date de retour", footer_text: "© 2025 Écoles Internationales Al-Kawthar - Tous droits réservés.", view_loans_btn: "Voir les emprunteurs", loaned_books_list_title: "Liste des livres empruntés", edit_book_title: "Modifier les informations du livre", save_changes_btn: "Enregistrer les modifications", loan_search_placeholder: "Chercher par nom, titre ou scanner l'ISBN...", return_action: "Retourner" },
        en: { title: "Alkawthar Library", welcome_title: "Welcome to Alkawthar International Schools Library", welcome_subtitle: "Please enter your credentials to access the dashboard.", username_label: "Username", password_label: "Password", login_btn: "Login", dashboard_title: "Library Dashboard", school_name: "Alkawthar International Schools", logout_btn_title: "Logout", stats_title: "Library Statistics", total_books: "Total Books", loaned_books: "Loaned Books", available_books: "Available Books", scanner_title: "Quick Barcode Scan", scanner_label: "Scan the book's ISBN here:", scanner_placeholder: "Scan barcode...", scanner_instruction: "Please scan a book to see its details.", excel_upload_title: "Add via Excel File", excel_instruction: "Choose a file (.xlsx) with columns: Title, ISBN, QTY, Subject, level, language, Corner name, Corner number", choose_file_btn: "Choose File...", upload_btn: "Upload File", search_book_title: "Search Inventory", search_placeholder: "Search by title or ISBN...", isbn_col: "ISBN", title_col: "Title", corner_name_col: "Corner Name", corner_num_col: "Corner N°", availability_col: "Availability", actions_col: "Actions", add_book_title: "Add a New Book Manually", book_title_label: "Book Title", save_book_btn: "Save Book", manage_loan_title: "Manage Loans & Returns", student_name_label: "Student Name", loan_book_btn: "Loan Book", return_book_btn: "Return Book", corner_name_label: "Corner name", corner_num_label: "Corner number", quantity_label: "Quantity", subject_label: "Subject", level_label: "Level", language_label: "Language", loan_date_label: "Loan date", return_date_label: "Return date", footer_text: "© 2025 Alkawthar International Schools - All rights reserved.", view_loans_btn: "View Student Loans", loaned_books_list_title: "List of Loaned Books", edit_book_title: "Edit Book Information", save_changes_btn: "Save Changes", loan_search_placeholder: "Search by name, title, or scan ISBN...", return_action: "Return" }
    };

    const switchLanguage = (lang) => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.getAttribute('data-lang-key');
            if (fullTranslations[lang] && fullTranslations[lang][key]) {
                el.textContent = fullTranslations[lang][key];
            }
        });
        document.querySelectorAll('[data-lang-key-placeholder]').forEach(el => {
            const key = el.getAttribute('data-lang-key-placeholder');
            if (fullTranslations[lang] && fullTranslations[lang][key]) {
                el.placeholder = fullTranslations[lang][key];
            }
        });
        if (dashboardPage.style.display === 'block') {
            renderTable(books);
        }
    };
    
    document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', (e) => switchLanguage(e.target.getAttribute('data-lang'))));
    
    switchLanguage('ar');
});
