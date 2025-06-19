import express from "express";
import { authService } from "./auth/auth";

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json()); // Enable JSON body parsing

app.get("/health", (req, res) => {
  res.status(200).send("Auth Service is healthy");
});

// Register a new user
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ message: "Username, email, and password are required." });
  }

  try {
    const user = await authService.register(username, email, password);
    if (user) {
      res
        .status(201)
        .json({ message: "User registered successfully.", userId: user.id });
    } else {
      res.status(409).json({ message: "Username or email already exists." });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during registration." });
  }
});

// User login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  try {
    const user = await authService.login(username, password);
    if (user) {
      const token = authService.generateToken(user);
      res
        .status(200)
        .json({ message: "Login successful.", token, userId: user.id });
    } else {
      res.status(401).json({ message: "Invalid username or password." });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error during login." });
  }
});

app.listen(port, () => {
  console.log(`Auth Service listening on port ${port}`);
});

console.log("Auth Service starting...");
