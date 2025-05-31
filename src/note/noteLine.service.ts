import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteLineDto } from './dto/update-noteLine.dto';
import { JwtPayload } from 'src/auth/jwt-payload.interface';
import { SharedService } from 'src/services/shared.services';
import { NoteLine } from './entities/noteline.entity';
import { User } from 'src/user/entities/user.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Note } from './entities/note.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { CreateEventService } from 'src/history/create-event.service';
import { OperationType } from 'src/enum/operation-type';
import { Schedule } from 'src/schedule/entities/schedule.entity';
import { Task } from 'src/task/entities/task.entity';

@Injectable()
export class NoteLineService extends SharedService<NoteLine> {
    @InjectRepository(Note) notesRepo : Repository<Note>
    constructor(@InjectRepository(NoteLine) repo : Repository<NoteLine>,
    private readonly cEventService: CreateEventService) {
        super(repo, cEventService);
    }

    async update(id=0, data: UpdateNoteLineDto, userID?): Promise<DeepPartial<NoteLine> | null> {
      const entity = await this.repository.findOne({where : {lineNumber: data.lineNumber, note: {id: data.noteId}}} );
      if (!entity) {
        throw new NotFoundException(`Entity with id ${id} not found`);
      }
      const{noteId, lineNumber, ...act_data} = data;
      console.log("act_data", act_data as DeepPartial<NoteLine>);
      const updated =  await super.update(entity.id, act_data as DeepPartial<NoteLine>, userID);
        if (updated == null) {
            return null;
        }
      return {
        ...data,
        updatedAt : updated.updatedAt,
      }
    }

    async createMultiple(n:number, noteId: number):Promise<Number>{
      console.log("createMultiple called with n:", n, "and noteId:", noteId);
        const note = await this.notesRepo.find({ where: { id: noteId } });
        console.log("note", note);
        if (note.length !== 1) {
            throw new NotFoundException(`Note with id ${noteId} not found`);
        }
        console.log("in func");
        const noteLines: NoteLine[] = [];
        for (let i = 0; i < n; i++) {
            const noteLine = new NoteLine();
            noteLine.lineNumber = i + 1;
            noteLine.note = note[0];
            noteLines.push(noteLine);
        }
        console.log("noteLines", noteLines);
        const savedNoteLines = await this.repository.save(noteLines);
        console.log("savedNoteLines", savedNoteLines);
        this.notesRepo.update(noteId, { updatedAt: new Date(),  lineCount: savedNoteLines.length+note[0].lineCount });
        return savedNoteLines.length;
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
