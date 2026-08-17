// Fichier : /index.js - VERSION FRONTEND FINALE CORRIGÉE
document.addEventListener('DOMContentLoaded', () => {
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_URL = IS_LOCAL ? 'http://localhost:3000/api' : '/api';
    let allBooks = [];
    let allLoans = [];

    // Références DOM
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
    const addBookForm = document.getElementById('add-book-form');
    const excelFileInput = document.getElementById('excel-file-input');
    const uploadExcelBtn = document.getElementById('upload-excel-btn');
    const uploadStatus = document.getElementById('upload-status');
    const loanForm = document.getElementById('loan-form');
    const loanIsbnInput = document.getElementById('loan-isbn');
    const loanBookTitle = document.getElementById('loan-book-title');
    const viewLoansBtn = document.getElementById('view-loans-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const loansModal = document.getElementById('loans-modal');
    const loansModalContent = document.getElementById('loans-modal-content');
    const editModal = document.getElementById('edit-modal');
    const editBookForm = document.getElementById('edit-book-form');
    const loanSearchInput = document.getElementById('loan-search-input');
    const isbnScanner = document.getElementById('isbn-scanner');
    const bookDetailsView = document.getElementById('book-details-view');

    // -------------------------------------------------------
    // Chargement des données
    // -------------------------------------------------------
    const fetchData = async () => {
        try {
            const [booksRes, loansRes] = await Promise.all([
                fetch(`${API_URL}/books`),
                fetch(`${API_URL}/loans`)
            ]);

            // En cas d'erreur serveur, essayer d'extraire le message JSON
            if (!booksRes.ok || !loansRes.ok) {
                const failedRes = !booksRes.ok ? booksRes : loansRes;
                const failedName = !booksRes.ok ? 'livres' : 'prêts';
                let errDetail = `HTTP ${failedRes.status}`;
                let errHint = '';
                try {
                    const errJson = await failedRes.json();
                    if (errJson.details) errDetail = errJson.details;
                    if (errJson.hint)    errHint = '\n\n💡 ' + errJson.hint;
                } catch (_) {}
                throw new Error(`Erreur lors du chargement des ${failedName} : ${errDetail}${errHint}`);
            }

            allBooks = await booksRes.json();
            allLoans = await loansRes.json();
            initializeDashboard();
        } catch (error) {
            console.error("❌ Erreur de chargement des données:", error);
            alert(
                "❌ Impossible de charger les données de la bibliothèque.\n\n" +
                error.message + "\n\n" +
                "Si le problème persiste, vérifiez la variable MONGODB_URI dans les paramètres Vercel."
            );
        }
    };

    // -------------------------------------------------------
    // Statistiques et tableau
    // -------------------------------------------------------
    const updateStats = () => {
        const totalCopies = allBooks.reduce((sum, book) => sum + (book.totalCopies || 0), 0);
        const loanedCopies = allBooks.reduce((sum, book) => sum + (book.loanedCopies || 0), 0);
        totalBooksStat.textContent = totalCopies;
        loanedBooksStat.textContent = loanedCopies;
        availableBooksStat.textContent = totalCopies - loanedCopies;
    };

    const renderTable = (bookList) => {
        booksTableBody.innerHTML = '';
        const currentLang = document.documentElement.lang || 'ar';
        const availabilityTexts = { ar: "متاح", fr: "disponible(s)", en: "available" };
        const actionsTexts = {
            ar: { edit: "تعديل", delete: "حذف" },
            fr: { edit: "Modifier", delete: "Supprimer" },
            en: { edit: "Edit", delete: "Delete" }
        };
        if (bookList.length === 0) {
            booksTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:1rem;">${currentLang === 'ar' ? 'لا توجد كتب' : currentLang === 'fr' ? 'Aucun livre trouvé' : 'No books found'}</td></tr>`;
            return;
        }
        bookList.forEach(book => {
            const availableCopies = (book.totalCopies || 0) - (book.loanedCopies || 0);
            const availabilityClass = availableCopies > 0 ? 'status-available' : 'status-unavailable';
            const lang = actionsTexts[currentLang] || actionsTexts['ar'];
            const availText = availabilityTexts[currentLang] || availabilityTexts['ar'];
            const availabilityText = `${availableCopies} / ${book.totalCopies || 0} ${availText}`;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${book.isbn}</td>
                <td>${book.title}</td>
                <td>${book.cornerName || ''}</td>
                <td>${book.cornerNumber || ''}</td>
                <td><span class="${availabilityClass}">${availabilityText}</span></td>
                <td class="actions-cell">
                    <button class="btn-action btn-edit" title="${lang.edit}"><i class="fas fa-edit"></i></button>
                    <button class="btn-action btn-delete" title="${lang.delete}"><i class="fas fa-trash"></i></button>
                </td>`;
            row.querySelector('.btn-edit').addEventListener('click', () => openEditModal(book.isbn));
            row.querySelector('.btn-delete').addEventListener('click', () => deleteBook(book.isbn, book.title));
            booksTableBody.appendChild(row);
        });
    };

    const initializeDashboard = () => {
        updateStats();
        renderTable(allBooks);
    };

    // -------------------------------------------------------
    // Scanner de code-barres (ISBN)
    // -------------------------------------------------------
    if (isbnScanner) {
        isbnScanner.addEventListener('input', (e) => {
            const isbnValue = e.target.value.trim();
            if (!isbnValue) {
                bookDetailsView.innerHTML = `<p class="placeholder" data-lang-key="scanner_instruction">${translations[document.documentElement.lang || 'ar'].scanner_instruction}</p>`;
                return;
            }
            const book = allBooks.find(b => b.isbn === isbnValue);
            if (book) {
                const availableCopies = (book.totalCopies || 0) - (book.loanedCopies || 0);
                const statusClass = availableCopies > 0 ? 'status-available' : 'status-unavailable';
                const currentLang = document.documentElement.lang || 'ar';
                const availText = { ar: "متاح", fr: "disponible(s)", en: "available" };
                bookDetailsView.innerHTML = `
                    <div class="book-info-found">
                        <p><strong>ISBN :</strong> ${book.isbn}</p>
                        <p><strong>${currentLang === 'ar' ? 'العنوان' : currentLang === 'fr' ? 'Titre' : 'Title'} :</strong> ${book.title}</p>
                        <p><strong>${currentLang === 'ar' ? 'الركن' : currentLang === 'fr' ? 'Coin' : 'Corner'} :</strong> ${book.cornerName || '-'} (${book.cornerNumber || '-'})</p>
                        <p><strong>${currentLang === 'ar' ? 'الإتاحة' : currentLang === 'fr' ? 'Disponibilité' : 'Availability'} :</strong>
                            <span class="${statusClass}">${availableCopies} / ${book.totalCopies} ${availText[currentLang]}</span>
                        </p>
                    </div>`;
                // Auto-remplissage du formulaire de prêt
                if (loanIsbnInput) {
                    loanIsbnInput.value = book.isbn;
                    loanBookTitle.textContent = book.title;
                }
            } else if (isbnValue.length >= 8) {
                const currentLang = document.documentElement.lang || 'ar';
                bookDetailsView.innerHTML = `<p style="color:var(--danger-color,red);padding:0.5rem;">${currentLang === 'ar' ? '❌ لم يتم العثور على كتاب بهذا الرقم.' : currentLang === 'fr' ? '❌ Aucun livre trouvé avec cet ISBN.' : '❌ No book found with this ISBN.'}</p>`;
            }
        });
    }

    // -------------------------------------------------------
    // Affichage des prêts
    // -------------------------------------------------------
    const displayLoans = (searchTerm = '') => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const filteredLoans = allLoans.filter(loan => {
            const book = allBooks.find(b => b.isbn === loan.isbn);
            return loan.studentName.toLowerCase().includes(lowerCaseSearchTerm)
                || (book && book.title.toLowerCase().includes(lowerCaseSearchTerm))
                || loan.isbn.includes(lowerCaseSearchTerm);
        });
        if (filteredLoans.length === 0) {
            loansModalContent.innerHTML = `<p style="text-align: center; padding: 1rem;">لا توجد نتائج مطابقة.</p>`;
            return;
        }
        const currentLang = document.documentElement.lang || 'ar';
        const headers = {
            ar: ["اسم الطالب", "عنوان الكتاب", "تاريخ الإعارة", "تاريخ التسليم", "إجراء"],
            fr: ["Nom de l'étudiant", "Titre du livre", "Date d'emprunt", "Date de retour", "Action"],
            en: ["Student Name", "Book Title", "Loan Date", "Return Date", "Action"]
        };
        const returnText = { ar: "إرجاع", fr: "Retourner", en: "Return" };
        const h = headers[currentLang] || headers['ar'];
        let tableHTML = `<table id="loans-table">
            <thead><tr>
                <th>${h[0]}</th><th>${h[1]}</th><th>${h[2]}</th><th>${h[3]}</th><th>${h[4]}</th>
            </tr></thead><tbody>`;
        filteredLoans.forEach(loan => {
            const book = allBooks.find(b => b.isbn === loan.isbn);
            tableHTML += `<tr>
                <td>${loan.studentName}</td>
                <td>${book ? book.title : (currentLang === 'ar' ? 'كتاب غير معروف' : 'Livre inconnu')}</td>
                <td>${loan.loanDate || '-'}</td>
                <td>${loan.returnDate || '-'}</td>
                <td><button class="btn-action btn-return" data-isbn="${loan.isbn}" data-student="${loan.studentName}">
                    <i class="fas fa-undo"></i> ${returnText[currentLang]}
                </button></td>
            </tr>`;
        });
        tableHTML += `</tbody></table>`;
        loansModalContent.innerHTML = tableHTML;
        document.querySelectorAll('.btn-return').forEach(button => {
            button.addEventListener('click', async (e) => {
                const isbn = e.currentTarget.dataset.isbn;
                const studentName = e.currentTarget.dataset.student;
                await returnLoan(isbn, studentName);
            });
        });
    };

    // -------------------------------------------------------
    // Modales
    // -------------------------------------------------------
    const openModal = (modalElement) => {
        modalOverlay.style.display = 'flex';
        modalElement.style.display = 'flex';
    };
    const closeModal = () => {
        modalOverlay.style.display = 'none';
        editModal.style.display = 'none';
        loansModal.style.display = 'none';
    };
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
    document.querySelectorAll('.close-modal-btn').forEach(btn => btn.addEventListener('click', closeModal));

    const openEditModal = (isbn) => {
        const book = allBooks.find(b => b.isbn === isbn);
        if (!book) return;
        document.getElementById('edit-original-isbn').value = book.isbn;
        document.getElementById('edit-title').value = book.title;
        document.getElementById('edit-isbn').value = book.isbn;
        document.getElementById('edit-quantity').value = book.totalCopies;
        document.getElementById('edit-subject').value = book.subject || '';
        document.getElementById('edit-level').value = book.level || '';
        document.getElementById('edit-language').value = book.language || '';
        document.getElementById('edit-corner-name').value = book.cornerName || '';
        document.getElementById('edit-corner-number').value = book.cornerNumber || '';
        openModal(editModal);
    };

    // -------------------------------------------------------
    // Authentification
    // -------------------------------------------------------
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        if (username === 'Alkawthar@30' && password === 'Alkawthar@30') {
            loginPage.style.display = 'none';
            dashboardPage.style.display = 'block';
            await fetchData();
        } else {
            loginError.textContent = translations[document.documentElement.lang || 'ar'].login_error || 'اسم المستخدم أو كلمة المرور غير صحيحة.';
        }
    });
    logoutBtn.addEventListener('click', () => window.location.reload());

    // -------------------------------------------------------
    // Import Excel
    // -------------------------------------------------------
    uploadExcelBtn.addEventListener('click', () => {
        if (excelFileInput.files.length === 0) {
            uploadStatus.textContent = translations[document.documentElement.lang || 'ar'].choose_file_first || 'الرجاء اختيار ملف.';
            return;
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                uploadStatus.textContent = '⏳ جاري معالجة الملف...';
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(worksheet);
                const booksToImport = json.map(row => ({
                    title: row['Title'] || row['title'] || '',
                    isbn: row['ISBN'] || row['isbn'] ? String(row['ISBN'] || row['isbn']).trim() : null,
                    totalCopies: parseInt(row['QTY'] || row['qty'] || row['Qty'] || 1, 10) || 1,
                    subject: row['Subject'] || row['subject'] || '',
                    level: row['level'] || row['Level'] || '',
                    language: row['language'] || row['Language'] || '',
                    cornerName: row['Corner name'] || row['Corner Name'] || '',
                    cornerNumber: row['Corner number'] || row['Corner Number'] ? String(row['Corner number'] || row['Corner Number']) : ''
                })).filter(b => b.isbn && b.title);
                if (booksToImport.length === 0) {
                    uploadStatus.textContent = '❌ لم يتم العثور على كتب صالحة في الملف. تأكد من أن الأعمدة تحتوي على: Title, ISBN';
                    return;
                }
                const res = await fetch(`${API_URL}/books/import`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(booksToImport)
                });
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || errData.message || `Erreur serveur ${res.status}`);
                }
                const result = await res.json();
                uploadStatus.textContent = `✅ ${result.message} Nouveaux ajoutés: ${result.added}, Déjà existants (ignorés): ${result.skipped}, Erreurs: ${result.errors}.`;
                excelFileInput.value = '';
                await fetchData();
            } catch (error) {
                console.error("Erreur lors de l'import Excel :", error);
                uploadStatus.textContent = `❌ Erreur : ${error.message}`;
            }
        };
        reader.readAsArrayBuffer(excelFileInput.files[0]);
    });

    // -------------------------------------------------------
    // CRUD Livres
    // -------------------------------------------------------
    const deleteBook = async (isbn, title) => {
        const currentLang = document.documentElement.lang || 'ar';
        const confirmMsg = currentLang === 'ar'
            ? `هل تريد حذف "${title}"؟`
            : currentLang === 'fr'
            ? `Êtes-vous sûr de vouloir supprimer "${title}" ?`
            : `Are you sure you want to delete "${title}"?`;
        if (confirm(confirmMsg)) {
            try {
                const res = await fetch(`${API_URL}/books/${isbn}`, { method: 'DELETE' });
                if (!res.ok) throw new Error(`Erreur ${res.status}`);
                await fetchData();
            } catch (err) {
                alert('❌ Erreur lors de la suppression : ' + err.message);
            }
        }
    };

    addBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bookData = {
            isbn: document.getElementById('new-isbn').value.trim(),
            title: document.getElementById('new-title').value,
            totalCopies: parseInt(document.getElementById('new-quantity').value, 10),
            subject: document.getElementById('new-subject').value,
            level: document.getElementById('new-level').value,
            language: document.getElementById('new-language').value,
            cornerName: document.getElementById('new-corner-name').value,
            cornerNumber: document.getElementById('new-corner-number').value
        };
        try {
            const response = await fetch(`${API_URL}/books`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookData)
            });
            if (response.status === 409) {
                const err = await response.json();
                alert('⚠️ ' + err.message);
                return;
            }
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                alert('❌ Erreur : ' + (err.message || err.error || 'Erreur serveur'));
                return;
            }
            addBookForm.reset();
            await fetchData();
            alert('✅ Livre ajouté avec succès !');
        } catch (err) {
            alert('❌ Erreur réseau : ' + err.message);
        }
    });

    editBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const originalIsbn = document.getElementById('edit-original-isbn').value;
        const bookToUpdate = allBooks.find(b => b.isbn === originalIsbn);
        if (!bookToUpdate) return;
        const updatedData = {
            title: document.getElementById('edit-title').value,
            isbn: document.getElementById('edit-isbn').value.trim(),
            totalCopies: parseInt(document.getElementById('edit-quantity').value, 10),
            subject: document.getElementById('edit-subject').value,
            level: document.getElementById('edit-level').value,
            language: document.getElementById('edit-language').value,
            cornerName: document.getElementById('edit-corner-name').value,
            cornerNumber: document.getElementById('edit-corner-number').value
        };
        if (updatedData.totalCopies < (bookToUpdate.loanedCopies || 0)) {
            alert('La quantité totale ne peut pas être inférieure au nombre de livres déjà prêtés.');
            return;
        }
        try {
            const res = await fetch(`${API_URL}/books/${originalIsbn}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert('❌ Erreur : ' + (err.message || err.error || 'Erreur serveur'));
                return;
            }
            closeModal();
            await fetchData();
        } catch (err) {
            alert('❌ Erreur réseau : ' + err.message);
        }
    });

    // -------------------------------------------------------
    // Prêts
    // -------------------------------------------------------
    const returnLoan = async (isbn, studentName) => {
        try {
            const res = await fetch(`${API_URL}/loans/return`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isbn, studentName })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert('❌ Erreur : ' + (err.message || 'Erreur serveur'));
                return;
            }
            await fetchData();
            if (loansModal.style.display === 'flex') {
                displayLoans(loanSearchInput.value);
            }
        } catch (err) {
            alert('❌ Erreur réseau : ' + err.message);
        }
    };

    loanForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loanData = {
            isbn: loanIsbnInput.value.trim(),
            studentName: document.getElementById('student-name').value,
            loanDate: document.getElementById('loan-date').value,
            returnDate: document.getElementById('return-date').value
        };
        try {
            const response = await fetch(`${API_URL}/loans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loanData)
            });
            if (response.ok) {
                loanForm.reset();
                loanBookTitle.textContent = '-';
                if (isbnScanner) isbnScanner.value = '';
                await fetchData();
                alert('✅ تمت إعارة الكتاب بنجاح!');
            } else {
                const err = await response.json().catch(() => ({}));
                alert('❌ ' + (err.message || 'لا يمكن إعارة هذا الكتاب. جميع النسخ معارة بالفعل.'));
            }
        } catch (err) {
            alert('❌ Erreur réseau : ' + err.message);
        }
    });

    loanIsbnInput.addEventListener('input', (e) => {
        const book = allBooks.find(b => b.isbn === e.target.value.trim());
        loanBookTitle.textContent = book ? book.title : '-';
    });

    viewLoansBtn.addEventListener('click', () => {
        displayLoans();
        openModal(loansModal);
        loanSearchInput.value = '';
        loanSearchInput.focus();
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        renderTable(allBooks.filter(b =>
            b.title.toLowerCase().includes(searchTerm) || b.isbn.includes(searchTerm)
        ));
    });

    loanSearchInput.addEventListener('input', (e) => displayLoans(e.target.value));

    // -------------------------------------------------------
    // Traductions (ar / fr / en) — COMPLÈTES
    // -------------------------------------------------------
    const translations = {
        ar: {
            title: "مكتبة الكوثر",
            welcome_title: "مرحباً بكم في مكتبة مدارس الكوثر العالمية",
            welcome_subtitle: "الرجاء إدخال بيانات الاعتماد الخاصة بك للوصول إلى لوحة التحكم.",
            username_label: "اسم المستخدم",
            password_label: "كلمة المرور",
            login_btn: "تسجيل الدخول",
            login_error: "اسم المستخدم أو كلمة المرور غير صحيحة.",
            dashboard_title: "لوحة تحكم مكتبة الكوثر",
            school_name: "مدارس الكوثر العالمية",
            logout_btn_title: "تسجيل الخروج",
            stats_title: "إحصائيات المكتبة",
            total_books: "إجمالي الكتب",
            loaned_books: "الكتب المعارة",
            available_books: "الكتب المتاحة",
            scanner_title: "بحث سريع بالباركود",
            scanner_label: "امسح ISBN الكتاب هنا:",
            scanner_placeholder: "امسح الباركود...",
            scanner_instruction: "الرجاء مسح كتاب ضوئياً لعرض معلوماته.",
            excel_upload_title: "إضافة عبر ملف Excel",
            excel_instruction: "اختر ملف (.xlsx) بالأعمدة: Title, ISBN, QTY, Subject, level, language, Corner name, Corner number",
            choose_file_btn: "اختر ملف...",
            choose_file_first: "الرجاء اختيار ملف.",
            upload_btn: "رفع الملف",
            search_book_title: "البحث في المخزون",
            search_placeholder: "ابحث بالعنوان أو ISBN...",
            isbn_col: "ISBN",
            title_col: "العنوان",
            corner_name_col: "اسم الركن",
            corner_num_col: "رقم الركن",
            availability_col: "الإتاحة",
            actions_col: "الإجراءات",
            add_book_title: "تسجيل كتاب جديد يدوياً",
            book_title_label: "عنوان الكتاب",
            save_book_btn: "حفظ الكتاب",
            manage_loan_title: "إدارة الإعارة",
            student_name_label: "اسم الطالب",
            loan_book_btn: "إعارة الكتاب",
            corner_name_label: "اسم الركن",
            corner_num_label: "رقم الركن",
            quantity_label: "الكمية",
            subject_label: "المادة",
            level_label: "المستوى",
            language_label: "اللغة",
            loan_date_label: "تاريخ الإعارة",
            return_date_label: "تاريخ التسليم",
            footer_text: "© 2025 مدارس الكوثر العالمية - جميع الحقوق محفوظة.",
            view_loans_btn: "عرض الطلاب المستعيرين",
            loaned_books_list_title: "قائمة الكتب المعارة",
            edit_book_title: "تعديل معلومات الكتاب",
            save_changes_btn: "حفظ التغييرات",
            loan_search_placeholder: "ابحث بالاسم، العنوان، أو امسح ISBN...",
            return_action: "إرجاع"
        },
        fr: {
            title: "Bibliothèque Al-Kawthar",
            welcome_title: "Bienvenue à la Bibliothèque des Écoles Alkawthar",
            welcome_subtitle: "Veuillez entrer vos identifiants pour accéder au tableau de bord.",
            username_label: "Nom d'utilisateur",
            password_label: "Mot de passe",
            login_btn: "Se connecter",
            login_error: "Nom d'utilisateur ou mot de passe incorrect.",
            dashboard_title: "Tableau de bord - Bibliothèque Alkawthar",
            school_name: "Écoles Alkawthar International",
            logout_btn_title: "Se déconnecter",
            stats_title: "Statistiques de la bibliothèque",
            total_books: "Total des livres",
            loaned_books: "Livres empruntés",
            available_books: "Livres disponibles",
            scanner_title: "Recherche rapide par code-barres",
            scanner_label: "Scannez l'ISBN du livre ici :",
            scanner_placeholder: "Scanner le code-barres...",
            scanner_instruction: "Veuillez scanner un livre pour afficher ses informations.",
            excel_upload_title: "Ajout via fichier Excel",
            excel_instruction: "Choisir un fichier (.xlsx) avec les colonnes : Title, ISBN, QTY, Subject, level, language, Corner name, Corner number",
            choose_file_btn: "Choisir un fichier...",
            choose_file_first: "Veuillez choisir un fichier.",
            upload_btn: "Importer le fichier",
            search_book_title: "Recherche dans l'inventaire",
            search_placeholder: "Rechercher par titre ou ISBN...",
            isbn_col: "ISBN",
            title_col: "Titre",
            corner_name_col: "Nom du coin",
            corner_num_col: "N° du coin",
            availability_col: "Disponibilité",
            actions_col: "Actions",
            add_book_title: "Enregistrer un nouveau livre manuellement",
            book_title_label: "Titre du livre",
            save_book_btn: "Enregistrer le livre",
            manage_loan_title: "Gestion des emprunts",
            student_name_label: "Nom de l'étudiant",
            loan_book_btn: "Emprunter le livre",
            corner_name_label: "Nom du coin",
            corner_num_label: "N° du coin",
            quantity_label: "Quantité",
            subject_label: "Matière",
            level_label: "Niveau",
            language_label: "Langue",
            loan_date_label: "Date d'emprunt",
            return_date_label: "Date de retour",
            footer_text: "© 2025 Écoles Alkawthar Internationales - Tous droits réservés.",
            view_loans_btn: "Voir les étudiants emprunteurs",
            loaned_books_list_title: "Liste des livres empruntés",
            edit_book_title: "Modifier les informations du livre",
            save_changes_btn: "Enregistrer les modifications",
            loan_search_placeholder: "Rechercher par nom, titre ou scanner l'ISBN...",
            return_action: "Retourner"
        },
        en: {
            title: "Al-Kawthar Library",
            welcome_title: "Welcome to the Alkawthar Schools Library",
            welcome_subtitle: "Please enter your credentials to access the dashboard.",
            username_label: "Username",
            password_label: "Password",
            login_btn: "Login",
            login_error: "Incorrect username or password.",
            dashboard_title: "Alkawthar Library Dashboard",
            school_name: "Alkawthar International Schools",
            logout_btn_title: "Logout",
            stats_title: "Library Statistics",
            total_books: "Total Books",
            loaned_books: "Loaned Books",
            available_books: "Available Books",
            scanner_title: "Quick Barcode Search",
            scanner_label: "Scan book ISBN here:",
            scanner_placeholder: "Scan barcode...",
            scanner_instruction: "Please scan a book to view its information.",
            excel_upload_title: "Add via Excel File",
            excel_instruction: "Choose a file (.xlsx) with columns: Title, ISBN, QTY, Subject, level, language, Corner name, Corner number",
            choose_file_btn: "Choose file...",
            choose_file_first: "Please choose a file.",
            upload_btn: "Upload File",
            search_book_title: "Search Inventory",
            search_placeholder: "Search by title or ISBN...",
            isbn_col: "ISBN",
            title_col: "Title",
            corner_name_col: "Corner Name",
            corner_num_col: "Corner No.",
            availability_col: "Availability",
            actions_col: "Actions",
            add_book_title: "Register New Book Manually",
            book_title_label: "Book Title",
            save_book_btn: "Save Book",
            manage_loan_title: "Manage Loans",
            student_name_label: "Student Name",
            loan_book_btn: "Loan Book",
            corner_name_label: "Corner Name",
            corner_num_label: "Corner No.",
            quantity_label: "Quantity",
            subject_label: "Subject",
            level_label: "Level",
            language_label: "Language",
            loan_date_label: "Loan Date",
            return_date_label: "Return Date",
            footer_text: "© 2025 Alkawthar International Schools - All rights reserved.",
            view_loans_btn: "View Borrowing Students",
            loaned_books_list_title: "List of Loaned Books",
            edit_book_title: "Edit Book Information",
            save_changes_btn: "Save Changes",
            loan_search_placeholder: "Search by name, title, or scan ISBN...",
            return_action: "Return"
        }
    };

    // -------------------------------------------------------
    // Changement de langue
    // -------------------------------------------------------
    const switchLanguage = (lang) => {
        if (!translations[lang]) return;
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.getAttribute('data-lang-key');
            if (translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });
        document.querySelectorAll('[data-lang-key-placeholder]').forEach(el => {
            const key = el.getAttribute('data-lang-key-placeholder');
            if (translations[lang][key]) {
                el.placeholder = translations[lang][key];
            }
        });
        document.title = translations[lang].title;
        if (dashboardPage.style.display === 'block') {
            renderTable(allBooks);
        }
    };

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchLanguage(e.target.getAttribute('data-lang')));
    });

    // Initialisation en arabe
    switchLanguage('ar');
});
