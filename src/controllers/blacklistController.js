const BlacklistService = require('../services/blacklistService');

class BlacklistController {
    // Add to blacklist
    static async addToBlacklist(req, res) {
        try {
            const { visitor_id, phone, id_number, reason, expires_at } = req.body;
            
            if (!reason) {
                return res.status(400).json({ error: 'Reason is required' });
            }
            
            if (!visitor_id && !phone && !id_number) {
                return res.status(400).json({ 
                    error: 'At least one identifier (visitor_id, phone, or id_number) is required' 
                });
            }
            
            const result = await BlacklistService.addToBlacklist({
                visitor_id,
                phone,
                id_number,
                reason,
                expires_at: expires_at || null,
                added_by: req.user.id
            });
            
            res.status(201).json({
                success: true,
                data: result,
                message: 'Visitor added to blacklist'
            });
        } catch (error) {
            console.error('Add to blacklist error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    // Get all blacklisted visitors
    static async getBlacklist(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const result = await BlacklistService.getBlacklist(parseInt(page), parseInt(limit));
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Get blacklist error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    // Remove from blacklist
    static async removeFromBlacklist(req, res) {
        try {
            const { id } = req.params;
            const result = await BlacklistService.removeFromBlacklist(id);
            
            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('Remove from blacklist error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    // Update blacklist entry
    static async updateBlacklist(req, res) {
        try {
            const { id } = req.params;
            const { reason, expires_at } = req.body;
            
            const result = await BlacklistService.updateBlacklist(id, { reason, expires_at });
            
            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('Update blacklist error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    // Check visitor status
    static async checkVisitor(req, res) {
        try {
            const { phone, id_number } = req.query;
            
            if (!phone && !id_number) {
                return res.status(400).json({ 
                    error: 'Phone or ID number is required' 
                });
            }
            
            const result = await BlacklistService.checkVisitor(phone, id_number);
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Check visitor error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    // Get blacklist stats
    static async getStats(req, res) {
        try {
            const Blacklist = require('../models/blacklist');
            const stats = await Blacklist.getStats();
            
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = BlacklistController;