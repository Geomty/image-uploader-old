const express = require("express");
const fs = require("fs");
const config = require("./config");

const app = express();
app.use(express.json());
app.use(express.static("uploads"));
express.response.send2 = express.response.status(200).send;
let files = {};
for (const file of fs.readdirSync("./static/").filter(file => file.endsWith(".html"))) {
    files[file.split(".")[0]] = fs.readFileSync(`./static/${file}`).toString();
}

app.get("/", (_, res) => {
    res.send2(files.auth);
});
app.post("/", (req, res) => {
    if(req.body.password != config.password) return res.sendStatus(401);
    res.send2(files.uploader.replace(/config.password/g, config.password));
});

app.get(`/${config.password}`, (req, res) => {
    res.send2(loadImages(req));
});
app.post(`/${config.password}`, express.text(), (req, res) => {
    let id;
    let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    do {
        id = "";
        for (let i = 0; i < 5; i++) {
            id += characters.charAt(Math.floor(Math.random() * characters.length));
        }
    } while (fs.existsSync(`./uploads/${id}`));

    fs.appendFileSync(`./uploads/${id}.png`, Buffer.from(req.body, "base64"));
    res.status(201).send(loadImages(req));
});
app.delete(`/${config.password}`, (req, res) => {
    if (!fs.existsSync(`./uploads/${req.get("image")}`)) return res.status(400).send("image not found");
    fs.unlinkSync(`./uploads/${req.get("image")}`);
    res.send2(loadImages(req));
});

app.use("*", (_, res) => res.sendStatus(404));

app.listen(parseInt(config.port), () => {
    console.log("image uploader is ready");
});

function loadImages(req) {
    let array = [];
    for (const image of fs.readdirSync("./uploads")) {
        let date = new Date(fs.statSync(`./uploads/${image}`).birthtime).getTime();
        array.push({ url: `https://${req.get("host")}/${image}`, date: date });
    }
    array.sort((a, b) => b.date - a.date);
    for (const object of array) {
        object.date = new Date(object.date).toString();
    }
    return array;
}