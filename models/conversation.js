const mongoose = require("mongoose")

const conversationSchema = new mongoose.Schema({
  key: String,
  messages: [],
  image: String,
  permanent: Boolean,
  public: Boolean,
})

conversationSchema.statics.format = (conversation) => {
  return {
    key: conversation.key,
    messages: conversation.messages,
  }
}

const Conversation = mongoose.model("Conversation", conversationSchema)

module.exports = Conversation