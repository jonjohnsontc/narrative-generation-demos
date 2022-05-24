const http = require("http");
const fs = require("fs");
const path = require("path");

const host = "localhost";
const port = "8084";

const handler = (req, res) => {
  console.log(req.url);

  const root = "./plan-viewer/public";
  let filePath = root + req.url;
  if (filePath == "./plan-viewer/public/") {
    filePath = "./plan-viewer/public/index.html";
  }
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    ".html": "text/html",
    ".json": "text/json",
    ".css": "text/css",
  };

  const contentType = mimeTypes[extname];
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code == "ENOENT") {
        fs.readFile("./404.html", (error, content) => {
          res.writeHead(404, { "Content-Type": "text/html" });
          res.end(content, "utf-8");
        });
      } else {
        res.writeHead(500);
        res.end("Sorry, something is fugged on the server :0(");
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
};

const server = http.createServer(handler);
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});

// for --isolatedModules=true tsconfig
export {};
