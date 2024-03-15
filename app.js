// initial stuff

const express = require("express");
const fs = require("fs");
const config = require("./config");

const app = express();
app.use(express.json());
app.use(express.static("uploads"));
express.response.send2 = express.response.status(200).send;

let pages = {};
for (const file of fs.readdirSync("./static/").filter(file => file.endsWith(".html"))) {
    pages[file.split(".")[0]] = fs.readFileSync(`./static/${file}`).toString();
}

// auth stuff

app.get("/", (_, res) => {
    res.send2(pages.auth);
});

app.post("/", (req, res) => {
    if(req.body.password != config.password) {
        res.sendStatus(401);
    } else {
        res.send2(pages.uploader.replace(/config.password/g, config.password));
    }
});

// actual uploading stuff

app.get(`/${config.password}`, (req, res) => {
    res.send2(loadImages());
});

app.post(`/${config.password}`, express.text({ limit: "1gb" }), (req, res) => {
    let id;
    let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    do {
        id = "";
        for (let i = 0; i < 5; i++) {
            id += characters.charAt(Math.floor(Math.random() * characters.length));
        }
    } while (existsFile(`./uploads/${id}`));

    fs.appendFileSync(`./uploads/${id}.png`, Buffer.from(req.body, "base64"));
    res.status(201).send(loadImages());
});

app.delete(`/${config.password}`, (req, res) => {
    if (!existsFile(`./uploads/${req.get("image")}`)) {
        res.sendStatus(404);
    } else {
        fs.unlinkSync(`./uploads/${req.get("image")}`);
        res.send2(loadImages());
    }
});

// other stuff

app.use("/", (_, res) => res.status(404).send(pages["404"]));

app.use("/", (err, req, res, next) => {
    console.log(err);
    res.status(500).send(pages["500"]);
});

app.listen(parseInt(config.port), () => {
    console.log("image uploader is ready");
    if (!existsDir("./uploads")) fs.mkdirSync("./uploads");
});

function loadImages() {
    let array = [];
    for (const image of fs.readdirSync("./uploads")) {
        array.push({ file: image, date: fs.statSync(`./uploads/${image}`).birthtimeMs });
    }
    array.sort((a, b) => b.date - a.date);
    return array;
}

function existsFile(file) {
    try {
        fs.readFileSync(file);
    } catch (err) {
        return false
    }
    return true
}

function existsDir(dir) {
    try {
        fs.readdirSync(dir);
    } catch (err) {
        return false
    }
    return true
}