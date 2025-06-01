export const EventQuery = {
  async allEventTitles(_parent: any, _args: any, context) {
    const events = await context.eventsService.findAll();
    return events.map(e => e.title);
  },

  async eventTitlesByDate(_parent: any, args: { date: string }, context) {
    const events = await context.eventsService.findByDate(new Date(args.date));
    return events.map(e => e.title);
  }
};