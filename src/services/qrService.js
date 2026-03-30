const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { Visitor, VisitorLog } = require('../models');
const { sequelize } = require('../config/database');

class QRService {
    // Generate unique QR token
    static generateToken() {
        return uuidv4();
    }

    // Generate QR code as data URL
    static async generateQRCode(data) {
        try {
            const qrCode = await QRCode.toDataURL(JSON.stringify(data));
            return qrCode;
        } catch (error) {
            throw new Error('QR generation failed: ' + error.message);
        }
    }

    // Create visitor with QR code
    static async createVisitor(visitorData) {
        const transaction = await sequelize.transaction();
        try {
            const token = this.generateToken();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

            // Insert visitor using Sequelize
            const visitor = await Visitor.create({
                full_name: visitorData.full_name,
                phone: visitorData.phone,
                id_number: visitorData.id_number,
                purpose: visitorData.purpose,
                property_id: visitorData.property_id || null,
                unit_id: visitorData.unit_id || null,
                qr_token: token,
                qr_expires_at: expiresAt,
                created_by: visitorData.created_by
            }, { transaction });

            // Generate QR code with visitor data
            const qrData = {
                visitor_id: visitor.id,
                token: token,
                full_name: visitorData.full_name,
                property_id: visitorData.property_id,
                unit_id: visitorData.unit_id,
                expires_at: expiresAt
            };

            const qrCode = await this.generateQRCode(qrData);

            await transaction.commit();

            return {
                visitor_id: visitor.id,
                qr_token: token,
                qr_code: qrCode,
                expires_at: expiresAt
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // Validate QR token
    static async validateQRToken(token) {
        const visitor = await Visitor.findOne({
            where: {
                qr_token: token,
                qr_expires_at: { [Op.gt]: new Date() },
                is_used: false
            }
        });

        if (!visitor) {
            throw new Error('Invalid or expired QR code');
        }

        return visitor;
    }

    // Mark QR as used (check-in)
    static async useQRToken(token, checkInTime = null) {
        const transaction = await sequelize.transaction();
        try {
            const [updated] = await Visitor.update(
                { 
                    is_used: true, 
                    check_in_time: checkInTime || new Date()
                },
                { 
                    where: { 
                        qr_token: token, 
                        is_used: false 
                    },
                    transaction 
                }
            );

            if (updated === 0) {
                throw new Error('QR code already used or invalid');
            }

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // Regenerate QR code
    static async regenerateQR(visitorId) {
        const transaction = await sequelize.transaction();
        try {
            const newToken = this.generateToken();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            const [updated] = await Visitor.update(
                { 
                    qr_token: newToken, 
                    qr_expires_at: expiresAt, 
                    is_used: false,
                    check_in_time: null,
                    check_out_time: null
                },
                { 
                    where: { id: visitorId },
                    transaction 
                }
            );

            if (updated === 0) {
                throw new Error('Visitor not found');
            }

            // Get updated visitor data
            const visitor = await Visitor.findByPk(visitorId, { transaction });

            const qrData = {
                visitor_id: visitor.id,
                token: newToken,
                full_name: visitor.full_name,
                property_id: visitor.property_id,
                unit_id: visitor.unit_id,
                expires_at: expiresAt
            };

            const qrCode = await this.generateQRCode(qrData);

            await transaction.commit();

            return {
                qr_token: newToken,
                qr_code: qrCode,
                expires_at: expiresAt
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

// Add Op for Sequelize operators
const { Op } = require('sequelize');

module.exports = QRService;
