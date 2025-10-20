import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export class User {
  static async getCollection() {
    const client = await clientPromise;
    const db = client.db('buildai');
    return db.collection('users');
  }

  static async create({ email, password, name }) {
    const collection = await this.getCollection();

    // Check if user already exists
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      email,
      password: hashedPassword,
      name,
      createdAt: new Date(),
      lastLogin: null,
    };

    const result = await collection.insertOne(user);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, _id: result.insertedId };
  }

  static async findByEmail(email) {
    const collection = await this.getCollection();
    return await collection.findOne({ email });
  }

  static async findById(id) {
    const collection = await this.getCollection();
    const { ObjectId } = require('mongodb');
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateLastLogin(userId) {
    const collection = await this.getCollection();
    const { ObjectId } = require('mongodb');
    await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { lastLogin: new Date() } }
    );
  }

  static async createIndex() {
    const collection = await this.getCollection();
    // Create unique index on email
    await collection.createIndex({ email: 1 }, { unique: true });
  }
}
