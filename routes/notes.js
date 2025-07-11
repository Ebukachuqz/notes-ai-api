const express = require("express");
const router = express.Router();
const { Databases, ID, Query } = require("node-appwrite");
const appwrite = require("../config/appwrite");

const databases = new Databases(appwrite);

const databaseId = process.env.APPWRITE_DATABASE_ID;
const collectionId = process.env.APPWRITE_NOTES_COLLECTION_ID;

/**
 * @route   POST /api/notes
 * @desc    Create a new note
 * @access  Private (Authenticated)
 */
router.post("/", async (req, res) => {
  try {
    const { userId } = req.auth(); // Get userId from the authenticated session
    const { title, content, description } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Title and description are required." });
    }

    const now = new Date().toISOString();

    const newNote = await databases.createDocument(
      databaseId,
      collectionId,
      ID.unique(),
      {
        title,
        content,
        description: description || "",
        userId,
        createdAt: now,
        updatedAt: now,
      }
    );

    res.status(201).json(newNote);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ error: "Failed to create note." });
  }
});

/**
 * @route   GET /api/notes
 * @desc    Get all notes for the authenticated user
 * @access  Private (Authenticated)
 */
router.get("/", async (req, res) => {
  try {
    const { userId } = req.auth();

    const response = await databases.listDocuments(databaseId, collectionId, [
      Query.equal("userId", userId),
    ]);

    return res.status(200).json(response.documents);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return res.status(400).json({ error: "Failed to fetch notes." });
  }
});

/**
 * @route   PUT /api/notes/:id
 * @desc    Update a note
 * @access  Private (Authenticated)
 */
router.put("/:id", async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id: noteId } = req.params;
    const { title, content, description } = req.body;

    const note = await databases.getDocument(databaseId, collectionId, noteId);

    if (note.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Forbidden: You do not own this note." });
    }

    const updateData = {
      title,
      content,
      description,
      updatedAt: new Date().toISOString(),
    };

    const updatedNote = await databases.updateDocument(
      databaseId,
      collectionId,
      noteId,
      updateData
    );

    res.status(200).json(updatedNote);
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ error: "Failed to update note." });
  }
});

/**
 * @route   DELETE /api/notes/:id
 * @desc    Delete a note
 * @access  Private (Authenticated)
 */
router.delete("/:id", async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id: noteId } = req.params;

    const note = await databases.getDocument(databaseId, collectionId, noteId);

    if (note.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Forbidden: You do not own this note." });
    }

    await databases.deleteDocument(databaseId, collectionId, noteId);

    res.status(200).json({ message: "Note deleted successfully." });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Failed to delete note." });
  }
});

module.exports = router;
