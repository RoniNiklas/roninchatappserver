const express = require("express")
const http = require("http")
const bodyParser = require("body-parser")
const cors = require("cors")
const mongoose = require("mongoose")
const Conversation = require("./models/conversation")
const keskusteluURI = require("./src/data/keskusteluURI")

require('dotenv').config();
const mongoUrl = process.env.MONGOURL;

mongoose
  .connect(mongoUrl)
  .then(() => {
    console.log("connected to database", mongoUrl)
  })
  .catch((err) => {
    console.log(err)
  })


const app = express()

app.use(cors())
app.use(bodyParser.json())

const server = http.createServer(app)
const io = require("socket.io")(server, { origins: "*:*" })

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log("Server running on port" + PORT)
})

const temporaryConversation = {
  key: "temporary",
  messages: [
    {
      author: "Note",
      text: "Server reached. Please wait while the server initializes your data.",
      id: 0
    }
  ]
}



io.on("connection", (socket) => {
  console.log("connected")
  socket.on("JOIN_ROOM", async (key) => {
    socket.join("room" + key, () => {
      console.log("joined room " +key)
    })
    await socket.local.emit("INIT_DATA", temporaryConversation)
    try {
      const conversation = await Conversation.findOne({ key:key})
      if (conversation === null) {
        const conversationDummy = new Conversation({
          key: key,
          publicity: true,
          permanent: true,
          image: keskusteluURI,
          messages: [
            {
              author: "Note",
              text: "Your conversation will be saved on the server"
            }
          ]
        })
        await conversationDummy.save()
        return socket.local.emit("INIT_DATA", conversationDummy)
      } else {
        return socket.local.emit("INIT_DATA", conversation)
      }
    }
    catch (error) {
      console.log("error: ", error)
    }
  })
  socket.on("LEAVE_ROOM", (key) => {
    socket.leave("room" + key, () => {
      console.log("left room " +key)
    })
  })
  socket.on("NEW_COMMENT", async (key, comment) => {
    try {
      console.log(comment)
      console.log("room" +key)
      socket.to("room" +key).broadcast.emit("UPDATE_CONVERSATION", comment)
      const conversation = await Conversation.findOneAndUpdate({ key:key}, { $push: { messages: comment } })
    } catch (error) {
      console.log(error)
    }
  })
  socket.on("INIT_LIST_REQUEST", async () => {
    try {
      const list = await Conversation.find({})
      if (list === null) {
        const conversationDummy = new Conversation({
          key: "EMPTY_LIST",
          messages: [
            {
              author: "Note",
              text: "Your conversation will be saved on the server"
            }
          ]
        })
        socket.local.emit("INIT_LIST_ACCEPTED", [conversationDummy])
      } else {
        socket.local.emit("INIT_LIST_ACCEPTED", list)
      }
    } catch (error) {
      console.log(error)
    }
  })
  socket.on("NEW_CONVERSATION", async (key, publicity, permanent, image) => {
    const conversationDummy = new Conversation({
      key: key,
      publicity: publicity,
      permanent: permanent,
      image: image || keskusteluURI,
      messages: [
        {
          author: "Note",
          text: "Your conversation will be saved on the server"
        }
      ]
    })
    const conversation = await conversationDummy.save()
  })
})


module.exports = {
  app, server,
}
