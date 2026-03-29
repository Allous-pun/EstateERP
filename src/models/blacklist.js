const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

const Blacklist = sequelize.define('Blacklist', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    visitor_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    id_number: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    added_by: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    is_permanent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    removed_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'blacklist',
    timestamps: true,
    underscored: true
});

// Static method to check if visitor is blacklisted
Blacklist.isBlacklisted = async function(phone = null, idNumber = null) {
    if (!phone && !idNumber) return null;
    
    const where = {
        is_active: true,
        [Op.or]: [
            { is_permanent: true },
            { expires_at: { [Op.gt]: new Date() } }
        ]
    };
    
    if (phone && idNumber) {
        where[Op.or] = [
            { phone: phone },
            { id_number: idNumber }
        ];
    } else if (phone) {
        where.phone = phone;
    } else if (idNumber) {
        where.id_number = idNumber;
    }
    
    const blacklistEntry = await Blacklist.findOne({ where });
    return blacklistEntry;
};

// Static method to add to blacklist
Blacklist.add = async function(data) {
    const entry = await Blacklist.create({
        visitor_id: data.visitor_id || null,
        phone: data.phone || null,
        id_number: data.id_number || null,
        reason: data.reason,
        added_by: data.added_by,
        expires_at: data.expires_at || null
    });
    return entry.id;
};

// Static method to get all blacklisted entries
Blacklist.getAll = async function(limit = 100, offset = 0) {
    const entries = await Blacklist.findAll({
        where: { is_active: true },
        include: [
            { association: 'addedBy', attributes: ['first_name', 'last_name'] },
            { association: 'visitor', attributes: ['full_name'] }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
    });
    return entries;
};

// Static method to remove from blacklist
Blacklist.remove = async function(id) {
    const result = await Blacklist.update(
        { is_active: false, removed_at: new Date() },
        { where: { id } }
    );
    return result[0] > 0;
};

// Static method to update blacklist entry
Blacklist.update = async function(id, data) {
    const result = await Blacklist.update(
        {
            reason: data.reason,
            expires_at: data.expires_at
        },
        { where: { id } }
    );
    return result[0] > 0;
};

// Static method to get blacklist stats
Blacklist.getStats = async function() {
    const activeCount = await Blacklist.count({
        where: {
            is_active: true,
            [Op.or]: [
                { is_permanent: true },
                { expires_at: { [Op.gt]: new Date() } }
            ]
        }
    });
    
    const expiringSoon = await Blacklist.count({
        where: {
            expires_at: {
                [Op.between]: [new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
            },
            is_active: true
        }
    });
    
    return { active_count: activeCount, expiring_soon: expiringSoon };
};

module.exports = Blacklist;