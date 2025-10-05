// Fichier : /api/index.js - VERSION FINALE ET ROBUSTE
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connexion à MongoDB réussie.'))
  .catch((err) => console.error('Erreur de connexion à MongoDB:', err));

// Modèles de données
const BookSchema = new mongoose.Schema({ isbn: { type: String, required: true, unique: true }, title: { type: String, required: true }, subject: String, level: String, language: String, cornerName: String, cornerNumber: String, totalCopies: { type: Number, default: 1 }, loanedCopies: { type: Number, default: 0 } });
const Book = mongoose.models.Book || mongoose.model('Book', BookSchema);

const LoanSchema = new mongoose.Schema({ isbn: { type: String, required: true }, studentName: { type: String, required: true }, loanDate: String, returnDate: String });
const Loan = mongoose.models.Loan || mongoose.model('Loan', LoanSchema);

const HistorySchema = new mongoose.Schema({ isbn: { type: String, required: true }, title: { type: String, required: true }, studentName: { type: String, required: true }, loanDate: String, actualReturnDate: { type: Date, default: Date.now } });
const History = mongoose.models.History || mongoose.model('History', HistorySchema);

// --- ROUTES API AMÉLIORÉES ---

app.get('/api/books', async (req, res) => { try { const books = await Book.find().sort({ title: 1 }); res.json(books); } catch (e) { res.status(500).json({error: e.message}); } });
app.get('/api/loans', async (req, res) => { try { const loans = await Loan.find(); res.json(loans); } catch (e) { res.status(500).json({error: e.message}); } });

// ROUTE D'IMPORTATION CORRIGÉE ET ROBUSTE
app.post('/api/books/import', async (req, res) => {
    const booksToImport = req.body;
    let addedCount = 0, updatedCount = 0, duplicateCount = 0;

    for (const bookData of booksToImport) {
        if (!bookData.isbn || !bookData.title) continue;
        try {
            const existingBook = await Book.findOne({ isbn: bookData.isbn });
            if (existingBook) {
                existingBook.totalCopies += isNaN(bookData.totalCopies) ? 0 : bookData.totalCopies;
                await existingBook.save();
                updatedCount++;
            } else {
                await Book.create(bookData);
                addedCount++;
            }
        } catch (error) {
            // Si c'est une erreur de doublon (code 11000), on l'ignore et on continue
            if (error.code === 11000) {
                duplicateCount++;
                console.log(`Doublon ignoré pour l'ISBN: ${bookData.isbn}`);
            } else {
                // Pour les autres erreurs, on les logue mais on ne fait pas planter le serveur
                console.error(`Erreur lors de l'import du livre ${bookData.title}:`, error.message);
            }
        }
    }
    res.status(201).json({
        message: 'Importation terminée.',
        added: addedCount,
        updated: updatedCount,
        duplicates: duplicateCount
    });
});

app.post('/api/loans', async (req, res) => {
    const loanData = req.body; const book = await Book.findOne({ isbn: loanData.isbn });
    if (book && book.loanedCopies < book.totalCopies) { book.loanedCopies++; await book.save(); const newLoan = await Loan.create(loanData); res.status(201).json(newLoan); } else { res.status(400).json({ message: 'Livre non disponible.' }); }
});
app.post('/api/loans/return', async (req, res) => {
    const { isbn, studentName } = req.body; const loan = await Loan.findOneAndDelete({ isbn, studentName });
    if (!loan) return res.status(404).json({ message: "Prêt non trouvé." });
    const book = await Book.findOne({ isbn: loan.isbn });
    if (book) { if (book.loanedCopies > 0) book.loanedCopies--; await book.save(); await History.create({ isbn: loan.isbn, title: book.title, studentName: loan.studentName, loanDate: loan.loanDate }); }
    res.json({ success: true });
});
app.delete('/api/books/:isbn', async (req, res) => { await Book.deleteOne({ isbn: req.params.isbn }); await Loan.deleteMany({ isbn: req.params.isbn }); res.json({ success: true }); });
app.put('/api/books/:isbn', async (req, res) => { const updatedBook = await Book.findOneAndUpdate({ isbn: req.params.isbn }, req.body, { new: true }); res.json(updatedBook); });
app.post('/api/books', async (req, res) => {
    const bookData = req.body; const existingBook = await Book.findOne({ isbn: bookData.isbn });
    if (existingBook) { existingBook.totalCopies += bookData.totalCopies; await existingBook.save(); res.json(existingBook); } else { const newBook = await Book.create(bookData); res.json(newBook); }
});

module.exports = app;
