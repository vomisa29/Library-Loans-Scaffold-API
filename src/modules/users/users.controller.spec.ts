import { ForbiddenException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserRole } from './entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let service: any;

  beforeEach(() => {
    service = {
      findAll: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 }),
      findById: jest.fn().mockResolvedValue({ id: 'u-1' }),
      update: jest.fn().mockResolvedValue({ id: 'u-1' }),
      softDelete: jest.fn().mockResolvedValue({ id: 'u-1', isActive: false }),
    };
    controller = new UsersController(service);
  });

  it('findAll delega al service', async () => {
    await controller.findAll({ page: 1, limit: 10 });
    expect(service.findAll).toHaveBeenCalled();
  });

  it('findOne lanza Forbidden si actor distinto y no admin', async () => {
    await expect(
      controller.findOne('u-1', { id: 'u-2', email: 'x', role: UserRole.PATIENT }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('findOne permite admin', async () => {
    const out = await controller.findOne('u-1', { id: 'admin', email: 'a', role: UserRole.ADMIN });
    expect(out.id).toBe('u-1');
  });

  it('findOne permite el propio usuario', async () => {
    const out = await controller.findOne('u-1', { id: 'u-1', email: 'a', role: UserRole.PATIENT });
    expect(out.id).toBe('u-1');
  });

  it('update delega al service', async () => {
    await controller.update(
      'u-1',
      { firstName: 'F' },
      { id: 'u-1', email: 'a', role: UserRole.PATIENT },
    );
    expect(service.update).toHaveBeenCalled();
  });

  it('remove delega al softDelete', async () => {
    const out = await controller.remove('u-1');
    expect(out.isActive).toBe(false);
  });
});
