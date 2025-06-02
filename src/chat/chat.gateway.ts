import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ConnectedUserSocket } from 'src/auth/decorator/user.gateway.decorator';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtPayload } from 'src/auth/jwt-payload.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
@UseGuards(JwtAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<number, Socket[]>();
  private companyRooms = new Map<string, Set<number>>(); 

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    try {
      console.log(`Client connected: ${client.id}`);
      
      // User data should be attached by JwtAuthGuard
      const user = client.data.user as JwtPayload;
      
      if (!user) {
        client.disconnect();
        return;
      }

      // Join company room
      const companyRoom = `company-${user.companyCode}`;
      client.join(companyRoom);

      // Track user connections
      if (!this.userSockets.has(user.sub)) {
        this.userSockets.set(user.sub, []);
      }
      (this.userSockets.get(user.sub) as Socket[]).push(client);

      if (!this.companyRooms.has(user.companyCode)) {
        this.companyRooms.set(user.companyCode, new Set());
      }
      (this.companyRooms.get(user.companyCode) as Set<number>).add(user.sub);

      // Notify others in company that user is online
      client.to(companyRoom).emit('userOnline', {
        userId: user.sub,
        username: user.username,
      });

      console.log(`User ${user.username} joined company room: ${companyRoom}`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const user = client.data.user as JwtPayload;
      
      if (!user) return;

      console.log(`Client disconnected: ${client.id}`);

      // Remove client from user sockets
      const userSockets = this.userSockets.get(user.sub);
      if (userSockets) {
        const index = userSockets.indexOf(client);
        if (index > -1) {
          userSockets.splice(index, 1);
        }

        // If no more sockets for this user, mark as offline
        if (userSockets.length === 0) {
          this.userSockets.delete(user.sub);
          
          const companyUsers = this.companyRooms.get(user.companyCode);
          if (companyUsers) {
            companyUsers.delete(user.sub);
          }

          // Notify others in company that user is offline
          const companyRoom = `company-${user.companyCode}`;
          client.to(companyRoom).emit('userOffline', {
            userId: user.sub,
            username: user.username,
          });
        }
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedUserSocket() user: JwtPayload,
  ) {
    try {
      const message = await this.chatService.sendMessage(data, user);
      
      const companyRoom = `company-${user.companyCode}`;
      this.server.to(companyRoom).emit('newMessage', {
        chatId: data.chatId,
        message,
      });

      return { success: true, message };
    } catch (error) {
      console.error('Send message error:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @MessageBody() data: { chatId: number },
    @ConnectedSocket() client: Socket,
    @ConnectedUserSocket() user: JwtPayload,
  ) {
    try {
      const chatRoom = `chat-${data.chatId}`;
      client.join(chatRoom);
      
      console.log(`User ${user.username} joined chat room: ${chatRoom}`);
      
      // Optionally notify others in the chat
      client.to(chatRoom).emit('userJoinedChat', {
        userId: user.sub,
        username: user.username,
        chatId: data.chatId,
      });

      return { success: true };
    } catch (error) {
      console.error('Join chat error:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('leaveChat')
  async handleLeaveChat(
    @MessageBody() data: { chatId: number },
    @ConnectedSocket() client: Socket,
    @ConnectedUserSocket() user: JwtPayload,
  ) {
    try {
      const chatRoom = `chat-${data.chatId}`;
      client.leave(chatRoom);
      
      console.log(`User ${user.username} left chat room: ${chatRoom}`);
      
      // Optionally notify others in the chat
      client.to(chatRoom).emit('userLeftChat', {
        userId: user.sub,
        username: user.username,
        chatId: data.chatId,
      });

      return { success: true };
    } catch (error) {
      console.error('Leave chat error:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { chatId: number, isTyping: boolean },
    @ConnectedSocket() client: Socket,
    @ConnectedUserSocket() user: JwtPayload,
  ) {
    try {
      const chatRoom = `chat-${data.chatId}`;
      
      client.to(chatRoom).emit('userTyping', {
        userId: user.sub,
        username: user.username,
        chatId: data.chatId,
        isTyping: data.isTyping,
      });

      return { success: true };
    } catch (error) {
      console.error('Typing error:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('getOnlineUsers')
  async handleGetOnlineUsers(@ConnectedUserSocket() user: JwtPayload) {
    try {
      const companyUsers = this.companyRooms.get(user.companyCode);
      const onlineUserIds = companyUsers ? Array.from(companyUsers) : [];
      
      return {
        success: true,
        onlineUsers: onlineUserIds,
      };
    } catch (error) {
      console.error('Get online users error:', error);
      return { success: false, error: error.message };
    }
  }
}