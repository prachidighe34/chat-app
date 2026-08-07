const { Queue } = require('bullmq');

const connection = process.env.REDIS_URL 
    ? { url: process.env.REDIS_URL }
    : { host: 'localhost', port: 6379 };

const emailQueue = new Queue('email-notifications', { connection });

console.log('Email queue initialized');

module.exports = emailQueue;