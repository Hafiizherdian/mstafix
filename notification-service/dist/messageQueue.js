"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocket = setupWebSocket;
exports.setupMessageQueue = setupMessageQueue;
exports.publishMessage = publishMessage;
const amqp = __importStar(require("amqplib"));
const ws_1 = require("ws");
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000;
const QUEUE_NAME = 'soal-notifications';
let wss;
function setupWebSocket(server) {
    wss = new ws_1.Server({ server });
    wss.on('connection', (ws) => {
        console.log('Client connected to notification service');
        ws.on('close', () => {
            console.log('Client disconnected from notification service');
        });
    });
}
// 2. Gunakan ExtendedConnection sebagai return type
async function connectWithRetry(retries = MAX_RETRIES) {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        console.log('Successfully connected to RabbitMQ');
        return connection;
    }
    catch (error) {
        if (retries === 0) {
            console.error('Max retries reached for RabbitMQ connection');
            throw error;
        }
        console.log(`Failed to connect to RabbitMQ. Retrying in ${RETRY_INTERVAL / 1000} seconds... (${retries} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
        return connectWithRetry(retries - 1);
    }
}
async function setupMessageQueue() {
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
        const consumeOptions = {
            noAck: false
        };
        await channel.consume(QUEUE_NAME, async (msg) => {
            try {
                if (msg) {
                    const notification = JSON.parse(msg.content.toString());
                    await broadcastNotification(notification);
                    channel.ack(msg);
                }
            }
            catch (error) {
                console.error('Error processing message:', error);
                if (msg) {
                    channel.nack(msg);
                }
            }
        }, consumeOptions);
        connection.on('error', (error) => {
            console.error('RabbitMQ connection error:', error.message);
            setTimeout(() => setupMessageQueue(), RETRY_INTERVAL).unref();
        });
        connection.on('close', () => {
            console.error('RabbitMQ connection closed. Reconnecting...');
            setTimeout(() => setupMessageQueue(), RETRY_INTERVAL).unref();
        });
    }
    catch (error) {
        console.error('Error in message queue setup:', error);
        setTimeout(() => setupMessageQueue(), RETRY_INTERVAL).unref();
    }
}
async function broadcastNotification(notification) {
    if (!wss) {
        console.warn('WebSocket server not initialized');
        return;
    }
    const message = {
        type: notification.type,
        data: notification.data,
        timestamp: new Date()
    };
    const messageString = JSON.stringify(message);
    wss.clients.forEach((client) => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(messageString, (error) => {
                if (error) {
                    console.error('Error sending WebSocket message:', error);
                }
            });
        }
    });
}
async function publishMessage(message) {
    let connection = null;
    try {
        connection = await connectWithRetry();
        const channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME, { durable: true });
        const messageBuffer = Buffer.from(JSON.stringify(message));
        const sendOptions = {
            persistent: true
        };
        channel.sendToQueue(QUEUE_NAME, messageBuffer, sendOptions);
        await channel.close();
    }
    catch (error) {
        console.error('Error publishing message:', error);
        throw error;
    }
    finally {
        if (connection) {
            setTimeout(async () => {
                try {
                    if (connection) {
                        await connection.close();
                    }
                }
                catch (err) {
                    console.error('Error closing connection:', err);
                }
            }, 500);
        }
    }
}
