/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Loan } from './entities/loan.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { BusinessLogicException } from '@common/errors/business-errors';
import { BusinessError } from '@common/errors/business-errors';

@Injectable()
export class LoanService {
    constructor(
       @InjectRepository(Loan)
       private readonly LoanRepository: Repository<Loan>
    ){}

    async findAll(): Promise<Loan[]> {
       return await this.LoanRepository.find();
    }

    async findOne(id: string): Promise<Loan> {
       const Loan : Loan | null = await this.LoanRepository.findOne({where: {id}});
       if (!Loan)
         throw new BusinessLogicException("The event with the given id was not found", BusinessError.NOT_FOUND);
  
       return Loan;
    }

    async create(Loan: Loan): Promise<Loan> {
       //Se pueden verificar reglas de negocio en esta función
       return await this.LoanRepository.save(Loan);
    }

    async update(id: string, Loan: Loan): Promise<Loan> {
       // Se reeemplaza el Loan persistido con una entidad Loan
       const persistedLoan: Loan | null = await this.LoanRepository.findOne({where:{id}});
       if (!persistedLoan)
         throw new BusinessLogicException("The event with the given id was not found", BusinessError.NOT_FOUND);
       
       return await this.LoanRepository.save({...persistedLoan, ...Loan});
    }

    async delete(id: string) {
       const Loan: Loan | null = await this.LoanRepository.findOne({where:{id}});
       if (!Loan)
         throw new BusinessLogicException("The event with the given id was not found", BusinessError.NOT_FOUND);
    
       await this.LoanRepository.remove(Loan);
    }
