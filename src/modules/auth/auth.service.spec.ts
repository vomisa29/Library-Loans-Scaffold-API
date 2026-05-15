import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let jwt: any;
  let refreshRepo: any;

  const makeUser = (overrides: Partial<User> = {}): User =>
    ({
      id: 'u-1',
      email: 'x@y.com',
      firstName: 'X',
      lastName: 'Y',
      passwordHash: '',
      role: UserRole.PATIENT,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as User;

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    jwt = { signAsync: jest.fn().mockResolvedValue('token-abc') };
    refreshRepo = {
      create: jest.fn((e) => e),
      save: jest.fn((e) => Promise.resolve({ id: 'rt-1', ...e })),
      findOne: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwt },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: unknown) => {
              const map: Record<string, unknown> = {
                'jwt.accessSecret': 'access-secret',
                'jwt.accessExpiresIn': '15m',
                'jwt.refreshSecret': 'refresh-secret',
                'jwt.refreshExpiresIn': '7d',
              };
              return map[key] ?? def;
            }),
          },
        },
        { provide: getRepositoryToken(RefreshToken), useValue: refreshRepo },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('validateUser', () => {
    it('lanza Unauthorized con credenciales inválidas (usuario inexistente)', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.validateUser('x@y.com', 'pw')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('lanza Unauthorized con password incorrecto', async () => {
      const u = makeUser({ passwordHash: await bcrypt.hash('correct', 10) });
      usersService.findByEmail.mockResolvedValue(u);
      await expect(service.validateUser('x@y.com', 'wrong')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('lanza Unauthorized con usuario inactivo', async () => {
      const u = makeUser({ isActive: false, passwordHash: await bcrypt.hash('correct', 10) });
      usersService.findByEmail.mockResolvedValue(u);
      await expect(service.validateUser('x@y.com', 'correct')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('regresa el user con credenciales correctas', async () => {
      const u = makeUser({ passwordHash: await bcrypt.hash('correct', 10) });
      usersService.findByEmail.mockResolvedValue(u);
      const out = await service.validateUser('x@y.com', 'correct');
      expect(out.id).toBe('u-1');
    });
  });

  describe('login', () => {
    it('genera access + refresh tokens y persiste el refresh', async () => {
      const u = makeUser({ passwordHash: await bcrypt.hash('correct', 10) });
      usersService.findByEmail.mockResolvedValue(u);
      const res = await service.login({ email: 'x@y.com', password: 'correct' });
      expect(res.accessToken).toBe('token-abc');
      expect(res.refreshToken).toBe('token-abc');
      expect(refreshRepo.save).toHaveBeenCalled();
      expect(jwt.signAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('register', () => {
    it('por defecto crea con rol patient', async () => {
      usersService.create.mockResolvedValue(makeUser());
      await service.register({
        email: 'new@y.com',
        password: 'pw12345678',
        firstName: 'F',
        lastName: 'L',
      });
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.PATIENT }),
      );
    });

    it('respeta rol distinto solo si actor es admin', async () => {
      usersService.create.mockResolvedValue(makeUser({ role: UserRole.DOCTOR }));
      await service.register(
        {
          email: 'doc@y.com',
          password: 'pw12345678',
          firstName: 'F',
          lastName: 'L',
          role: UserRole.DOCTOR,
        },
        UserRole.ADMIN,
      );
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.DOCTOR }),
      );
    });

    it('ignora rol distinto si actor no es admin', async () => {
      usersService.create.mockResolvedValue(makeUser());
      await service.register(
        {
          email: 'a@y.com',
          password: 'pw12345678',
          firstName: 'F',
          lastName: 'L',
          role: UserRole.DOCTOR,
        },
        UserRole.RECEPTIONIST,
      );
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.PATIENT }),
      );
    });
  });

  describe('refresh', () => {
    it('falla si el refresh no existe', async () => {
      refreshRepo.findOne.mockResolvedValue(null);
      await expect(service.refresh('rt', { sub: 'u-1', email: 'x@y.com' })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('falla si el refresh está revocado', async () => {
      refreshRepo.findOne.mockResolvedValue({
        token: 'rt',
        userId: 'u-1',
        expiresAt: new Date(Date.now() + 10000),
        revokedAt: new Date(),
      });
      await expect(service.refresh('rt', { sub: 'u-1', email: 'x@y.com' })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('falla si el refresh no corresponde al user', async () => {
      refreshRepo.findOne.mockResolvedValue({
        token: 'rt',
        userId: 'other',
        expiresAt: new Date(Date.now() + 10000),
        revokedAt: null,
      });
      await expect(service.refresh('rt', { sub: 'u-1', email: 'x@y.com' })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('genera un nuevo access token', async () => {
      refreshRepo.findOne.mockResolvedValue({
        token: 'rt',
        userId: 'u-1',
        expiresAt: new Date(Date.now() + 10000),
        revokedAt: null,
      });
      usersService.findById.mockResolvedValue(makeUser());
      const out = await service.refresh('rt', { sub: 'u-1', email: 'x@y.com' });
      expect(out.accessToken).toBe('token-abc');
    });
  });

  describe('logout', () => {
    it('marca el refresh como revocado', async () => {
      const stored = { token: 'rt', userId: 'u-1', revokedAt: null };
      refreshRepo.findOne.mockResolvedValue(stored);
      await service.logout('u-1', 'rt');
      expect(stored.revokedAt).toBeInstanceOf(Date);
      expect(refreshRepo.save).toHaveBeenCalledWith(stored);
    });

    it('no hace nada si el refresh no existe', async () => {
      refreshRepo.findOne.mockResolvedValue(null);
      await service.logout('u-1', 'rt');
      expect(refreshRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('delega a usersService.findById', async () => {
      const u = makeUser();
      usersService.findById.mockResolvedValue(u);
      const out = await service.getCurrentUser('u-1');
      expect(out).toBe(u);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('elimina tokens expirados', async () => {
      await service.cleanupExpiredTokens();
      expect(refreshRepo.delete).toHaveBeenCalled();
    });
  });
});
