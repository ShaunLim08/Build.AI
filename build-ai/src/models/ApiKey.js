import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

/**
 * API Key Model
 * Manages API keys for chatbot widget access
 */

async function getCollection() {
  const client = await clientPromise;
  const db = client.db('buildai');
  return db.collection('apiKeys');
}

export class ApiKey {
  /**
   * Generate a new API key
   */
  static generateKey() {
    // Generate a secure random key: buildai_live_<32 random chars>
    const randomBytes = crypto.randomBytes(24);
    const key = `buildai_live_${randomBytes.toString('base64url')}`;
    return key;
  }

  /**
   * Create a new API key for a chatbot
   */
  static async create(chatbotId, userId, options = {}) {
    const apiKeys = await getCollection();

    const apiKey = ApiKey.generateKey();

    const keyData = {
      key: apiKey,
      chatbotId: new ObjectId(chatbotId),
      userId: new ObjectId(userId),
      name: options.name || 'Default Key',
      environment: options.environment || 'production', // 'production' or 'development'
      permissions: options.permissions || ['chat'], // ['chat', 'analytics', 'admin']

      // Rate limiting
      rateLimit: options.rateLimit || {
        requestsPerMinute: 60,
        requestsPerDay: 10000,
      },

      // Usage tracking
      usage: {
        totalRequests: 0,
        lastUsed: null,
      },

      // Metadata
      isActive: true,
      createdAt: new Date(),
      lastUsedAt: null,
      expiresAt: options.expiresAt || null, // Optional expiration

      // Security
      allowedOrigins: options.allowedOrigins || ['*'], // CORS origins
      allowedIPs: options.allowedIPs || [], // IP whitelist (empty = all allowed)
    };

    const result = await apiKeys.insertOne(keyData);

    return {
      _id: result.insertedId,
      ...keyData,
    };
  }

  /**
   * Find API key by key string
   */
  static async findByKey(apiKey) {
    const apiKeys = await getCollection();
    return await apiKeys.findOne({ key: apiKey });
  }

  /**
   * Find all API keys for a chatbot
   */
  static async findByChatbotId(chatbotId) {
    const apiKeys = await getCollection();
    return await apiKeys
      .find({ chatbotId: new ObjectId(chatbotId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Verify API key is valid and active
   */
  static async verify(apiKey, chatbotId = null) {
    const keyData = await ApiKey.findByKey(apiKey);

    if (!keyData) {
      return { valid: false, error: 'Invalid API key' };
    }

    // Check if active
    if (!keyData.isActive) {
      return { valid: false, error: 'API key is inactive' };
    }

    // Check expiration
    if (keyData.expiresAt && new Date() > new Date(keyData.expiresAt)) {
      return { valid: false, error: 'API key has expired' };
    }

    // Check chatbot match if provided
    if (chatbotId && keyData.chatbotId.toString() !== chatbotId) {
      return { valid: false, error: 'API key does not match chatbot' };
    }

    return {
      valid: true,
      keyData,
    };
  }

  /**
   * Increment usage counter
   */
  static async incrementUsage(apiKey) {
    const apiKeys = await getCollection();

    await apiKeys.updateOne(
      { key: apiKey },
      {
        $inc: { 'usage.totalRequests': 1 },
        $set: { lastUsedAt: new Date() },
      }
    );
  }

  /**
   * Update API key
   */
  static async update(keyId, updates) {
    const apiKeys = await getCollection();

    const allowedUpdates = {
      name: updates.name,
      isActive: updates.isActive,
      permissions: updates.permissions,
      rateLimit: updates.rateLimit,
      allowedOrigins: updates.allowedOrigins,
      allowedIPs: updates.allowedIPs,
    };

    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(
      key => allowedUpdates[key] === undefined && delete allowedUpdates[key]
    );

    const result = await apiKeys.updateOne(
      { _id: new ObjectId(keyId) },
      { $set: { ...allowedUpdates, updatedAt: new Date() } }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Revoke (delete) API key
   */
  static async revoke(keyId) {
    const apiKeys = await getCollection();
    const result = await apiKeys.deleteOne({ _id: new ObjectId(keyId) });
    return result.deletedCount > 0;
  }

  /**
   * Deactivate API key (soft delete)
   */
  static async deactivate(keyId) {
    const apiKeys = await getCollection();
    const result = await apiKeys.updateOne(
      { _id: new ObjectId(keyId) },
      { $set: { isActive: false, deactivatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Get usage statistics for a chatbot
   */
  static async getUsageStats(chatbotId) {
    const apiKeys = await getCollection();

    const stats = await apiKeys.aggregate([
      { $match: { chatbotId: new ObjectId(chatbotId) } },
      {
        $group: {
          _id: null,
          totalKeys: { $sum: 1 },
          activeKeys: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          totalRequests: { $sum: '$usage.totalRequests' },
        }
      }
    ]).toArray();

    return stats[0] || {
      totalKeys: 0,
      activeKeys: 0,
      totalRequests: 0,
    };
  }

  /**
   * Clean up expired keys
   */
  static async cleanupExpired() {
    const apiKeys = await getCollection();
    const now = new Date();

    const result = await apiKeys.updateMany(
      {
        expiresAt: { $lte: now },
        isActive: true,
      },
      {
        $set: { isActive: false, deactivatedAt: now }
      }
    );

    return result.modifiedCount;
  }
}
