import * as amqp from 'amqplib';
import { Server, WebSocket } from 'ws';
import { addActivity } from './activityStore';

// 1. Deklarasikan interface yang diperluas
interface ExtendedConnection extends amqp.Connection {
    createChannel(): Promise<amqp.Channel>;
    close(): Promise<void>;
}

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000;
const QUEUE_NAME = 'soal-notifications';

let wss: Server;

interface NotificationMessage {
    type: string;
    data: {
        user?: {
            name: string;
            email: string;
            avatar?: string;
        };
        metadata?: Record<string, any>;
    };
    timestamp?: Date;
}

export function setupWebSocket(server: any): void {
    wss = new Server({ server });
    
    wss.on('connection', (ws: WebSocket) => {
        console.log('Client connected to notification service');
        
        ws.on('close', () => {
            console.log('Client disconnected from notification service');
        });
    });
}

// 2. Gunakan ExtendedConnection sebagai return type
async function connectWithRetry(retries = MAX_RETRIES): Promise<ExtendedConnection> {
    try {
        const connection = await amqp.connect(RABBITMQ_URL) as unknown as ExtendedConnection;
        console.log('Successfully connected to RabbitMQ');
        return connection;
    } catch (error) {
        if (retries === 0) {
            console.error('Max retries reached for RabbitMQ connection');
            throw error;
        }
        console.log(`Failed to connect to RabbitMQ. Retrying in ${RETRY_INTERVAL/1000} seconds... (${retries} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
        return connectWithRetry(retries - 1);
    }
}

export async function setupMessageQueue(): Promise<void> {
    try {
        const connection = await connectWithRetry();
        const channel = await connection.createChannel();
        
        await channel.assertQueue(QUEUE_NAME, {
            durable: true,
            arguments: {
                'x-message-ttl': 86400000
            }
        });
        
        console.log('Connected to RabbitMQ, waiting for messages...');
        
        const consumeOptions: amqp.Options.Consume = {
            noAck: false
        };
        
        await channel.consume(QUEUE_NAME, async (msg: amqp.ConsumeMessage | null) => {
            try {
                if (msg) {
                    const notification = JSON.parse(msg.content.toString()) as NotificationMessage;
                    
                    // Broadcast to WebSocket clients
                    await broadcastNotification(notification);
                    
                    // Save to activity store
                    if (notification.data?.user) {
                        addActivity({
                            type: notification.type,
                            user: notification.data.user,
                            metadata: notification.data.metadata
                        });
                    }
                    
                    channel.ack(msg);
                }
            } catch (error) {
                console.error('Error processing message:', error);
                if (msg) {
                    channel.nack(msg);
                }
            }
        }, consumeOptions);

        connection.on('error', (error: Error) => {
            console.error('RabbitMQ connection error:', error.message);
            setTimeout(() => setupMessageQueue(), RETRY_INTERVAL).unref();
        });

        connection.on('close', () => {
            console.error('RabbitMQ connection closed. Reconnecting...');
            setTimeout(() => setupMessageQueue(), RETRY_INTERVAL).unref();
        });
        
    } catch (error) {
        console.error('Error in message queue setup:', error);
        setTimeout(() => setupMessageQueue(), RETRY_INTERVAL).unref();
    }
}

async function broadcastNotification(notification: NotificationMessage): Promise<void> {
    if (!wss) {
        console.warn('WebSocket server not initialized');
        return;
    }
    
    const message: NotificationMessage = {
        type: notification.type,
        data: notification.data,
        timestamp: new Date()
    };
    
    const messageString = JSON.stringify(message);
    
    (wss.clients as Set<WebSocket>).forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(messageString, (error?: Error) => {
                if (error) {
                    console.error('Error sending WebSocket message:', error);
                }
            });
        }
    });
}

export async function publishMessage(message: NotificationMessage): Promise<void> {
    let connection: ExtendedConnection | null = null;
    try {
        connection = await connectWithRetry();
        const channel = await connection.createChannel();
        
        await channel.assertQueue(QUEUE_NAME, { durable: true });
        
        const messageBuffer = Buffer.from(JSON.stringify(message));
        const sendOptions: amqp.Options.Publish = {
            persistent: true
        };
        
        channel.sendToQueue(QUEUE_NAME, messageBuffer, sendOptions);
        
        await channel.close();
    } catch (error) {
        console.error('Error publishing message:', error);
        throw error;
    } finally {
        if (connection) {
            setTimeout(async () => {
                try {
                    if (connection) {
                        await connection.close();
                    }
                } catch (err) {
                    console.error('Error closing connection:', err);
                }
            }, 500);
        }
    }
}