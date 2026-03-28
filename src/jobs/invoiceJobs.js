// src/jobs/invoiceJobs.js
const cron = require('node-cron');
const invoiceService = require('../services/invoiceService');

// Run on the 1st of every month at 12:00 AM
cron.schedule('0 0 1 * *', async () => {
    console.log('Running monthly invoice generation job...');
    try {
        const invoices = await invoiceService.generateMonthlyInvoices();
        console.log(`Generated ${invoices.length} invoices for the month`);
    } catch (error) {
        console.error('Error in invoice generation job:', error);
    }
});

// Run daily at 1:00 AM to apply penalties
cron.schedule('0 1 * * *', async () => {
    console.log('Running daily penalty application job...');
    try {
        const updatedInvoices = await invoiceService.applyPenalties();
        console.log(`Applied penalties to ${updatedInvoices.length} invoices`);
    } catch (error) {
        console.error('Error in penalty application job:', error);
    }
});

console.log('Invoice cron jobs scheduled');