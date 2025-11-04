import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = 'buildai';

let client;
let db;

async function connectToDatabase() {
  if (db) return db;

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  return db;
}

export class Conversation {
  /**
   * Create a new conversation
   */
  static async create(conversationData) {
    const database = await connectToDatabase();
    const conversations = database.collection('conversations');

    const conversation = {
      chatbotId: new ObjectId(conversationData.chatbotId),
      sessionId: conversationData.sessionId,
      messages: conversationData.messages || [],
      startedAt: new Date(),
      lastMessageAt: new Date(),
    };

    const result = await conversations.insertOne(conversation);
    return { _id: result.insertedId, ...conversation };
  }

  /**
   * Find conversation by session ID
   */
  static async findBySessionId(sessionId) {
    const database = await connectToDatabase();
    const conversations = database.collection('conversations');

    return await conversations.findOne({ sessionId });
  }

  /**
   * Find conversation by ID
   */
  static async findById(conversationId) {
    const database = await connectToDatabase();
    const conversations = database.collection('conversations');

    return await conversations.findOne({ _id: new ObjectId(conversationId) });
  }

  /**
   * Find all conversations for a chatbot
   */
  static async findByChatbotId(chatbotId, options = {}) {
    const database = await connectToDatabase();
    const conversations = database.collection('conversations');

    const { limit = 50, skip = 0, sortBy = 'lastMessageAt', order = -1 } = options;

    const query = { chatbotId: new ObjectId(chatbotId) };

    const cursor = conversations
      .find(query)
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit);

    return await cursor.toArray();
  }

  /**
   * Add a message to a conversation
   */
  static async addMessage(sessionId, message) {
    const database = await connectToDatabase();
    const conversations = database.collection('conversations');

    const messageData = {
      role: message.role,
      content: message.content,
      timestamp: new Date(),
      ...(message.sources && { sources: message.sources }),
      ...(message.metadata && { metadata: message.metadata })
    };

    const result = await conversations.updateOne(
      { sessionId },
      {
        $push: { messages: messageData },
        $set: { lastMessageAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return null;
    }

    return await this.findBySessionId(sessionId);
  }

  /**
   * Update conversation metadata
   */
  static async update(sessionId, updateData) {
    const database = await connectToDatabase();
    const conversations = database.collection('conversations');

    const result = await conversations.updateOne(
      { sessionId },
      {
        $set: {
          ...updateData,
          lastMessageAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return null;
    }

    return await this.findBySessionId(sessionId);
  }

  /**
   * Delete a conversation
   */
  static async delete(conversationId) {
    const database = await connectToDatabase();
    const conversations = database.collection('conversations');

    const result = await conversations.deleteOne({ _id: new ObjectId(conversationId) });
    return result.deletedCount > 0;
  }

  /**
   * Delete all conversations for a chatbot
   */
  static async deleteByChatbotId(chatbotId) {
    const database = await connectToDatabase();
    const conversations = database.collection('conversations');

    const result = await conversations.deleteMany({ chatbotId: new ObjectId(chatbotId) });
    return result.deletedCount;
  }

  /**
   * Get conversation statistics for a chatbot
   */
  static async getStats(chatbotId) {
    const database = await connectToDatabase();
    const conversations = database.collection('conversations');

    const stats = await conversations.aggregate([
      { $match: { chatbotId: new ObjectId(chatbotId) } },
      {
        $group: {
          _id: null,
          totalConversations: { $sum: 1 },
          totalMessages: { $sum: { $size: '$messages' } },
          avgMessagesPerConversation: { $avg: { $size: '$messages' } }
        }
      }
    ]).toArray();

    return stats.length > 0 ? stats[0] : {
      totalConversations: 0,
      totalMessages: 0,
      avgMessagesPerConversation: 0
    };
  }

  /**
   * Get recent conversations with message count
   */
  static async getRecentWithCounts(chatbotId, limit = 10) {
    const database = await connectToDatabase();
    const conversations = database.collection('conversations');

    return await conversations.aggregate([
      { $match: { chatbotId: new ObjectId(chatbotId) } },
      {
        $project: {
          sessionId: 1,
          messageCount: { $size: '$messages' },
          firstMessage: { $arrayElemAt: ['$messages', 0] },
          lastMessage: { $arrayElemAt: ['$messages', -1] },
          startedAt: 1,
          lastMessageAt: 1
        }
      },
      { $sort: { lastMessageAt: -1 } },
      { $limit: limit }
    ]).toArray();
  }
}
