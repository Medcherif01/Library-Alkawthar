require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- CONNEXION À MONGODB ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connecté à MongoDB avec succès !'))
  .catch((err) => console.error('❌ Erreur de connexion à MongoDB:', err));

// --- MODÈLES DE DONNÉES (SCHEMAS) ---
const BookSchema = new mongoose.Schema({
    isbn: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    subject: String,
    level: String,
    language: String,
    cornerName: String,
    cornerNumber: String,
    totalCopies: { type: Number, default: 1, min: 0 },
    loanedCopies: { type: Number, default: 0, min: 0 }
});
const Book = mongoose.model('Book', BookSchema);

const LoanSchema = new mongoose.Schema({
    isbn: { type: String, required: true },
    studentName: { type: String, required: true },
    loanDate: String,
    returnDate: String
});
const Loan = mongoose.model('Loan', LoanSchema);

// NOUVEAU : Schéma pour l'historique
const HistorySchema = new mongoose.Schema({
    isbn: { type: String, required: true },
    title: { type: String, required: true }, // On stocke le titre pour ne pas le perdre
    studentName: { type: String, required: true },
    loanDate: String,
    actualReturnDate: { type: Date, default: Date.now } // Date à laquelle le livre a été retourné
});
const History = mongoose.model('History', HistorySchema);


// --- ROUTES DE L'API ---

// Obtenir tous les livres
app.get('/api/books', async (req, res) => {
    try {
        const books = await Book.find().sort({ title: 1 });
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur lors de la récupération des livres.", error });
    }
});

// Obtenir tous les prêts
app.get('/api/loans', async (req, res) => {
    try {
        const loans = await Loan.find();
        res.json(loans);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur lors de la récupération des prêts.", error });
    }
});

// Importer des livres depuis Excel
app.post('/api/books/import', async (req, res) => {
    const booksToImport = req.body;
    if (!booksToImport || !Array.isArray(booksToImport)) {
        return res.status(400).json({ message: 'Aucune donnée à importer.' });
    }

    let addedCount = 0;
    let updatedCount = 0;

    try {
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
    } catch (error) {
        console.error("Erreur lors de l'importation:", error);
        res.status(500).json({ message: "Une erreur s'est produite lors de l'importation.", error });
    }
});

// Créer un prêt
app.post('/api/loans', async (req, res) => {
    const loanData = req.body;
    try {
        const book = await Book.findOne({ isbn: loanData.isbn });
        if (book && book.loanedCopies < book.totalCopies) {
            book.loanedCopies++;
            await book.save();
            const newLoan = await Loan.create(loanData);
            res.status(201).json(newLoan);
        } else {
            res.status(400).json({ message: 'Livre non disponible pour le prêt.' });
        }
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la création du prêt.", error });
    }
});

// NOUVEAU : Retourner un livre (supprime le prêt et crée un enregistrement historique)
app.post('/api/loans/return', async (req, res) => {
    const { isbn, studentName } = req.body;

    try {
        // 1. Trouver et supprimer le prêt
        const loan = await Loan.findOneAndDelete({ isbn, studentName });
        
        if (!loan) {
            return res.status(404).json({ message: "Prêt non trouvé." });
        }

        // 2. Mettre à jour le nombre de copies du livre
        const book = await Book.findOne({ isbn: loan.isbn });
        if (book) {
            if (book.loanedCopies > 0) {
                book.loanedCopies--;
            }
            await book.save();

            // 3. Créer un enregistrement dans l'historique
            await History.create({
                isbn: loan.isbn,
                title: book.title, // On ajoute le titre du livre
                studentName: loan.studentName,
                loanDate: loan.loanDate,
                // actualReturnDate est mis par défaut
            });
        }
        
        res.json({ success: true, message: "Livre retourné avec succès." });

    } catch (error) {
        console.error("Erreur lors du retour du livre:", error);
        res.status(500).json({ message: "Une erreur s'est produite lors du retour du livre.", error });
    }
});

// Les autres routes (DELETE book, PUT book, etc.) restent inchangées
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

// --- DÉMARRAGE DU SERVEUR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Le serveur écoute sur le port ${PORT}`);
});
