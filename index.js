document.addEventListener('DOMContentLoaded', () => {

    const loginPage = document.getElementById('login-page');
    const dashboardPage = document.getElementById('dashboard-page');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    // Vérifier si le formulaire de connexion existe
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Empêche le rechargement de la page

            const usernameInput = document.getElementById('username').value;
            const passwordInput = document.getElementById('password').value;

            // Identifiants de connexion
            const correctUsername = 'Alkawthar@30';
            const correctPassword = 'Alkawthar@30';

            if (usernameInput === correctUsername && passwordInput === correctPassword) {
                // Connexion réussie
                loginError.textContent = '';
                
                // Animation de transition
                loginPage.classList.add('fade-out');

                setTimeout(() => {
                    loginPage.style.display = 'none';
                    dashboardPage.style.display = 'block';
                }, 500); // 500ms correspond à la durée de la transition CSS

            } else {
                // Connexion échouée
                loginError.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة.';
                // Ajoute une petite animation de secousse au formulaire
                loginForm.style.animation = 'shake 0.5s';
                // Réinitialise l'animation pour qu'elle puisse se reproduire
                setTimeout(() => {
                    loginForm.style.animation = '';
                }, 500);
            }
        });
    }

    // --- Logique du tableau de bord (à compléter) ---

    // Exemple de logique pour l'upload de fichier Excel
    const uploadBtn = document.getElementById('upload-excel-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            const fileInput = document.getElementById('excel-file-input');
            const statusDiv = document.getElementById('upload-status');
            if (fileInput.files.length > 0) {
                statusDiv.textContent = `Fichier "${fileInput.files[0].name}" prêt à être traité...`;
                // Ici, vous ajouteriez la logique de lecture du fichier Excel avec la librairie xlsx
            } else {
                statusDiv.textContent = 'Veuillez d'abord sélectionner un fichier.';
            }
        });
    }

    // Ici, vous pouvez ajouter le reste de la logique pour :
    // - La gestion du scanner de code-barres
    // - L'ajout de livre
    // - La gestion des prêts et retours
    // - Le changement de langue
});

// Ajout d'une feuille de style pour l'animation de secousse (shake)
const style = document.createElement('style');
style.innerHTML = `
@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
`;
document.head.appendChild(style);
