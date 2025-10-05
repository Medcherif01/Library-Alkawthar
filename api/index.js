require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// --- MESSAGE DE DÉBOGAGE AU DÉMARRAGE ---
console.log("INITIALISATION DU SERVEUR API...");

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- VÉRIFICATION DE LA VARIABLE D'ENVIRONNEMENT ---
if (!process.env.MONGODB_URI) {
    console.error("ERREUR FATALE: La variable d'environnement MONGODB_URI n'est pas définie.");
    // On envoie une réponse d'erreur claire si la variable manque
    app.use('/api/*', (req, res) => {
        res.status(500).json({ 
            error: "Erreur de configuration du serveur.",
            message: "La chaîne de connexion à la base de données est manquante."
        });
    });
} else {
    console.log("Variable MONGODB_URI trouvée. Tentative de connexion...");
    // --- CONNEXION À MONGODB ---
    mongoose.connect(process.env.MONGODB_URI)
      .then(() => console.log('✅ Connexion à MongoDB réussie.'))
      .catch((err) => console.error('❌ Erreur de connexion à MongoDB:', err.message));
}

// --- MODÈLES DE DONNÉES (SCHEMAS) ---
const BookSchema = new mongoose.Schema({
    isbn: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    subject: String, level: String, language: String,
    cornerName: String, cornerNumber: String,
    totalCopies: { type: Number, default: 1, min: 0 },
    loanedCopies: { type: Number, default: 0, min: 0 }
});
const Book = mongoose.models.Book || mongoose.model('Book', BookSchema);

const LoanSchema = new mongoose.Schema({
    isbn: { type: String, required: true },
    studentName: { type: String, required: true },
    loanDate: String, returnDate: String
});
const Loan = mongoose.models.Loan || mongoose.model('Loan', LoanSchema);

const HistorySchema = new mongoose.Schema({
    isbn: { type: String, required: true },
    title: { type: String, required: true },
    studentName: { type: String, required: true },
    loanDate: String,
    actualReturnDate: { type: Date, default: Date.now }
});
const History = mongoose.models.History || mongoose.model('History', HistorySchema);

// --- ROUTES DE L'API ---
app.get('/api/books', async (req, res) => {
    try {
        const books = await Book.find().sort({ title: 1 });
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur lors de la récupération des livres." });
    }
});

// ... (le reste des routes reste identique)
app.get('/api/loans', async (req, res) => {
    const loans = await Loan.find();
    res.json(loans);
});
app.post('/api/books/import', async (req, res) => {
    const booksToImport = req.body;
    let addedCount = 0, updatedCount = 0;
    for (const bookData of booksToImport) {
        if (!bookData.isbn || !bookData.title) continue;
        const existingBook = await Book.findOne({ isbn: bookData.isbn });
        if (existingBook) {
            existingBook.totalCopies += isNaN(bookData.totalCopies) ? 0 : bookData.totalCopies;
            await existingBook.save();
            updatedCount++;
        } else {
            await Book.create(bookData);
            addedCount++;
        }
    }
    res.status(201).json({ message: 'Importation réussie', added: addedCount, updated: updatedCount });
});
app.post('/api/loans', async (req, res) => {
    const loanData = req.body;
    const book = await Book.findOne({ isbn: loanData.isbn });
    if (book && book.loanedCopies < book.totalCopies) {
        book.loanedCopies++;
        await book.save();
        const newLoan = await Loan.create(loanData);
        res.status(201).json(newLoan);
    } else {
        res.status(400).json({ message: 'Livre non disponible.' });
    }
});
app.post('/api/loans/return', async (req, res) => {
    const { isbn, studentName } = req.body;
    const loan = await Loan.findOneAndDelete({ isbn, studentName });
    if (!loan) return res.status(404).json({ message: "Prêt non trouvé." });
    const book = await Book.findOne({ isbn: loan.isbn });
    if (book) {
        if (book.loanedCopies > 0) book.loanedCopies--;
        await book.save();
        await History.create({ isbn: loan.isbn, title: book.title, studentName: loan.studentName, loanDate: loan.loanDate });
    }
    res.json({ success: true });
});
app.delete('/api/books/:isbn', async (req, res) => {
    await Book.deleteOne({ isbn: req.params.isbn });
    await Loan.deleteMany({ isbn: req.params.isbn });
    res.json({ success: true });
});
app.put('/api/books/:isbn', async (req, res) => {
    const updatedBook = await Book.findOneAndUpdate({ isbn: req.params.isbn }, req.body, { new: true });
    res.json(updatedBook);
});
app.post('/api/books', async (req, res) => {
    const bookData = req.body;
    const existingBook = await Book.findOne({ isbn: bookData.isbn });
     if (existingBook) {
        existingBook.totalCopies += bookData.totalCopies;
        await existingBook.save();
        res.json(existingBook);
    } else {
        const newBook = await Book.create(bookData);
        res.json(newBook);
    }
});

// --- EXPORTATION POUR VERCEL ---
module.exports = app;
