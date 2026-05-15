import { AuthController } from './auth.controller';
import { UserRole } from '../users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let service: any;

  beforeEach(() => {
    service = {
      register: jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' }),
      login: jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' }),
      refresh: jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' }),
      logout: jest.fn().mockResolvedValue(undefined),
      getCurrentUser: jest.fn().mockResolvedValue({ id: 'u-1' }),
    };
    controller = new AuthController(service);
  });

  it('register llama al service sin actor', async () => {
    await controller.register({
      email: 'x@y.com',
      password: 'pw12345678',
      firstName: 'X',
      lastName: 'Y',
    });
    expect(service.register).toHaveBeenCalled();
  });

  it('login delega al service', async () => {
    await controller.login({ email: 'x@y.com', password: 'pw12345678' });
    expect(service.login).toHaveBeenCalled();
  });

  it('refresh delega al service', async () => {
    await controller.refresh({ refreshToken: 'rt' }, { sub: 'u-1', email: 'x@y.com' });
    expect(service.refresh).toHaveBeenCalled();
  });

  it('logout delega al service', async () => {
    await controller.logout(
      { refreshToken: 'rt' },
      { id: 'u-1', email: 'x@y.com', role: UserRole.PATIENT },
    );
    expect(service.logout).toHaveBeenCalledWith('u-1', 'rt');
  });

  it('me delega al service', async () => {
    await controller.me({ id: 'u-1', email: 'x@y.com', role: UserRole.PATIENT });
    expect(service.getCurrentUser).toHaveBeenCalledWith('u-1');
  });
});
