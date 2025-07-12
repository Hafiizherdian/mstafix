import * as amqp from 'amqplib';

export interface NotificationService {
  sendNotification(queue: string, message: any): Promise<void>;
}

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE_OPTIONS: amqp.Options.AssertQueue = { 
  durable: true,
  arguments: { 'x-message-ttl': 86400000 }
};

/**
 * Simple RabbitMQ-based implementation of NotificationService.
 * Maintains a single connection & channel for the service lifetime.
 */
export class RabbitNotificationService implements NotificationService {
  private connection: any = null;
  private channel: amqp.Channel | null = null;

  async init() {
    if (this.connection && this.channel) return;
    this.connection = await amqp.connect(RABBITMQ_URL);   // sudah bertipe Connection
    this.channel    = await this.connection.createChannel();
  }

  async sendNotification(queue: string, message: any): Promise<void> {
    if (!this.channel) {
      await this.init();
    }
    if (!this.channel) throw new Error('Channel not initialized');
    await this.channel.assertQueue(queue, QUEUE_OPTIONS);
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
  }

  async close(): Promise<void> {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await (this.connection as any).close();
    } catch (err) {
      console.error('Error closing RabbitNotificationService:', err);
    }
  }
}
