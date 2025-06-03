import { Resolver, Query } from '@nestjs/graphql';
import { EventTitleByDateDTO } from '../../events/dto/event-title-by-date.dto';

@Resolver(() => EventTitleByDateDTO)
export class EventResolver {
  constructor() {}
}

export const EventQuery = {
  async eventTitlesByDate(_parent: any, args: { date: string }, context: any): Promise<EventTitleByDateDTO[]> {
    const user = context.req?.user || context.user;
    if (!user || !user.company) {
      throw new Error('Unauthorized: user or company missing from context');
    }

    return context.eventService.getEventTitlesByDate(user.company.id, args.date);
  },

  async allUpcomingEvents(_parent: any, args: { startDate: string }, context: any): Promise<EventTitleByDateDTO[]> {
    const user = context.req?.user || context.user;
    if (!user || !user.company) {
      throw new Error('Unauthorized: user or company missing from context');
    }

    return context.eventService.getUpcomingWeekEvents(user.company.id, args.startDate);
  }
};