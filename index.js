document.addEventListener('DOMContentLoaded', () => {
    
    // ===================================
    // SIMULATION D'UNE BASE DE DONNÉES
    // ===================================
    let books = [
        { isbn: '978-3-16-148410-0', title: 'Le Petit Prince', cornerName: 'Récits Français', cornerNumber: 'A1', status: 'disponible' },
        { isbn: '978-1-40-885565-2', title: 'Harry Potter and the Philosopher\'s Stone', cornerName: 'Fantasy Anglaise', cornerNumber: 'B3', status: 'disponible' },
        { isbn: '978-0-74-753269-9', title: 'Les Misérables', cornerName: 'Classiques Français', cornerNumber: 'A2', status: 'emprunté' }
    ];

    // ===================================
    // SÉLECTION DES ÉLÉMENTS DU DOM
    // ===================================
    const loginPage = document.getElementById('login-page');
    const dashboardPage = document.getElementById('dashboard-page');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Modules restaurés
    const isbnScanner = document.getElementById('isbn-scanner');
    const bookDetailsView = document.getElementById('book-details-view');
    const excelFileInput = document.getElementById('excel-file-input');
    const uploadExcelBtn = document.getElementById('upload-excel-btn');
    const uploadStatus = document.getElementById('upload-status');

    // Modules récents
    const totalBooksStat = document.getElementById('total-books-stat');
    const loanedBooksStat = document.getElementById('loaned-books-stat');
    const availableBooksStat = document.getElementById('available-books-stat');
    const searchInput = document.getElementById('search-input');
    const booksTableBody = document.getElementById('books-table-body');
    const addBookForm = document.getElementById('add-book-form');
    const loanForm = document.getElementById('loan-form');
    const loanIsbnInput = document.getElementById('loan-isbn');
    const loanBookTitle = document.getElementById('loan-book-title');
    const loanCornerName = document.getElementById('loan-corner-name');
    const loanCornerNumber = document.getElementById('loan-corner-number');
    const returnBtn = document.getElementById('return-btn');

    // ===================================
    // FONCTIONS PRINCIPALES
    // ===================================
    const updateStats = () => {
        const totalBooks = books.length;
        const loanedBooks = books.filter(b => b.status === 'emprunté').length;
        totalBooksStat.textContent = totalBooks;
        loanedBooksStat.textContent = loanedBooks;
        availableBooksStat.textContent = totalBooks - loanedBooks;
    };

    const renderTable = (bookList) => {
        booksTableBody.innerHTML = '';
        const currentLang = document.documentElement.lang;
        const statusTexts = {
            ar: { disponible: 'متاح', emprunté: 'معار' }, fr: { disponible: 'Disponible', emprunté: 'Emprunté' }, en: { disponible: 'Available', emprunté: 'Loaned' }
        };
        bookList.forEach(book => {
            const statusClass = book.status === 'disponible' ? 'status-available' : 'status-loaned';
            booksTableBody.innerHTML += `<tr><td>${book.isbn}</td><td>${book.title}</td><td>${book.cornerName}</td><td>${book.cornerNumber}</td><td><span class="${statusClass}">${statusTexts[currentLang][book.status]}</span></td></tr>`;
        });
    };
    
    const initializeDashboard = () => { updateStats(); renderTable(books); };

    // ===================================
    // GESTION DES ÉVÉNEMENTS
    // ===================================
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (document.getElementById('username').value === 'Alkawthar@30' && document.getElementById('password').value === 'Alkawthar@30') {
                loginError.textContent = '';
                loginPage.classList.add('fade-out');
                setTimeout(() => {
                    loginPage.style.display = 'none';
                    dashboardPage.style.display = 'block';
                    initializeDashboard();
                }, 500);
            } else {
                loginError.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة.';
                loginForm.style.animation = 'shake 0.5s';
                setTimeout(() => { loginForm.style.animation = ''; }, 500);
            }
        });
    }

    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            dashboardPage.style.display = 'none';
            loginPage.style.display = 'flex';
            loginPage.classList.remove('fade-out');
            if(loginForm) { loginForm.reset(); loginError.textContent = ''; }
        });
    }

    // --- Logique du scanner de code-barres (RESTAURÉE) ---
    if (isbnScanner) {
        isbnScanner.addEventListener('change', (e) => {
            const isbn = e.target.value;
            const book = books.find(b => b.isbn === isbn);
            if (book) {
                const statusText = book.status === 'disponible' ? 'متاح' : 'معار';
                bookDetailsView.innerHTML = `<strong>${book.title}</strong><br>الركن: ${book.cornerName} (${book.cornerNumber})<br>الحالة: ${statusText}`;
            } else {
                bookDetailsView.innerHTML = `<p class="placeholder">لم يتم العثور على كتاب بهذا ISBN.</p>`;
            }
        });
    }
    
    // --- Logique d'import Excel (RESTAURÉE) ---
    if(uploadExcelBtn) {
        uploadExcelBtn.addEventListener('click', () => {
             if (excelFileInput.files.length === 0) {
                uploadStatus.textContent = 'الرجاء اختيار ملف أولاً.';
                return;
            }
            // Logique de lecture de fichier (simplifiée)
            uploadStatus.textContent = `جاري معالجة الملف: ${excelFileInput.files[0].name}...`;
            alert("وظيفة استيراد Excel قيد التطوير. سيتم دمج البيانات من الملف هنا.");
            // ICI : Ajouter la logique complète de lecture du fichier avec la librairie SheetJS/XLSX
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            renderTable(books.filter(b => b.title.toLowerCase().includes(searchTerm) || b.isbn.includes(searchTerm)));
        });
    }

    if (addBookForm) {
        addBookForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newIsbn = document.getElementById('new-isbn').value;
            if (books.find(b => b.isbn === newIsbn)) { alert('هذا ISBN موجود بالفعل!'); return; }
            books.push({ isbn: newIsbn, title: document.getElementById('new-title').value, cornerName: document.getElementById('new-corner-name').value, cornerNumber: document.getElementById('new-corner-number').value, status: 'disponible' });
            addBookForm.reset();
            alert('تمت إضافة الكتاب بنجاح!');
            initializeDashboard();
        });
    }

    if (loanIsbnInput) {
        loanIsbnInput.addEventListener('input', (e) => {
            const book = books.find(b => b.isbn === e.target.value);
            if (book) {
                loanBookTitle.textContent = book.title;
                loanCornerName.textContent = book.cornerName;
                loanCornerNumber.textContent = book.cornerNumber;
                if (book.status === 'emprunté') { alert('تحذير: هذا الكتاب معار حاليا!'); }
            } else {
                loanBookTitle.textContent = '-'; loanCornerName.textContent = '-'; loanCornerNumber.textContent = '-';
            }
        });
    }
    
    if(loanForm) {
        loanForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const book = books.find(b => b.isbn === loanIsbnInput.value);
            if(book && book.status === 'disponible') {
                book.status = 'emprunté';
                alert(`تمت إعارة كتاب "${book.title}" بنجاح!`);
                loanForm.reset();
                loanBookTitle.textContent = '-'; loanCornerName.textContent = '-'; loanCornerNumber.textContent = '-';
                initializeDashboard();
            } else { alert('لا يمكن إعارة هذا الكتاب. قد يكون غير موجود أو معار بالفعل.'); }
        });
    }

    if (returnBtn) {
        returnBtn.addEventListener('click', () => {
            const book = books.find(b => b.isbn === loanIsbnInput.value);
            if(book && book.status === 'emprunté') {
                book.status = 'disponible';
                alert(`تم إرجاع كتاب "${book.title}" بنجاح!`);
                loanForm.reset();
                loanBookTitle.textContent = '-'; loanCornerName.textContent = '-'; loanCornerNumber.textContent = '-';
                initializeDashboard();
            } else { alert('لا يمكن إرجاع هذا الكتاب. قد يكون غير موجود أو غير معار.'); }
        });
    }

    // ===================================
    // SYSTÈME DE TRADUCTION
    // ===================================
    const translations = {
        ar: { title: "مكتبة الكوثر", welcome_title: "مرحباً بكم في مكتبة مدارس الكوثر العالمية", welcome_subtitle: "الرجاء إدخال بيانات الاعتماد الخاصة بك للوصول إلى لوحة التحكم.", username_label: "اسم المستخدم", password_label: "كلمة المرور", login_btn: "تسجيل الدخول", dashboard_title: "لوحة تحكم مكتبة الكوثر", school_name: "مدارس الكوثر العالمية", logout_btn_title: "تسجيل الخروج", stats_title: "إحصائيات المكتبة", total_books: "إجمالي الكتب", loaned_books: "الكتب المعارة", available_books: "الكتب المتاحة", scanner_title: "بحث سريع بالباركود", scanner_label: "امسح ISBN الكتاب هنا:", scanner_placeholder: "امسح الباركود...", scanner_instruction: "الرجاء مسح كتاب ضوئياً لعرض معلوماته.", excel_upload_title: "إضافة عبر ملف Excel", excel_instruction: "اختر ملف (.xlsx, .csv) بالأعمدة: ISBN, Title, CornerName, CornerNumber", choose_file_btn: "اختر ملف...", upload_btn: "رفع الملف", search_book_title: "البحث في المخزون", search_placeholder: "ابحث بالعنوان أو ISBN...", isbn_col: "ISBN", title_col: "العنوان", corner_name_col: "اسم الركن", corner_num_col: "رقم الركن", status_col: "الحالة", add_book_title: "تسجيل كتاب جديد يدوياً", book_title_label: "عنوان الكتاب", save_book_btn: "حفظ الكتاب", manage_loan_title: "إدارة الإعارة والعودة", student_name_label: "اسم الطالب", loan_book_btn: "إعارة الكتاب", return_book_btn: "إرجاع الكتاب", corner_name_label: "اسم الركن", corner_num_label: "رقم الركن", section_label: "القسم", select_section: "اختر القسم", section_french: "فرنسي", section_english: "إنجليزي", class_label: "الفصل", loan_date_label: "تاريخ الإعارة", return_date_label: "تاريخ التسليم", coordinator_label: "اسم المنسق المسؤول", footer_text: "© 2025 مدارس الكوثر العالمية - جميع الحقوق محفوظة." },
        fr: { title: "Bibliothèque Al-Kawthar", welcome_title: "Bienvenue à la bibliothèque des écoles Al-Kawthar", welcome_subtitle: "Veuillez entrer vos identifiants pour accéder.", username_label: "Nom d'utilisateur", password_label: "Mot de passe", login_btn: "Connexion", dashboard_title: "Tableau de bord de la bibliothèque", school_name: "Écoles Internationales Al-Kawthar", logout_btn_title: "Déconnexion", stats_title: "Statistiques", total_books: "Total Livres", loaned_books: "Livres Empruntés", available_books: "Livres Disponibles", scanner_title: "Scan rapide par code-barres", scanner_label: "Scannez l'ISBN du livre ici :", scanner_placeholder: "Scanner le code-barres...", scanner_instruction: "Veuillez scanner un livre pour voir ses détails.", excel_upload_title: "Ajout via fichier Excel", excel_instruction: "Choisissez un fichier (.xlsx, .csv) avec les colonnes : ISBN, Title, CornerName, CornerNumber", choose_file_btn: "Choisir un fichier...", upload_btn: "Télécharger", search_book_title: "Rechercher dans l'inventaire", search_placeholder: "Rechercher par titre ou ISBN...", isbn_col: "ISBN", title_col: "Titre", corner_name_col: "Nom du Coin", corner_num_col: "N° Coin", status_col: "Statut", add_book_title: "Ajouter un livre manuellement", book_title_label: "Titre du livre", save_book_btn: "Enregistrer", manage_loan_title: "Gérer les prêts et retours", student_name_label: "Nom de l'élève", loan_book_btn: "Emprunter", return_book_btn: "Retourner", corner_name_label: "Nom du coin", corner_num_label: "Numéro du coin", section_label: "Section", select_section: "Choisir la section", section_french: "Français", section_english: "Anglais", class_label: "Classe", loan_date_label: "Date d'emprunt", return_date_label: "Date de retour", coordinator_label: "Nom du coordinateur", footer_text: "© 2025 Écoles Internationales Al-Kawthar - Tous droits réservés." },
        en: { title: "Alkawthar Library", welcome_title: "Welcome to Alkawthar International Schools Library", welcome_subtitle: "Please enter your credentials to access the dashboard.", username_label: "Username", password_label: "Password", login_btn: "Login", dashboard_title: "Library Dashboard", school_name: "Alkawthar International Schools", logout_btn_title: "Logout", stats_title: "Library Statistics", total_books: "Total Books", loaned_books: "Loaned Books", available_books: "Available Books", scanner_title: "Quick Barcode Scan", scanner_label: "Scan the book's ISBN here:", scanner_placeholder: "Scan barcode...", scanner_instruction: "Please scan a book to see its details.", excel_upload_title: "Add via Excel File", excel_instruction: "Choose a file (.xlsx, .csv) with columns: ISBN, Title, CornerName, CornerNumber", choose_file_btn: "Choose File...", upload_btn: "Upload File", search_book_title: "Search Inventory", search_placeholder: "Search by title or ISBN...", isbn_col: "ISBN", title_col: "Title", corner_name_col: "Corner Name", corner_num_col: "Corner N°", status_col: "Status", add_book_title: "Add a New Book Manually", book_title_label: "Book Title", save_book_btn: "Save Book", manage_loan_title: "Manage Loans & Returns", student_name_label: "Student Name", loan_book_btn: "Loan Book", return_book_btn: "Return Book", corner_name_label: "Corner name", corner_num_label: "Corner number", section_label: "Section", select_section: "Select section", section_french: "French", section_english: "English", class_label: "Class", loan_date_label: "Loan date", return_date_label: "Return date", coordinator_label: "Coordinator's name", footer_text: "© 2025 Alkawthar International Schools - All rights reserved." }
    };
    const switchLanguage = (lang) => {
        document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.querySelectorAll('[data-lang-key]').forEach(el => { const key = el.getAttribute('data-lang-key'); if (translations[lang][key]) el.textContent = translations[lang][key]; });
        document.querySelectorAll('[data-lang-key-placeholder]').forEach(el => { const key = el.getAttribute('data-lang-key-placeholder'); if (translations[lang][key]) el.placeholder = translations[lang][key]; });
        if (dashboardPage.style.display === 'block') { renderTable(books); }
    };
    document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', (e) => switchLanguage(e.target.getAttribute('data-lang'))));
    switchLanguage('ar');
    const style = document.createElement('style');
    style.innerHTML = `@keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }`;
    document.head.appendChild(style);
});
