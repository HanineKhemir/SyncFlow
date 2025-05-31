import { Injectable } from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteLineDto } from './dto/update-noteLine.dto';
import { JwtPayload } from 'src/auth/jwt-payload.interface';
import { SharedService } from 'src/services/shared.services';
import { NoteLine } from './entities/noteline.entity';
import { User } from 'src/user/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Note } from './entities/note.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventService } from 'src/history/create-event.service';

@Injectable()
export class NoteLineService extends SharedService<NoteLine> {
    constructor(@InjectRepository(NoteLine) repo : Repository<NoteLine>, private readonly cEventService: CreateEventService) {
        super(repo, cEventService);
    }
    // async create(createNoteDto: CreateNoteDto, user: JwtPayload): Promise<NoteLine |null> {
    //     return this.sharedService.create(createNoteDto, user);
    // }
    
    // async findAll(): Promise<NoteLine[]> {
    //     return this.sharedService.findAllNoteLines();
    // }
    
    // async findOne(id: string): Promise<NoteLine> {
    //     return this.sharedService.findOneNoteLine(id);
    // }
    
    // async update(updateNoteLineDto: UpdateNoteLineDto): Promise<NoteLine> {
    //     const NoteLine = await this.sharedService.update(user , updateNoteLineDto);
    //     if (!NoteLine) {
    //         throw new Error(`NoteLine with id ${id} not found`);
    //     }
    //     return NoteLine ;
    // }
    
    // async remove(id: string): Promise<void> {
    //     return this.sharedService.removeNoteLine(id);
    // }
  
}
