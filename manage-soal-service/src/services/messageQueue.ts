import * as amqp from 'amqplib/callback_api';
import { Connection, Channel, ConsumeMessage } from 'amqplib/callback_api';
import { promisify } from 'util';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';

// Promisify amqplib callback functions
const connect = promisify(amqp.connect);

interface QuestionMessage {
  type: string;
  question: any;
  timestamp: Date;
}

class MessageQueueService {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  async connect() {
    try {
      this.connection = await new Promise<amqp.Connection>((resolve, reject) => {
        amqp.connect(RABBITMQ_URL, (error, connection) => {
          if (error) reject(error);
          else resolve(connection);
        });
      });
      
      if (this.connection) {
        this.channel = await new Promise<amqp.Channel>((resolve, reject) => {
          this.connection!.createChannel((error, channel) => {
            if (error) reject(error);
            else resolve(channel);
          });
        });

        await this.setupQuestionSync();
        console.log('Successfully connected to RabbitMQ');

        // Handle connection events
        this.connection.on('error', (err) => {
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
      this.channel!.assertQueue(queue, { durable: true }, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    this.channel.consume(queue, async (msg: amqp.Message | null) => {
      if (msg && this.channel) {
        try {
          const data: QuestionMessage = JSON.parse(msg.content.toString());
          await this.handleQuestionSync(data);
          this.channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          if (this.channel) {
            this.channel.nack(msg, false, true);
          }
        }
      }
    });

    console.log('Question sync queue setup complete');
  }

  private async handleQuestionSync(data: QuestionMessage) {
    try {
      switch (data.type) {
        case 'SOAL_GENERATED':
          await this.syncQuestion(data.question);
          break;
        case 'SOAL_UPDATED':
          await this.updateQuestion(data.question);
          break;
        case 'SOAL_DELETED':
          await this.deleteQuestion(data.question.id);
          break;
        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling question sync:', error);
      throw error;
    }
  }

  private async syncQuestion(question: any) {
    await prisma.question.upsert({
      where: { id: question.id },
      update: question,
      create: question
    });
    console.log('Question synced:', question.id);
  }

  private async updateQuestion(question: any) {
    await prisma.question.update({
      where: { id: question.id },
      data: question
    });
    console.log('Question updated:', question.id);
  }

  private async deleteQuestion(id: string) {
    await prisma.question.delete({
      where: { id }
    });
    console.log('Question deleted:', id);
  }

  async disconnect() {
    try {
      if (this.channel) {
        await new Promise<void>((resolve, reject) => {
          this.channel!.close((error) => {
            if (error) reject(error);
            else resolve();
          });
        });
        this.channel = null;
      }
      if (this.connection) {
        await new Promise<void>((resolve, reject) => {
          this.connection!.close((error) => {
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