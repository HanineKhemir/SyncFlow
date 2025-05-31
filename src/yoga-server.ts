// src/graphql/yoga-server.ts
import { createYoga } from 'graphql-yoga';
import { createSchema } from 'graphql-yoga';
import { Query } from './graphql/resolvers/query';
import { INestApplicationContext } from '@nestjs/common';
import { JwtExtractorService } from 'src/auth/Jwt.extractor.service';
import { NoteService } from 'src/note/note.service';
import { NoteLineService } from 'src/note/noteLine.service';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';

import * as path from 'path';
import { CompanyService } from './company/company.service';
import { HistoryService } from './history/history.service';
import { ScheduleService } from './schedule/schedule.service';
import { UserService } from './user/user.service';

    
export function createYogaServer(app: INestApplicationContext) {
  const jwtExtractor = app.get(JwtExtractorService);
  const noteService = app.get(NoteService);
  const noteLineService = app.get(NoteLineService);
  const userService = app.get(UserService); 
  const historyService = app.get(HistoryService);
  const companyService = app.get(CompanyService); 
  const scheduleService = app.get(ScheduleService);

  const secret = process.env.JWT_SECRET;

console.log(__dirname)
  return createYoga({
    schema: createSchema({
  typeDefs: fs.readFileSync(
    path.join(__dirname, "../src/graphql/schema.graphql"),
    "utf-8"
  ),resolvers:{
     Query
    } }),

    context: async ({ request }) => {
      // Extract JWT
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      let user = null;
      if (token) {
        try {

            const token  = request.headers.get('authorization')?.replace('Bearer ', '') as string;
            const decodedJwt = jwt.verify(token, secret as string) as any;
            const user = await jwtExtractor.validatePayload(decodedJwt);

        } catch (e) {
          console.warn('Invalid token');
        }
      }

      return {
        user, 
        noteService,
        noteLineService,
        userService,
        historyService,
        companyService,
        scheduleService,
      };
    },
  });
}
