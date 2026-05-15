/* eslint-disable prettier/prettier */
export class BusinessLogicException extends Error {
    constructor(message: string, public type: number) {
        super(message);
    }
}

export enum BusinessError {
    NOT_FOUND,
    PRECONDITION_FAILED,
    BAD_REQUEST
}