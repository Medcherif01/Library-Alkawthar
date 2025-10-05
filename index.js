document.addEventListener('DOMContentLoaded', () => {
    
    // ===================================
    // CONFIGURATION & VARIABLES GLOBALES
    // ===================================
    const API_URL = 'http://localhost:3000/api'; // URL de votre backend
    let allBooks = [];
    let allLoans = [];

    // ===================================
    // SÉLECTION DES ÉLÉMENTS DU DOM
    // ===================================
    // (Cette section reste identique)
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
    // FONCTIONS DE COMMUNICATION API
    // ===================================
    const fetchData = async () => {
        try {
            console.log("Tentative de chargement des données depuis le serveur...");
            const [booksRes, loansRes] = await Promise.all([
                fetch(`${API_URL}/books`),
                fetch(`${API_URL}/loans`)
            ]);
            
            if (!booksRes.ok || !loansRes.ok) {
                throw new Error('La réponse du serveur n\'est pas valide.');
            }

            allBooks = await booksRes.json();
            allLoans = await loansRes.json();
            console.log("Données chargées avec succès :", { books: allBooks.length, loans: allLoans.length });
            initializeDashboard();
        } catch (error) {
            console.error("❌ Erreur de chargement des données:", error);
            alert("ERREUR : Impossible de charger les données. Vérifiez que le serveur backend est bien démarré et qu'il n'y a pas d'erreur CORS dans la console (F12).");
        }
    };

    // ===================================
    // FONCTIONS D'AFFICHAGE (Identiques à la version précédente)
    // ===================================
    const updateStats = () => {
        const totalCopies = allBooks.reduce((sum, book) => sum + book.totalCopies, 0);
        const loanedCopies = allBooks.reduce((sum, book) => sum + book.loanedCopies, 0);
        totalBooksStat.textContent = totalCopies;
        loanedBooksStat.textContent = loanedCopies;
        availableBooksStat.textContent = totalCopies - loanedCopies;
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
                <td>${book.cornerName || ''}</td>
                <td>${book.cornerNumber || ''}</td>
                <td><span class="${availabilityClass}">${availabilityText}</span></td>
                <td class="actions-cell">
                    <button class="btn-action btn-edit" title="${actionsTexts[currentLang].edit}"><i class="fas fa-edit"></i></button>
                    <button class="btn-action btn-delete" title="${actionsTexts[currentLang].delete}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            row.querySelector('.btn-edit').addEventListener('click', () => openEditModal(book.isbn));
            row.querySelector('.btn-delete').addEventListener('click', () => deleteBook(book.isbn, book.title));
            booksTableBody.appendChild(row);
        });
    };

    const initializeDashboard = () => {
        updateStats();
        renderTable(allBooks);
    };

    const displayLoans = (searchTerm = '') => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const filteredLoans = allLoans.filter(loan => {
            const book = allBooks.find(b => b.isbn === loan.isbn);
            const bookTitle = book ? book.title.toLowerCase() : '';
            return loan.studentName.toLowerCase().includes(lowerCaseSearchTerm) || bookTitle.includes(lowerCaseSearchTerm) || loan.isbn.includes(lowerCaseSearchTerm);
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
        let tableHTML = `<table id="loans-table"><thead><tr><th>${headers[currentLang][0]}</th><th>${headers[currentLang][1]}</th><th>${headers[currentLang][2]}</th><th>${headers[currentLang][3]}</th><th>${headers[currentLang][4]}</th></tr></thead><tbody>`;
        filteredLoans.forEach(loan => {
            const book = allBooks.find(b => b.isbn === loan.isbn);
            tableHTML += `<tr>
                <td>${loan.studentName}</td>
                <td>${book ? book.title : 'غير متوفر'}</td>
                <td>${loan.loanDate}</td>
                <td>${loan.returnDate}</td>
                <td><button class="btn-action btn-return" data-isbn="${loan.isbn}" data-student="${loan.studentName}"><i class="fas fa-undo"></i> ${returnText[currentLang]}</button></td>
            </tr>`;
        });
        tableHTML += `</tbody></table>`;
        loansModalContent.innerHTML = tableHTML;
        document.querySelectorAll('.btn-return').forEach(button => {
            button.addEventListener('click', async (e) => {
                const isbn = e.currentTarget.dataset.isbn;
                const student = e.currentTarget.dataset.student;
                await returnLoan(isbn, student);
            });
        });
    };

    // ===================================
    // GESTION DES MODALES (Identique)
    // ===================================
    const openModal = (modalElement) => { modalOverlay.style.display = 'flex'; modalElement.style.display = 'flex'; };
    const closeModal = () => { modalOverlay.style.display = 'none'; editModal.style.display = 'none'; loansModal.style.display = 'none'; };
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

    // ===================================
    // GESTION DES ÉVÉNEMENTS & ACTIONS
    // ===================================

    // --- Connexion ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (document.getElementById('username').value === 'Alkawthar@30' && document.getElementById('password').value === 'Alkawthar@30') {
            loginPage.style.display = 'none';
            dashboardPage.style.display = 'block';
            await fetchData();
        } else {
            loginError.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة.';
        }
    });

    logoutBtn.addEventListener('click', () => {
        window.location.reload(); // La manière la plus simple de réinitialiser l'état
    });
    
    // --- IMPORT EXCEL CORRIGÉ ---
    uploadExcelBtn.addEventListener('click', () => {
        if (excelFileInput.files.length === 0) {
            uploadStatus.textContent = 'الرجاء اختيار ملف.';
            return;
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                uploadStatus.textContent = 'جاري معالجة الملف...';
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(worksheet);
                
                // **IMPORTANT** : La clé doit correspondre EXACTEMENT au nom de la colonne dans le fichier Excel
                const booksToImport = json.map(row => ({
                    title: row['Title'],
                    isbn: row['ISBN'] ? String(row['ISBN']).trim() : null,
                    totalCopies: parseInt(row['QTY'], 10) || 1,
                    subject: row['Subject'] || '',
                    level: row['level'] || '',
                    language: row['language'] || '',
                    cornerName: row['Corner name'] || '', // Attention à l'espace
                    cornerNumber: row['Corner number'] ? String(row['Corner number']) : '', // Attention à l'espace
                })).filter(b => b.isbn && b.title); // Garde seulement les lignes valides

                console.log("Données à importer :", booksToImport);

                if (booksToImport.length === 0) {
                    uploadStatus.textContent = 'لم يتم العثور على كتب صالحة في الملف.';
                    return;
                }
                
                const res = await fetch(`${API_URL}/books/import`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(booksToImport)
                });

                if (!res.ok) {
                    throw new Error(`Erreur du serveur: ${res.statusText}`);
                }

                const result = await res.json();
                uploadStatus.textContent = `✅ تمت المعالجة: ${result.added} كتاب جديد، ${result.updated} كتاب محدث.`;
                excelFileInput.value = ''; // Réinitialiser le champ de fichier
                await fetchData(); // Recharger toutes les données
            } catch (error) {
                console.error("Erreur lors de l'import Excel :", error);
                uploadStatus.textContent = "❌ خطأ في معالجة الملف.";
            }
        };
        reader.readAsArrayBuffer(excelFileInput.files[0]);
    });

    // ... (Le reste des fonctions d'événements est identique à la version précédente)
    const deleteBook = async (isbn, title) => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer "${title}"?`)) {
            await fetch(`${API_URL}/books/${isbn}`, { method: 'DELETE' });
            await fetchData();
        }
    };
    addBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bookData = { isbn: document.getElementById('new-isbn').value.trim(), title: document.getElementById('new-title').value, totalCopies: parseInt(document.getElementById('new-quantity').value, 10), subject: document.getElementById('new-subject').value, level: document.getElementById('new-level').value, language: document.getElementById('new-language').value, cornerName: document.getElementById('new-corner-name').value, cornerNumber: document.getElementById('new-corner-number').value };
        await fetch(`${API_URL}/books`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bookData) });
        addBookForm.reset();
        await fetchData();
    });
    editBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const originalIsbn = document.getElementById('edit-original-isbn').value;
        const bookToUpdate = allBooks.find(b => b.isbn === originalIsbn);
        if(!bookToUpdate) return;
        const updatedData = { title: document.getElementById('edit-title').value, isbn: document.getElementById('edit-isbn').value.trim(), totalCopies: parseInt(document.getElementById('edit-quantity').value, 10), subject: document.getElementById('edit-subject').value, level: document.getElementById('edit-level').value, language: document.getElementById('edit-language').value, cornerName: document.getElementById('edit-corner-name').value, cornerNumber: document.getElementById('edit-corner-number').value };
        if (updatedData.totalCopies < bookToUpdate.loanedCopies) { alert('La quantité totale ne peut pas être inférieure au nombre de livres déjà prêtés.'); return; }
        await fetch(`${API_URL}/books/${originalIsbn}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData) });
        closeModal();
        await fetchData();
    });
    const returnLoan = async (isbn, studentName) => {
        await fetch(`${API_URL}/loans/${isbn}/${encodeURIComponent(studentName)}`, { method: 'DELETE' });
        await fetchData();
        displayLoans(loanSearchInput.value);
    };
    loanForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loanData = { isbn: loanIsbnInput.value.trim(), studentName: document.getElementById('student-name').value, loanDate: document.getElementById('loan-date').value, returnDate: document.getElementById('return-date').value };
        const response = await fetch(`${API_URL}/loans`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loanData) });
        if (response.ok) { loanForm.reset(); loanBookTitle.textContent = '-'; await fetchData(); alert('تمت إعارة الكتاب بنجاح!'); } else { alert('لا يمكن إعارة هذا الكتاب. جميع النسخ معارة بالفعل.'); }
    });
    returnBtn.addEventListener('click', async () => {
        const isbn = loanIsbnInput.value.trim();
        const studentName = document.getElementById('student-name').value;
        if (!isbn || !studentName) { alert('الرجاء إدخال ISBN واسم الطالب.'); return; }
        const loanToReturn = allLoans.find(l => l.isbn === isbn && l.studentName.toLowerCase() === studentName.toLowerCase());
        if(loanToReturn) { await returnLoan(loanToReturn.isbn, loanToReturn.studentName); loanForm.reset(); loanBookTitle.textContent = '-'; alert('تم إرجاع الكتاب بنجاح.'); } else { alert('لم يتم العثور على عملية إعارة مطابقة.'); }
    });
    searchInput.addEventListener('input', (e) => { const searchTerm = e.target.value.toLowerCase(); renderTable(allBooks.filter(b => b.title.toLowerCase().includes(searchTerm) || b.isbn.includes(searchTerm))); });
    viewLoansBtn.addEventListener('click', () => { displayLoans(); openModal(loansModal); loanSearchInput.value = ''; loanSearchInput.focus(); });
    loanSearchInput.addEventListener('input', (e) => displayLoans(e.target.value));

    // --- Traduction (Identique) ---
    const translations = { ar: { title: "مكتبة الكوثر", welcome_title: "مرحباً بكم في مكتبة مدارس الكوثر العالمية", welcome_subtitle: "الرجاء إدخال بيانات الاعتماد الخاصة بك للوصول إلى لوحة التحكم.", username_label: "اسم المستخدم", password_label: "كلمة المرور", login_btn: "تسجيل الدخول", dashboard_title: "لوحة تحكم مكتبة الكوثر", school_name: "مدارس الكوثر العالمية", logout_btn_title: "تسجيل الخروج", stats_title: "إحصائيات المكتبة", total_books: "إجمالي الكتب", loaned_books: "الكتب المعارة", available_books: "الكتب المتاحة", scanner_title: "بحث سريع بالباركود", scanner_label: "امسح ISBN الكتاب هنا:", scanner_placeholder: "امسح الباركود...", scanner_instruction: "الرجاء مسح كتاب ضوئياً لعرض معلوماته.", excel_upload_title: "إضافة عبر ملف Excel", excel_instruction: "اختر ملف (.xlsx) بالأعمدة: Title, ISBN, QTY, Subject, level, language, Corner name, Corner number", choose_file_btn: "اختر ملف...", upload_btn: "رفع الملف", search_book_title: "البحث في المخزون", search_placeholder: "ابحث بالعنوان أو ISBN...", isbn_col: "ISBN", title_col: "العنوان", corner_name_col: "اسم الركن", corner_num_col: "رقم الركن", availability_col: "الإتاحة", actions_col: "الإجراءات", add_book_title: "تسجيل كتاب جديد يدوياً", book_title_label: "عنوان الكتاب", save_book_btn: "حفظ الكتاب", manage_loan_title: "إدارة الإعارة والعودة", student_name_label: "اسم الطالب", loan_book_btn: "إعارة الكتاب", return_book_btn: "إرجاع الكتاب", corner_name_label: "اسم الركن", corner_num_label: "رقم الركن", quantity_label: "الكمية", subject_label: "المادة", level_label: "المستوى", language_label: "اللغة", loan_date_label: "تاريخ الإعارة", return_date_label: "تاريخ التسليم", footer_text: "© 2025 مدارس الكوثر العالمية - جميع الحقوق محفوظة.", view_loans_btn: "عرض الطلاب المستعيرين", loaned_books_list_title: "قائمة الكتب المعارة", edit_book_title: "تعديل معلومات الكتاب", save_changes_btn: "حفظ التغييرات", loan_search_placeholder: "ابحث بالاسم، العنوان، أو امسح ISBN...", return_action: "إرجاع" }, fr: { /* ... */ }, en: { /* ... */ } };
    const switchLanguage = (lang) => { document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; document.querySelectorAll('[data-lang-key]').forEach(el => { const key = el.getAttribute('data-lang-key'); if (translations[lang] && translations[lang][key]) { el.textContent = translations[lang][key]; } }); document.querySelectorAll('[data-lang-key-placeholder]').forEach(el => { const key = el.getAttribute('data-lang-key-placeholder'); if (translations[lang] && translations[lang][key]) { el.placeholder = translations[lang][key]; } }); if (dashboardPage.style.display === 'block') { renderTable(allBooks); } };
    document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', (e) => switchLanguage(e.target.getAttribute('data-lang'))));
    switchLanguage('ar');
});
