import * as amqp from 'amqplib/callback_api';
import { Connection, Channel, ConsumeMessage } from 'amqplib/callback_api';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';

interface QuestionMessage {
  type: string;
  question: any;
  timestamp: Date;
}

class MessageQueueService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  async connect() {
    try {
      this.connection = await new Promise<Connection>((resolve, reject) => {
        amqp.connect(RABBITMQ_URL, (error: Error | null, connection: Connection) => {
          if (error) reject(error);
          else resolve(connection);
        });
      });
      
      if (this.connection) {
        this.channel = await new Promise<Channel>((resolve, reject) => {
          this.connection!.createChannel((error: Error | null, channel: Channel) => {
            if (error) reject(error);
            else resolve(channel);
          });
        });

        await this.setupQuestionSync();
        console.log('Successfully connected to RabbitMQ');

        // Handle connection events
        this.connection.on('error', (err: Error) => {
          console.error('RabbitMQ connection error:', err);
          this.reconnect();
        });

        this.connection.on('close', () => {
          console.error('RabbitMQ connection closed. Reconnecting...');
          this.reconnect();
        });
      }
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      this.reconnect();
    }
  }

  private async reconnect() {
    await this.disconnect();
    setTimeout(() => this.connect(), 5000);
  }

  private async setupQuestionSync() {
    if (!this.channel) return;

    const queue = 'soal-sync';
    await new Promise<void>((resolve, reject) => {
      this.channel!.assertQueue(queue, { durable: true }, (error: Error | null) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  async publishQuestionCreated(question: any) {
    if (!this.channel) {
      console.error('Cannot publish message: RabbitMQ channel is not available.');
      throw new Error('Cannot publish message: RabbitMQ channel is not available.');
    }

    const message: QuestionMessage = {
      type: 'SOAL_GENERATED',
      question,
      timestamp: new Date()
    };

    this.channel.sendToQueue(
      'soal-sync',
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
    console.log('Question creation message sent:', question.id);
  }

  async disconnect() {
    try {
      if (this.channel) {
        await new Promise<void>((resolve, reject) => {
          this.channel!.close((error: Error | null) => {
            if (error) reject(error);
            else resolve();
          });
        });
        this.channel = null;
      }
      if (this.connection) {
        await new Promise<void>((resolve, reject) => {
          this.connection!.close((error: Error | null) => {
            if (error) reject(error);
            else resolve();
          });
        });
        this.connection = null;
      }
    } catch (error) {
      console.error('Error disconnecting from RabbitMQ:', error);
    }
  }
}

export const messageQueue = new MessageQueueService();