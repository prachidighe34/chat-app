const { Worker } = require('bullmq');
const nodemailer = require('nodemailer');

const connection = process.env.REDIS_URL
    ? { url: process.env.REDIS_URL }
    : { host: 'localhost', port: 6379 };

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const worker = new Worker(
    'email-notifications',
    async (job) => {
        const { to, senderName, message, type } = job.data;

        const subject = type === 'dm'
            ? `💬 New message from ${senderName}`
            : `👥 New group message from ${senderName}`;

        await transporter.sendMail({
            from: `"ChatApp" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                    <h2 style="color: #4A90E2;">${subject}</h2>
                    <p style="color: #666;">You have a new message while you were offline:</p>
                    <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                        <p style="margin: 0; font-size: 16px;">${message}</p>
                    </div>
                    <p style="color: #999; font-size: 12px;">
                        Open the app to reply.
                    </p>
                </div>
            `,
        });

        console.log(`Email sent to ${to} for ${type} notification`);
    },
    { 
        connection,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
    }
);

worker.on('completed', (job) => {
    console.log(`Email job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    console.log(`Email job ${job.id} failed:`, err.message);
});

module.exports = worker;