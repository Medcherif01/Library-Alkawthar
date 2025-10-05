require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// --- MIDDLEWARES ---
// Active CORS pour que votre site Vercel puisse parler à l'API
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- CONNEXION À MONGODB ---
// Vercel utilisera les variables d'environnement que vous avez configurées sur le site
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connexion à MongoDB réussie.'))
  .catch((err) => console.error('❌ Erreur de connexion à MongoDB:', err));

// --- MODÈLES DE DONNÉES (SCHEMAS) ---
// Ce code ne change pas
const BookSchema = new mongoose.Schema({
    isbn: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    subject: String, level: String, language: String,
    cornerName: String, cornerNumber: String,
    totalCopies: { type: Number, default: 1, min: 0 },
    loanedCopies: { type: Number, default: 0, min: 0 }
});
// Empêche Mongoose de recréer le modèle s'il existe déjà (important pour Vercel)
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
// Tout ce code est identique à avant

// Obtenir tous les livres
app.get('/api/books', async (req, res) => {
    const books = await Book.find().sort({ title: 1 });
    res.json(books);
});

// Obtenir tous les prêts
app.get('/api/loans', async (req, res) => {
    const loans = await Loan.find();
    res.json(loans);
});

// Importer des livres
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

// Créer un prêt
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

// Retourner un livre
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

// Supprimer un livre
app.delete('/api/books/:isbn', async (req, res) => {
    await Book.deleteOne({ isbn: req.params.isbn });
    await Loan.deleteMany({ isbn: req.params.isbn });
    res.json({ success: true });
});

// Mettre à jour un livre
app.put('/api/books/:isbn', async (req, res) => {
    const updatedBook = await Book.findOneAndUpdate({ isbn: req.params.isbn }, req.body, { new: true });
    res.json(updatedBook);
});

// Ajouter un livre manuellement
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
// LA PARTIE LA PLUS IMPORTANTE ! On remplace app.listen par ceci.
module.exports = app;
