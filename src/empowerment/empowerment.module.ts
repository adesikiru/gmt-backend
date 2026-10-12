import { Module } from '@nestjs/common';
import { EmpowermentController } from './empowerment.controller.js';
import { EmpowermentService } from './empowerment.service.js';

@Module({
  controllers: [EmpowermentController],
  providers: [EmpowermentService],
  exports: [EmpowermentService],
})
export class EmpowermentModule {}
