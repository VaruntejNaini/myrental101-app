import { Agenda } from 'agenda';

let agenda;

export const initNotificationQueue = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing');
  }

  agenda = new Agenda({
    db: {
      address: process.env.MONGO_URI,
      collection: 'notificationQueue'
    }
  });

  agenda.define('send-notification', async (job) => {
    const { userId, type, message, metadata } = job.attrs.data;

    console.log(
      `[NotificationQueue] Sending ${type} to User ${userId}: ${message}`
    );
  });

  await agenda.start();

  console.log('Notification Queue Started');
};

export const queueNotification = async (
  userId,
  type,
  message,
  metadata = {}
) => {
  if (agenda) {
    await agenda.now('send-notification', {
      userId,
      type,
      message,
      metadata
    });
  }
};