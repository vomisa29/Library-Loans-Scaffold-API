/* eslint-disable prettier/prettier */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TipoItem } from '../entities/item.entity';

export class CreateItemDto {
  @ApiProperty({ example: 'BK-0042' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Titulo Ejemplo' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ enum: TipoItem, default: TipoItem.BOOK })
  @IsOptional()
  @IsEnum(TipoItem)
  type?: TipoItem;
}