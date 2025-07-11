const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { clerkMiddleware, requireAuth, getAuth } = require("@clerk/express");
const noteRoutes = require("./routes/notes");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(clerkMiddleware());

const withAuth = (req, res, next) => {
  const auth = getAuth(req);

  return next();
};

app.get("/", (req, res) => {
  res.send("Hello from the Notes App Backend!");
});

app.use("/api/notes", requireAuth(), withAuth, noteRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
