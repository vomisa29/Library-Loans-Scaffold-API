/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Item]), UsersModule],
//   controllers: [ItemsController],
//   providers: [ItemsService],
//   exports: [ItemsService],
})
export class ItemsModule {}