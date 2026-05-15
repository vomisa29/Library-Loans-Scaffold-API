/* eslint-disable prettier/prettier */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate,  IsEnum, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { Status } from '../entities/loan.entity';

export class CreateUserDto {

  @ApiProperty()
  @IsUUID()
  userID!: string;

  @ApiProperty()
  @IsUUID()
  itemID!: string;


  @ApiProperty({ example: '15/05/2026' })
  @IsDate()
  loanedAt!: Date;

  @ApiProperty({ example: '15/05/2026' })
  @IsDate()
  dueAt!: Date;

  @ApiProperty({ example: '15/05/2026' })
  @IsDate()
  returnedAt!: Date;

  @ApiPropertyOptional({ enum: Status, default: Status.ACTIVE })
  @IsOptional()
  @IsEnum(Status)
  status!: Status;

  @ApiProperty({ example: 9.2 , default: 0.0})
  @IsNumber()
  fineAmount!: number;
}