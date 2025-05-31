import { Injectable } from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { JwtPayload } from 'src/auth/jwt-payload.interface';
import { SharedService } from 'src/services/shared.services';
import { Note } from './entities/note.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateEventService } from 'src/history/create-event.service';
import { Repository } from 'typeorm';
import { NoteLine } from './entities/noteline.entity';

@Injectable()
export class NoteService extends SharedService<Note>{
  constructor(
    @InjectRepository(Note) private readonly repo: Repository<Note>,
    private readonly cEventService: CreateEventService
  ) {
    super(repo, cEventService);
  }

      async lineCount(noteId: number): Promise<number> {
        const note = await this.repo.findOne({
            where: { id: noteId },
            relations: ['lines'],
        });
        return note ? note.lines.length : 0;
}

async getNoteById(noteId: number): Promise<Note | null> {
  const temp = await this.repo.findOne({
    where: { id: noteId },
    relations: ['company'],
  });
    return temp;
  }

}