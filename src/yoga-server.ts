// src/graphql/yoga-server.ts
import { createYoga } from 'graphql-yoga';
import { createSchema } from 'graphql-yoga';
import { Query } from './graphql/resolvers/query';
import { EventQuery } from './graphql/resolvers/event.resolver'; // ✅ NEW

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
import { ConfigService } from '@nestjs/config';
import { Operation, NoteLine } from './graphql/resolvers/fieldresolvers';
import { TaskQuery , TaskMutation,Task} from './graphql/resolvers/task.resolvers';
import { TaskService } from './task/task.service';
import { EventsService } from './events/events.service';

    
export function createYogaServer(app: INestApplicationContext) {
  const jwtExtractor = app.get(JwtExtractorService);
  const noteService = app.get(NoteService);
  const noteLineService = app.get(NoteLineService);
  const userService = app.get(UserService); 
  const historyService = app.get(HistoryService);
  const companyService = app.get(CompanyService); 
  const scheduleService = app.get(ScheduleService);
  const configService = app.get(ConfigService);
  const taskService = app.get(TaskService);

  const secret = configService.get('JWT_SECRET');

console.log(__dirname)
  return createYoga({
    schema: createSchema({
  typeDefs: fs.readFileSync(
    path.join(__dirname, "../src/graphql/schema.graphql"),
    "utf-8"
  ),resolvers:{
     Query: {
       ...Query,
       ...TaskQuery,
        ...EventQuery 
     },
     Mutation: {
       ...TaskMutation
     },
     NoteLine,
     Operation,
     Task
    } }),

    context: async ({ request }) => {
      // Extract JWT
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      console.log('Token received:', token);
let user: any = null;

if (token) {
  try {
    const decodedJwt = jwt.verify(token, secret as string) as any;
    console.log('User extracted from token:', decodedJwt);
    user = await jwtExtractor.validatePayload(decodedJwt); 
    console.log('User after validation:', user);
    if (!user) {
      throw new Error('User not found');
    }
  } catch (e) {
    console.warn('Invalid token');
  }
}else{
  console.warn('No token provided');
}


      return {
        user, 
        eventsService: app.get(EventsService),
        noteService,
        noteLineService,
        userService,
        historyService,
        companyService,
        scheduleService,
        taskService
      };
    },
  });
}
