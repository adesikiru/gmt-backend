import { Module } from '@nestjs/common';
import { NewsService, AnnouncementsService } from './news.service.js';
import { NewsController, AnnouncementsController } from './news.controller.js';

@Module({
  providers: [NewsService, AnnouncementsService],
  controllers: [NewsController, AnnouncementsController],
})
export class NewsModule {}
