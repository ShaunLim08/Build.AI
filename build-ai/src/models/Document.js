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

export class Document {
  static async create(documentData) {
    const database = await connectToDatabase();
    const documents = database.collection('documents');

    const document = {
      ...documentData,
      status: 'processing',
      uploadedAt: new Date(),
    };

    const result = await documents.insertOne(document);
    return { _id: result.insertedId, ...document };
  }

  static async findById(documentId) {
    const database = await connectToDatabase();
    const documents = database.collection('documents');

    return await documents.findOne({ _id: new ObjectId(documentId) });
  }

  static async findByChatbotId(chatbotId) {
    const database = await connectToDatabase();
    const documents = database.collection('documents');

    return await documents.find({ chatbotId: new ObjectId(chatbotId) }).toArray();
  }

  static async updateStatus(documentId, status, additionalData = {}) {
    const database = await connectToDatabase();
    const documents = database.collection('documents');

    const updateData = {
      status,
      ...additionalData,
    };

    if (status === 'processed') {
      updateData.processedAt = new Date();
    }

    const result = await documents.updateOne(
      { _id: new ObjectId(documentId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return null;
    }

    return await this.findById(documentId);
  }

  static async delete(documentId) {
    const database = await connectToDatabase();
    const documents = database.collection('documents');

    const result = await documents.deleteOne({ _id: new ObjectId(documentId) });
    return result.deletedCount > 0;
  }

  static async deleteByChatbotId(chatbotId) {
    const database = await connectToDatabase();
    const documents = database.collection('documents');

    const result = await documents.deleteMany({ chatbotId: new ObjectId(chatbotId) });
    return result.deletedCount;
  }
}
