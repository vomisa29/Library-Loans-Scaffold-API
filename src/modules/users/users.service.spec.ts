import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repo: any;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) => Promise.resolve({ id: 'u-1', ...entity })),
      createQueryBuilder: jest.fn(() => ({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(10) } },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('create', () => {
    it('falla si el email ya existe', async () => {
      repo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(
        service.create({
          email: 'a@b.com',
          password: 'StrongPass1!',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('hashea el password antes de guardar', async () => {
      repo.findOne.mockResolvedValue(null);
      const created = await service.create({
        email: 'new@x.com',
        password: 'StrongPass1!',
        firstName: 'Nu',
        lastName: 'Evo',
      });
      expect(created.passwordHash).toBeDefined();
      expect(created.passwordHash).not.toBe('StrongPass1!');
      const matches = await bcrypt.compare('StrongPass1!', created.passwordHash);
      expect(matches).toBe(true);
    });

    it('aplica rol patient por defecto', async () => {
      repo.findOne.mockResolvedValue(null);
      const u = await service.create({
        email: 'x@y.com',
        password: 'StrongPass1!',
        firstName: 'F',
        lastName: 'L',
      });
      expect(u.role).toBe(UserRole.PATIENT);
    });
  });

  describe('softDelete', () => {
    it('marca isActive = false', async () => {
      repo.findOne.mockResolvedValue({ id: 'u-1', isActive: true } as User);
      const updated = await service.softDelete('u-1');
      expect(updated.isActive).toBe(false);
    });

    it('lanza NotFound si no existe', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.softDelete('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('falla si actor no es admin ni dueño', async () => {
      repo.findOne.mockResolvedValue({ id: 'u-1', role: UserRole.PATIENT } as User);
      await expect(
        service.update('u-1', { firstName: 'X' }, { id: 'u-2', role: UserRole.PATIENT }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('falla si no admin intenta cambiar rol', async () => {
      repo.findOne.mockResolvedValue({ id: 'u-1', role: UserRole.PATIENT } as User);
      await expect(
        service.update('u-1', { role: UserRole.DOCTOR }, { id: 'u-1', role: UserRole.PATIENT }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('admin puede cambiar el rol', async () => {
      repo.findOne.mockResolvedValue({ id: 'u-1', role: UserRole.PATIENT } as User);
      const u = await service.update(
        'u-1',
        { role: UserRole.DOCTOR },
        { id: 'admin', role: UserRole.ADMIN },
      );
      expect(u.role).toBe(UserRole.DOCTOR);
    });
  });

  describe('findById', () => {
    it('lanza NotFound si no existe', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById('x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('regresa null si no existe', async () => {
      repo.findOne.mockResolvedValue(null);
      const u = await service.findByEmail('none@x.com');
      expect(u).toBeNull();
    });
  });

  describe('findAll', () => {
    it('aplica filtro por rol y paginación', async () => {
      const res = await service.findAll({ page: 1, limit: 10, role: UserRole.DOCTOR });
      expect(res.page).toBe(1);
      expect(res.limit).toBe(10);
      expect(res.total).toBe(0);
    });
  });
});
