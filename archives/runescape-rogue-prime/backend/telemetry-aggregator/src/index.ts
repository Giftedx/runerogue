import express from "express";

const app = express();
const port = process.env.PORT || 3003;

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).send("Telemetry Aggregator is healthy");
});

app.post("/log", (req, res) => {
  console.log("Received log:", req.body);
  // In a real scenario, this would persist logs to PostgreSQL or a dedicated logging service
  res.status(200).send("Log received");
});

app.listen(port, () => {
  console.log(`Telemetry Aggregator listening on port ${port}`);
});

console.log("Telemetry Aggregator starting...");
