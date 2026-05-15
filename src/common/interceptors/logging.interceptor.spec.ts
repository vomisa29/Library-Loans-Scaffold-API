import { CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import { of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let loggerLogSpy: jest.SpyInstance;

  beforeAll(() => {
    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterAll(() => {
    loggerLogSpy.mockRestore();
  });

  it('deja pasar la respuesta', (done) => {
    const interceptor = new LoggingInterceptor();
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ method: 'GET', url: '/x' }) }),
    } as ExecutionContext;
    const handler: CallHandler = { handle: () => of('ok') };
    interceptor.intercept(ctx, handler).subscribe({
      next: (val) => {
        expect(val).toBe('ok');
        done();
      },
    });
  });
});
