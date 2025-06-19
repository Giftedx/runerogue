import express from "express";

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).send("API Gateway is healthy");
});

app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`);
});

console.log("API Gateway starting...");
