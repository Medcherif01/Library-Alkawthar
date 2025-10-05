require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONNEXION À MONGODB ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connecté à MongoDB avec succès !'))
  .catch((err) => console.error('Erreur de connexion à MongoDB:', err));

// --- MODÈLES DE DONNÉES (SCHEMAS) ---
const BookSchema = new mongoose.Schema({
    isbn: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    subject: String,
    level: String,
    language: String,
    cornerName: String,
    cornerNumber: String,
    totalCopies: { type: Number, default: 1 },
    loanedCopies: { type: Number, default: 0 }
});
const Book = mongoose.model('Book', BookSchema);

const LoanSchema = new mongoose.Schema({
    isbn: { type: String, required: true },
    studentName: { type: String, required: true },
    loanDate: String,
    returnDate: String
});
const Loan = mongoose.model('Loan', LoanSchema);

// --- ROUTES DE L'API ---

// Obtenir tous les livres
app.get('/api/books', async (req, res) => {
    const books = await Book.find();
    res.json(books);
});

// Obtenir tous les prêts
app.get('/api/loans', async (req, res) => {
    const loans = await Loan.find();
    res.json(loans);
});

// Importer des livres depuis Excel
app.post('/api/books/import', async (req, res) => {
    const booksToImport = req.body;
    let addedCount = 0;
    let updatedCount = 0;

    for (const bookData of booksToImport) {
        const existingBook = await Book.findOne({ isbn: bookData.isbn });
        if (existingBook) {
            existingBook.totalCopies += bookData.totalCopies;
            await existingBook.save();
            updatedCount++;
        } else {
            await Book.create(bookData);
            addedCount++;
        }
    }
    res.json({ message: 'Importation réussie', added: addedCount, updated: updatedCount });
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

// Mettre à jour un livre
app.put('/api/books/:isbn', async (req, res) => {
    const updatedBook = await Book.findOneAndUpdate({ isbn: req.params.isbn }, req.body, { new: true });
    res.json(updatedBook);
});

// Supprimer un livre
app.delete('/api/books/:isbn', async (req, res) => {
    await Book.deleteOne({ isbn: req.params.isbn });
    await Loan.deleteMany({ isbn: req.params.isbn }); // Supprime aussi les prêts liés
    res.json({ success: true });
});

// Créer un prêt
app.post('/api/loans', async (req, res) => {
    const loanData = req.body;
    const book = await Book.findOne({ isbn: loanData.isbn });
    if (book && book.loanedCopies < book.totalCopies) {
        book.loanedCopies++;
        await book.save();
        const newLoan = await Loan.create(loanData);
        res.json(newLoan);
    } else {
        res.status(400).json({ message: 'Livre non disponible pour le prêt.' });
    }
});

// Supprimer un prêt (retourner un livre)
app.delete('/api/loans/:isbn/:studentName', async (req, res) => {
    const { isbn, studentName } = req.params;
    const loan = await Loan.findOneAndDelete({ isbn, studentName });
    if (loan) {
        const book = await Book.findOne({ isbn });
        if (book && book.loanedCopies > 0) {
            book.loanedCopies--;
            await book.save();
        }
    }
    res.json({ success: true });
});


// --- DÉMARRAGE DU SERVEUR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Le serveur écoute sur le port ${PORT}`);
});
