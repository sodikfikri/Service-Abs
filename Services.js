const path = require("path")
require("dotenv").config({ path: path.join(__dirname, ".env") })
const express = require("express")
const bodyParser = require("body-parser")
const app = express()
const fs = require("fs")
// const cors = require('cors')

const routes = require("./routes")

// console.log('SOCKET PORT: ', process.env.SOCKET_PORT);
const socket = require('socket.io')(process.env.SOCKET_PORT, {
  cors: {
    origin: "*",
    methods: ["PUT", "GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["authorization", "origin", "user-token", "x-requested-with", "content-type"],
  }
})
app.use(function (req, res, next) {
  req.io = socket
  next()
})

app.use(
    bodyParser.urlencoded({
      extended: true,
      limit: "50mb",
    })
)
  
app.use(
    bodyParser.json({
        inflate: true,
        limit: "50mb",
        type: () => true,
    })
)
// app.use(cors)
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Credentials", "true")
    res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE")
    res.header("Access-Control-Expose-Headers", "Content-Length")
    res.header("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-Requested-With, Range, x-api-key, x-forwarded-for")
    if (req.method === "OPTIONS") {
      return res.json(200)
    } else {
      return next()
    }
})

// const credential = {
//   cert: fs.readFileSync("./server.pem"),
//   key: fs.readFileSync("./server.key")
// }

routes.routesConfig(app)

const server = require("http").createServer(app)

server.listen(process.env.PORT, () => {
    const host = server.address().address
    const port = server.address().port
    console.log("Service Absensi on Port ", host, port)
})
// coba lagi