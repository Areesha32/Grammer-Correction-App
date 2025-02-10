const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const sqlite3 = require("sqlite3").verbose();
const Anthropic = require("@anthropic-ai/sdk");
const path = require("path");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "../frontend")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "index.html"));
});

// Database setup
const db = new sqlite3.Database("./users.db");
db.run(
  "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)"
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Login route
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign({ username }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  });
});

// Registration route
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (user) {
      return res.status(400).json({ error: "Username already taken" });
    }

    db.run(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, password],
      function (err) {
        if (err) {
          return res.status(500).json({ error: "Registration failed" });
        }
        res.json({ message: "User registered successfully" });
      }
    );
  });
});

// Grammar check route using Anthropic API
app.post("/check-grammar", async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Text cannot be empty" });
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1024,
      system:
        "You are a grammar correction assistant. Highlight only incorrect or misspelled words in red, show the correct word in brackets next to it, and provide a fully corrected version of the text.",
      messages: [
        {
          role: "user",
          content: `Correct this text and return JSON format:\n\n"${text}"\n\nFormat: {"highlighted": "original text with incorrect words wrapped in <span style='color: red;'>word</span> [correct]", "corrected": "fully corrected sentence"}`,
        },
      ],
    });

    const result = JSON.parse(response.content[0].text);

    res.json({
      highlighted: result.highlighted,
      corrected: result.corrected,
    });
  } catch (error) {
    console.error("Anthropic API Error:", error);
    res.status(500).json({ error: "Error checking grammar" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));