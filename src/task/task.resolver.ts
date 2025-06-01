import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { TaskService } from './task.service';
import { Task } from './entities/task.entity';

@Resolver(() => Task)
export class TaskResolver {
  constructor(private readonly taskService: TaskService) {}

  @Query(() => [Task])
  async tasks(): Promise<Task[]> {
    return this.taskService.findAll();
  }

  @Query(() => Task)
  async task(@Args('id', { type: () => ID }) id: number): Promise<Task> {
    return this.taskService.findOne(id);
  }

  @Query(() => [Task])
  async tasksByUser(@Args('userId', { type: () => ID }) userId: number): Promise<Task[]> {
    return this.taskService.getTasksByUser(userId);
  }

  @Query(() => [Task])
  async tasksByCompany(@Args('companyId', { type: () => ID }) companyId: number): Promise<Task[]> {
    return this.taskService.getTasksByCompany(companyId);
  }
} 