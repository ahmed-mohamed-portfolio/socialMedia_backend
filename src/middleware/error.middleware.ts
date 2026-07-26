import type { NextFunction, Request, Response } from 'express';


interface IError extends Error {
    status: number
}

export const globalErrorHandler = (err: IError, req: Request, res: Response, next: NextFunction) => {

    if (err.name == 'MulterError') {
        err.status = 400
    }

    return res.status(err.status || 500).json({
        message: err.message,
        stack: err.stack,
        cause: err.cause || null,
        err
    })
}