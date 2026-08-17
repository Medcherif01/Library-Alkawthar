// Fichier : /api/index.js - VERSION VERCEL + MONGODB ROBUSTE
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// -------------------------------------------------------
// Connexion MongoDB avec mise en cache pour Vercel serverless
// (évite d'ouvrir une nouvelle connexion à chaque requête)
// -------------------------------------------------------
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) return;

  if (!process.env.MONGODB_URI) {
    throw new Error('La variable d\'environnement MONGODB_URI est manquante. Veuillez la configurer dans Vercel.');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('✅ Connexion à MongoDB réussie.');
  } catch (err) {
    console.error('❌ Erreur de connexion à MongoDB:', err.message);
    throw err;
  }
};

// Middleware de connexion automatique avant chaque requête
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    res.status(503).json({
      error: 'Impossible de se connecter à la base de données.',
      details: err.message
    });
  }
});

// -------------------------------------------------------
// Modèles de données Mongoose
// -------------------------------------------------------
const BookSchema = new mongoose.Schema({
  isbn: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  subject: { type: String, default: '' },
  level: { type: String, default: '' },
  language: { type: String, default: '' },
  cornerName: { type: String, default: '' },
  cornerNumber: { type: String, default: '' },
  totalCopies: { type: Number, default: 1 },
  loanedCopies: { type: Number, default: 0 }
}, { timestamps: true });

const LoanSchema = new mongoose.Schema({
  isbn: { type: String, required: true },
  studentName: { type: String, required: true },
  loanDate: { type: String, default: '' },
  returnDate: { type: String, default: '' }
}, { timestamps: true });

const HistorySchema = new mongoose.Schema({
  isbn: { type: String, required: true },
  title: { type: String, required: true },
  studentName: { type: String, required: true },
  loanDate: { type: String, default: '' },
  actualReturnDate: { type: Date, default: Date.now }
}, { timestamps: true });

const Book = mongoose.models.Book || mongoose.model('Book', BookSchema);
const Loan = mongoose.models.Loan || mongoose.model('Loan', LoanSchema);
const History = mongoose.models.History || mongoose.model('History', HistorySchema);

// -------------------------------------------------------
// Route de vérification de l'état
// -------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: isConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// -------------------------------------------------------
// Routes LIVRES
// -------------------------------------------------------

// GET tous les livres
app.get('/api/books', async (req, res) => {
  try {
    const books = await Book.find().sort({ title: 1 });
    res.json(books);
  } catch (err) {
    console.error('GET /api/books error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST ajouter un livre manuellement
app.post('/api/books', async (req, res) => {
  try {
    const bookData = req.body;
    if (!bookData.isbn || !bookData.title) {
      return res.status(400).json({ message: 'ISBN et Titre sont obligatoires.' });
    }
    const cleanIsbn = String(bookData.isbn).trim();
    const existingBook = await Book.findOne({ isbn: cleanIsbn });
    if (existingBook) {
      return res.status(409).json({
        message: `Un livre avec l'ISBN "${cleanIsbn}" existe déjà : "${existingBook.title}". Utilisez le bouton Modifier pour mettre à jour ce livre.`
      });
    }
    const newBook = await Book.create({ ...bookData, isbn: cleanIsbn });
    res.status(201).json(newBook);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Un livre avec cet ISBN existe déjà.' });
    }
    console.error('POST /api/books error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST importation via Excel (ajoute uniquement les nouveaux livres)
app.post('/api/books/import', async (req, res) => {
  try {
    const booksToImport = req.body;
    if (!Array.isArray(booksToImport) || booksToImport.length === 0) {
      return res.status(400).json({ message: 'Aucun livre à importer.' });
    }

    let addedCount = 0, skippedCount = 0, errorCount = 0;

    for (const bookData of booksToImport) {
      if (!bookData.isbn || !bookData.title) { errorCount++; continue; }
      const cleanIsbn = String(bookData.isbn).trim();
      try {
        const existingBook = await Book.findOne({ isbn: cleanIsbn });
        if (existingBook) {
          skippedCount++;
        } else {
          await Book.create({ ...bookData, isbn: cleanIsbn });
          addedCount++;
        }
      } catch (err) {
        if (err.code === 11000) {
          skippedCount++;
        } else {
          errorCount++;
          console.error(`Erreur import livre "${bookData.title}":`, err.message);
        }
      }
    }

    res.status(201).json({
      message: 'Importation terminée.',
      added: addedCount,
      skipped: skippedCount,
      errors: errorCount
    });
  } catch (err) {
    console.error('POST /api/books/import error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT modifier un livre
app.put('/api/books/:isbn', async (req, res) => {
  try {
    const updatedBook = await Book.findOneAndUpdate(
      { isbn: req.params.isbn },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedBook) {
      return res.status(404).json({ message: 'Livre non trouvé.' });
    }
    res.json(updatedBook);
  } catch (err) {
    console.error('PUT /api/books/:isbn error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE supprimer un livre et ses prêts
app.delete('/api/books/:isbn', async (req, res) => {
  try {
    const isbn = req.params.isbn;
    await Book.deleteOne({ isbn });
    await Loan.deleteMany({ isbn });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/books/:isbn error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------
// Routes PRÊTS
// -------------------------------------------------------

// GET tous les prêts
app.get('/api/loans', async (req, res) => {
  try {
    const loans = await Loan.find().sort({ createdAt: -1 });
    res.json(loans);
  } catch (err) {
    console.error('GET /api/loans error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST créer un prêt
app.post('/api/loans', async (req, res) => {
  try {
    const loanData = req.body;
    if (!loanData.isbn || !loanData.studentName) {
      return res.status(400).json({ message: 'ISBN et nom de l\'étudiant sont obligatoires.' });
    }
    const book = await Book.findOne({ isbn: loanData.isbn });
    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé.' });
    }
    if (book.loanedCopies >= book.totalCopies) {
      return res.status(400).json({ message: 'Livre non disponible. Toutes les copies sont déjà empruntées.' });
    }
    book.loanedCopies++;
    await book.save();
    const newLoan = await Loan.create(loanData);
    res.status(201).json(newLoan);
  } catch (err) {
    console.error('POST /api/loans error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST retourner un livre
app.post('/api/loans/return', async (req, res) => {
  try {
    const { isbn, studentName } = req.body;
    if (!isbn || !studentName) {
      return res.status(400).json({ message: 'ISBN et nom de l\'étudiant sont obligatoires.' });
    }
    const loan = await Loan.findOneAndDelete({ isbn, studentName });
    if (!loan) {
      return res.status(404).json({ message: 'Prêt non trouvé.' });
    }
    const book = await Book.findOne({ isbn: loan.isbn });
    if (book) {
      if (book.loanedCopies > 0) book.loanedCopies--;
      await book.save();
      await History.create({
        isbn: loan.isbn,
        title: book.title,
        studentName: loan.studentName,
        loanDate: loan.loanDate,
        actualReturnDate: new Date()
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/loans/return error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------
// Export pour Vercel (serverless function)
// -------------------------------------------------------
module.exports = app;
