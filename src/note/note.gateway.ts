import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ExecutionContext } from '@nestjs/common';
import { NoteService } from './note.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { subscribe } from 'diagnostics_channel';
import { AuthGuard } from '@nestjs/passport';
import { ConnectedUser } from 'src/auth/decorator/user.decorator';
import { JwtPayload } from 'src/auth/jwt-payload.interface';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Socket } from 'socket.io';
import { NoteLineService } from './noteLine.service';
import { UpdateNoteLineDto } from './dto/update-noteLine.dto';
import { ConnectedUserSocket } from 'src/auth/decorator/user.gateway.decorator';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NoteLine } from './entities/noteline.entity';
import { Company } from 'src/company/entities/company.entity';
import { User } from 'src/user/entities/user.entity';
import { JwtExtractorService } from 'src/auth/Jwt.extractor.service';
@WebSocketGateway({cors: true, namespace: 'notegateway'})
export class Notesocket {
    @WebSocketServer()
    server: Server;
    secret: string ;
  constructor(private readonly noteService: NoteService, 
    private readonly noteLineService: NoteLineService,
    private configService: ConfigService,
    private readonly extractor : JwtExtractorService
    ) {
    const secret = this.configService.get<string>('JWT_SECRET');
    if(secret === undefined) {
      throw new Error('JWT_SECRET is not defined in the configuration');
    }
    this.secret = secret;
  }
    
  @UseGuards(JwtAuthGuard)
  async handleConnection(client : Socket) {
    try {
      const token = client.handshake.query.Authorization as string;
      const temp = jwt.verify(token, this.secret) as any;
    const decoded = await this.extractor.validatePayload(temp);
      // ✅ Attach decoded user and join room by companyCode
      client.data.user = decoded;
      client.join(decoded.companyCode);
      console.log(decoded)
      console.log('Socket connected:', decoded.username, 'Company Code:', decoded.companyCode);
    } catch (err) {
      console.error('Socket auth failed:', err.message);
      client.disconnect();
    }
  }
    @SubscribeMessage('createNote')
    async handleNoteAltered(
        @ConnectedUser() user: JwtPayload,
        @MessageBody() data: {note: string },
    ) { 
        console.log(data)
        this.server.to(user.companyCode).emit('noteCreated', data.note);
    }
}
