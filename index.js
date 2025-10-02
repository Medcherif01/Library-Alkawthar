document.addEventListener('DOMContentLoaded', () => {

    const loginPage = document.getElementById('login-page');
    const dashboardPage = document.getElementById('dashboard-page');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    // =============================
    // SYSTÈME DE TRADUCTION
    // =============================
    const translations = {
        ar: {
            title: "مكتبة الكوثر",
            welcome_title: "مرحباً بكم في مكتبة مدارس الكوثر العالمية",
            welcome_subtitle: "الرجاء إدخال بيانات الاعتماد الخاصة بك للوصول إلى لوحة التحكم.",
            username_label: "اسم المستخدم",
            password_label: "كلمة المرور",
            login_btn: "تسجيل الدخول",
            dashboard_title: "لوحة تحكم مكتبة الكوثر",
            school_name: "مدارس الكوثر العالمية",
            scanner_title: "إدارة سريعة عبر الباركود",
            scanner_label: "امسح ISBN الكتاب هنا أو أدخله يدويًا:",
            scanner_placeholder: "أدخل ISBN...",
            scanner_instruction: "الرجاء مسح كتاب ضوئياً لعرض معلوماته.",
            excel_upload_title: "إضافة كتب عبر ملف Excel",
            excel_instruction: "اختر ملف (.xlsx, .csv) بالأعمدة: ISBN, Title, Section, CornerName, CornerNumber",
            choose_file_btn: "اختر ملف...",
            upload_btn: "رفع ومعالجة الملف",
            add_book_title: "تسجيل كتاب جديد",
            book_title_label: "عنوان الكتاب",
            save_book_btn: "حفظ الكتاب",
            manage_loan_title: "إدارة الإعارة والعودة",
            student_name_label: "اسم الطالب",
            loan_book_btn: "إعارة الكتاب",
            return_book_btn: "إرجاع الكتاب",
            footer_text: "© 2025 مدارس الكوثر العالمية - جميع الحقوق محفوظة."
        },
        fr: {
            title: "Bibliothèque Al-Kawthar",
            welcome_title: "Bienvenue à la bibliothèque des écoles internationales Al-Kawthar",
            welcome_subtitle: "Veuillez entrer vos identifiants pour accéder au tableau de bord.",
            username_label: "Nom d'utilisateur",
            password_label: "Mot de passe",
            login_btn: "Connexion",
            dashboard_title: "Tableau de bord de la bibliothèque",
            school_name: "Écoles Internationales Al-Kawthar",
            scanner_title: "Gestion rapide par code-barres",
            scanner_label: "Scannez ou saisissez l'ISBN du livre ici :",
            scanner_placeholder: "Entrez l'ISBN...",
            scanner_instruction: "Veuillez scanner un livre pour afficher ses informations.",
            excel_upload_title: "Ajouter des livres via un fichier Excel",
            excel_instruction: "Choisissez un fichier (.xlsx, .csv) avec les colonnes : ISBN, Title, Section, CornerName, CornerNumber",
            choose_file_btn: "Choisir un fichier...",
            upload_btn: "Télécharger et traiter",
            add_book_title: "Ajouter un nouveau livre",
            book_title_label: "Titre du livre",
            save_book_btn: "Enregistrer le livre",
            manage_loan_title: "Gérer les prêts et retours",
            student_name_label: "Nom de l'élève",
            loan_book_btn: "Emprunter le livre",
            return_book_btn: "Retourner le livre",
            footer_text: "© 2025 Écoles Internationales Al-Kawthar - Tous droits réservés."
        },
        en: {
            title: "Alkawthar Library",
            welcome_title: "Welcome to the Alkawthar International Schools Library",
            welcome_subtitle: "Please enter your credentials to access the dashboard.",
            username_label: "Username",
            password_label: "Password",
            login_btn: "Login",
            dashboard_title: "Library Dashboard",
            school_name: "Alkawthar International Schools",
            scanner_title: "Quick Management via Barcode",
            scanner_label: "Scan or enter the book's ISBN here:",
            scanner_placeholder: "Enter ISBN...",
            scanner_instruction: "Please scan a book to display its information.",
            excel_upload_title: "Add Books via Excel File",
            excel_instruction: "Choose a file (.xlsx, .csv) with columns: ISBN, Title, Section, CornerName, CornerNumber",
            choose_file_btn: "Choose file...",
            upload_btn: "Upload and Process",
            add_book_title: "Add a New Book",
            book_title_label: "Book Title",
            save_book_btn: "Save Book",
            manage_loan_title: "Manage Loans & Returns",
            student_name_label: "Student Name",
            loan_book_btn: "Loan Book",
            return_book_btn: "Return Book",
            footer_text: "© 2025 Alkawthar International Schools - All rights reserved."
        }
    };

    const switchLanguage = (lang) => {
        // Gérer la direction du texte
        if (lang === 'ar') {
            document.documentElement.setAttribute('dir', 'rtl');
        } else {
            document.documentElement.setAttribute('dir', 'ltr');
        }
        document.documentElement.setAttribute('lang', lang);

        // Traduire tous les éléments avec data-lang-key
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.getAttribute('data-lang-key');
            if (translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });

        // Traduire tous les placeholders
        document.querySelectorAll('[data-lang-key-placeholder]').forEach(el => {
            const key = el.getAttribute('data-lang-key-placeholder');
            if (translations[lang][key]) {
                el.placeholder = translations[lang][key];
            }
        });
    };

    // Ajouter des écouteurs d'événements aux boutons de langue
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const lang = e.target.getAttribute('data-lang');
            switchLanguage(lang);
        });
    });

    // Initialiser en arabe par défaut
    switchLanguage('ar');

    // =============================
    // LOGIQUE DE CONNEXION (CORRIGÉE)
    // =============================
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const usernameInput = document.getElementById('username').value;
            const passwordInput = document.getElementById('password').value;

            // Identifiants de connexion
            const correctUsername = 'Alkawthar@30';
            const correctPassword = 'Alkawthar@30';

            if (usernameInput === correctUsername && passwordInput === correctPassword) {
                loginError.textContent = '';
                loginPage.classList.add('fade-out');
                setTimeout(() => {
                    loginPage.style.display = 'none';
                    dashboardPage.style.display = 'block';
                }, 500);
            } else {
                loginError.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة.'; // Ce message pourrait aussi être traduit
                loginForm.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    loginForm.style.animation = '';
                }, 500);
            }
        });
    }
});

// Animation de secousse en cas d'erreur
const style = document.createElement('style');
style.innerHTML = `
@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}`;
document.head.appendChild(style);
