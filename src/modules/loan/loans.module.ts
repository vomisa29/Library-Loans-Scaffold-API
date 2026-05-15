/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from './entities/loan.entity';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Loan]), UsersModule],
//   controllers: [LoansController],
//   providers: [LoansService],
//   exports: [LoansService],
})
export class LoansModule {}