import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createYogaServer } from './yoga-server';



async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();
  const yoga = createYogaServer(app);
  expressApp.use('/graphql', yoga);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
