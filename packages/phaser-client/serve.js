const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8080;

const server = http.createServer((req, res) => {
  let filePath = path.join(
    __dirname,
    req.url === "/" ? "enhanced-client.html" : req.url
  );
  // Serve the enhanced client by default
  if (req.url === "/") {
    filePath = path.join(__dirname, "enhanced-client.html");
  } else if (req.url.startsWith("/assets/")) {
    filePath = path.join(__dirname, req.url);
  } else if (req.url === "/enhanced-phaser-client.js") {
    filePath = path.join(__dirname, "enhanced-phaser-client.js");
  } else if (req.url === "/working-phaser-client.css") {
    filePath = path.join(__dirname, "working-phaser-client.css");
  }

  const extname = path.extname(filePath);
  let contentType = "text/html";

  switch (extname) {
    case ".js":
      contentType = "text/javascript";
      break;
    case ".css":
      contentType = "text/css";
      break;
    case ".json":
      contentType = "application/json";
      break;
    case ".png":
      contentType = "image/png";
      break;
    case ".jpg":
      contentType = "image/jpg";
      break;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        res.writeHead(404);
        res.end("File not found");
      } else {
        res.writeHead(500);
        res.end("Server error");
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

server.listen(PORT, () => {
  console.log(`🌐 RuneRogue Client Server running at http://localhost:${PORT}`);
  console.log(`🎮 Open http://localhost:${PORT} to play RuneRogue!`);
});
