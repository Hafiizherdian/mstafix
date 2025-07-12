import * as amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const NOTIFICATION_QUEUE = 'user_registered_queue';

class NotificationService {
  private static instance: NotificationService;
  private connection: any | null = null; // Using any to bypass persistent type issues
  private channel: any | null = null;    // Using any to bypass persistent type issues
  private isConnecting = false;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private handleDisconnect(): void {
    if (this.isConnecting) return;
    this.isConnecting = true;
    console.log('RabbitMQ disconnected. Cleaning up and scheduling reconnect.');
    this.connection = null;
    this.channel = null;
    setTimeout(() => {
      this.isConnecting = false;
      this.connect();
    }, 5000);
  }

  public async connect(): Promise<void> {
    if (this.connection || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      console.log('Connecting to RabbitMQ...');
      const connection = await amqp.connect(RABBITMQ_URL);

      connection.on('error', (err: Error) => {
        console.error('RabbitMQ connection error:', err.message);
      });

      connection.on('close', () => {
        console.log('RabbitMQ connection closed.');
        if (this.connection) this.handleDisconnect();
      });

      const channel = await connection.createChannel();
      await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });

      this.connection = connection;
      this.channel = channel;

      console.log('Successfully connected to RabbitMQ and queue asserted.');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      this.handleDisconnect();
    } finally {
      this.isConnecting = false;
    }
  }

  public send(message: object): void {
    if (!this.channel) {
      console.error('Cannot send notification: RabbitMQ channel is not available.');
      return;
    }
    // Runtime check to ensure method exists before calling
    if (typeof this.channel.sendToQueue === 'function') {
      this.channel.sendToQueue(NOTIFICATION_QUEUE, Buffer.from(JSON.stringify(message)), { persistent: true });
    } else {
      console.error('sendToQueue method does not exist on channel object.');
    }
  }

  public sendUserRegistrationNotification(user: { id: string; name: string; email: string; role: string }): void {
    if (!this.channel) {
      console.error('Cannot send notification: RabbitMQ channel is not available.');
      return;
    }

    const message = {
      type: 'USER_REGISTERED',
      payload: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        timestamp: new Date().toISOString(),
      },
    };

    try {
      // Runtime check to ensure method exists before calling
      if (typeof this.channel.sendToQueue === 'function') {
        this.channel.sendToQueue(NOTIFICATION_QUEUE, Buffer.from(JSON.stringify(message)), { persistent: true });
        console.log(`Sent user registration notification for ${user.email}`);
      } else {
        console.error('sendToQueue method does not exist on channel object.');
      }
    } catch (error) {
      console.error('Failed to send user registration notification:', error);
    }
  }
}

export const notificationService = NotificationService.getInstance();
