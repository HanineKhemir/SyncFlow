export const Query = {
    hello: (_parent: any, _args: any, _context) => {
        return 'Hello World!';
    },
    // Add more query resolvers here as needed
    users(_parent: any, _args: any, context) {
        return context.userService.getAllUsers();
    },
    history(_parent: any, _args: any, context) {
        return context.historyService.getAllHistory();
    }
}