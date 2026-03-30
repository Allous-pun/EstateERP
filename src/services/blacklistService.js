const { Blacklist, Visitor } = require('../models');
const db = require('../config/db');

class BlacklistService {
    // Add visitor to blacklist
    static async addToBlacklist(data) {
        // Check if already blacklisted
        const existing = await Blacklist.isBlacklisted(data.phone, data.id_number);
        if (existing) {
            throw new Error('Visitor already blacklisted');
        }

        const id = await Blacklist.add(data);
        
        // If visitor exists, mark them as blacklisted
        if (data.visitor_id) {
            await db.execute(
                `UPDATE visitors SET is_blacklisted = TRUE WHERE id = ?`,
                [data.visitor_id]
            );
        }

        return { id, message: 'Visitor added to blacklist successfully' };
    }

    // Check visitor before entry
    static async checkVisitor(phone, idNumber) {
        const blacklisted = await Blacklist.isBlacklisted(phone, idNumber);
        
        if (blacklisted) {
            return {
                allowed: false,
                reason: blacklisted.reason,
                expires_at: blacklisted.expires_at
            };
        }
        
        return { allowed: true };
    }

    // Get all blacklisted visitors
    static async getBlacklist(page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const blacklist = await Blacklist.getAll(limit, offset);
        const stats = await Blacklist.getStats();
        
        return {
            data: blacklist,
            pagination: {
                page,
                limit,
                total: blacklist.length
            },
            stats
        };
    }

    // Remove from blacklist
    static async removeFromBlacklist(id) {
        const removed = await Blacklist.remove(id);
        if (!removed) {
            throw new Error('Blacklist entry not found');
        }
        return { message: 'Visitor removed from blacklist' };
    }

    // Update blacklist entry
    static async updateBlacklist(id, data) {
        const updated = await Blacklist.update(id, data);
        if (!updated) {
            throw new Error('Blacklist entry not found');
        }
        return { message: 'Blacklist entry updated successfully' };
    }
}

module.exports = BlacklistService;