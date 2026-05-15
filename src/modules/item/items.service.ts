/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Item } from './entities/item.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { BusinessLogicException } from '@common/errors/business-errors';
import { BusinessError } from '@common/errors/business-errors';

@Injectable()
export class ItemService {
    constructor(
       @InjectRepository(Item)
       private readonly ItemRepository: Repository<Item>
    ){}

    async findAll(): Promise<Item[]> {
       return await this.ItemRepository.find();
    }

    async findOne(id: string): Promise<Item> {
       const Item : Item | null = await this.ItemRepository.findOne({where: {id}});
       if (!Item)
         throw new BusinessLogicException("The event with the given id was not found", BusinessError.NOT_FOUND);
  
       return Item;
    }

    async create(Item: Item): Promise<Item> {
       //Se pueden verificar reglas de negocio en esta función
       return await this.ItemRepository.save(Item);
    }

    async update(id: string, Item: Item): Promise<Item> {
       // Se reeemplaza el Item persistido con una entidad Item
       const persistedItem: Item | null = await this.ItemRepository.findOne({where:{id}});
       if (!persistedItem)
         throw new BusinessLogicException("The event with the given id was not found", BusinessError.NOT_FOUND);
       
       return await this.ItemRepository.save({...persistedItem, ...Item});
    }

    async delete(id: string) {
       const Item: Item | null = await this.ItemRepository.findOne({where:{id}});
       if (!Item)
         throw new BusinessLogicException("The event with the given id was not found", BusinessError.NOT_FOUND);
    
       await this.ItemRepository.remove(Item);
    }

}