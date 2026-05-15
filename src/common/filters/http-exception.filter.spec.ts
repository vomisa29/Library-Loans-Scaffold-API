import { ArgumentsHost, BadRequestException, HttpStatus, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let response: any;
  let host: ArgumentsHost;
  let loggerErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterAll(() => {
    loggerErrorSpy.mockRestore();
  });

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ url: '/api/test', method: 'GET' }),
      }),
    } as ArgumentsHost;
  });

  it('serializa HttpException con string como mensaje', () => {
    filter.catch(new BadRequestException('mensaje plano'), host);
    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, message: 'mensaje plano' }),
    );
  });

  it('serializa HttpException con body objeto', () => {
    filter.catch(
      new BadRequestException({ message: ['err1', 'err2'], error: 'Bad Request' }),
      host,
    );
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: ['err1', 'err2'], error: 'Bad Request' }),
    );
  });

  it('cae a 500 ante errores genéricos', () => {
    filter.catch(new Error('boom'), host);
    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, message: 'boom' }),
    );
  });

  it('maneja exception desconocida', () => {
    filter.catch('plain string error', host);
    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
