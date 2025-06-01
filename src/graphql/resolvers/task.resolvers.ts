// Field resolvers for Task type
export const Task = {
  async assignedTo(parent: any, _args: any, context: any) {
    if (!parent.assignedTo?.id) return null;
    return context.userService.findOne(parent.assignedTo.id);
  },

  async company(parent: any, _args: any, context: any) {
    if (!parent.company?.id) return null;
    return context.companyService.getCompanyById(parent.company.id);
  }
};

// Query resolvers for tasks
export const TaskQuery = {
  async tasks(_parent: any, _args: any, context: any) {
    // Check authentication
    if (!context.user) {
      throw new Error('Authentication required');
    }
    
    return context.taskService.findAll();
  },

  async task(_parent: any, args: { id: string }, context: any) {
    if (!context.user) {
      throw new Error('Authentication required');
    }

    return context.taskService.findOne(parseInt(args.id));
  },

  async tasksByUser(_parent: any, args: { userId: string }, context: any) {
    if (!context.user) {
      throw new Error('Authentication required');
    }

    return context.taskService.getTasksByUser(parseInt(args.userId));
  },

  async tasksByCompany(_parent: any, args: { companyId: string }, context: any) {
    if (!context.user) {
      throw new Error('Authentication required');
    }

    return context.taskService.getTasksByCompany(parseInt(args.companyId));
  }
};

// Mutation resolvers for tasks
export const TaskMutation = {
  async createTask(_parent: any, args: { input: any }, context: any) {
    if (!context.user) {
      throw new Error('Authentication required');
    }

    const createTaskDto = {
      title: args.input.title,
      description: args.input.description,
      dueDate: args.input.dueDate,
      completed: args.input.completed ?? false,
      assignedToId: args.input.assignedToId ? parseInt(args.input.assignedToId) : undefined
    };

    return context.taskService.create(createTaskDto, context.user);
  },

  async updateTask(_parent: any, args: { id: string, input: any }, context: any) {
    if (!context.user) {
      throw new Error('Authentication required');
    }

    const updateTaskDto = {
      title: args.input.title,
      description: args.input.description,
      dueDate: args.input.dueDate,
      completed: args.input.completed,
      assignedToId: args.input.assignedToId ? parseInt(args.input.assignedToId) : undefined
    };

    return context.taskService.update(parseInt(args.id), updateTaskDto, context.user);
  },

  async deleteTask(_parent: any, args: { id: string }, context: any) {
    if (!context.user) {
      throw new Error('Authentication required');
    }

    try {
      await context.taskService.remove(parseInt(args.id), context.user);
      return true;
    } catch (error) {
      return false;
    }
  }
};

