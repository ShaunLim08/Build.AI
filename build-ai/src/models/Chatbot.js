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

export class Chatbot {
  static async create(chatbotData) {
    const database = await connectToDatabase();
    const chatbots = database.collection('chatbots');

    const chatbot = {
      ...chatbotData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await chatbots.insertOne(chatbot);
    return { _id: result.insertedId, ...chatbot };
  }

  static async findById(chatbotId) {
    const database = await connectToDatabase();
    const chatbots = database.collection('chatbots');

    return await chatbots.findOne({ _id: new ObjectId(chatbotId) });
  }

  static async findByUserId(userId) {
    const database = await connectToDatabase();
    const chatbots = database.collection('chatbots');
    const documents = database.collection('documents');
    const chunks = database.collection('chunks');

    // Get all chatbots for the user
    const userChatbots = await chatbots.find({ userId: new ObjectId(userId) }).toArray();

    // Enrich each chatbot with document and chunk counts
    const enrichedChatbots = await Promise.all(
      userChatbots.map(async (chatbot) => {
        const documentCount = await documents.countDocuments({
          chatbotId: chatbot._id,
        });

        const chunkCount = await chunks.countDocuments({
          chatbotId: chatbot._id,
        });

        return {
          ...chatbot,
          documentCount,
          chunkCount,
        };
      })
    );

    return enrichedChatbots;
  }

  static async update(chatbotId, updateData) {
    const database = await connectToDatabase();
    const chatbots = database.collection('chatbots');

    const result = await chatbots.updateOne(
      { _id: new ObjectId(chatbotId) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        }
      }
    );

    if (result.matchedCount === 0) {
      return null;
    }

    return await this.findById(chatbotId);
  }

  static async delete(chatbotId) {
    const database = await connectToDatabase();
    const chatbots = database.collection('chatbots');

    const result = await chatbots.deleteOne({ _id: new ObjectId(chatbotId) });
    return result.deletedCount > 0;
  }
}
