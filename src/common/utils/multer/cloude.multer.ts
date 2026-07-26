import { StorageApproachEnum } from './../../enums/multer.enum';
import type { Request } from 'express';
import multer from 'multer'
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os'
import { fileFilter } from './validation.multer';

export const cloudeFileUpload = (

    { StorageApproach = StorageApproachEnum.MEMORY, validation = [], maxSize = 2 }: { StorageApproach?: StorageApproachEnum, validation?: string[], maxSize: number }
) => {

    const storage: multer.StorageEngine = (StorageApproach == StorageApproachEnum.MEMORY) ? multer.memoryStorage() : multer.diskStorage({
        destination(req: Request, file: Express.Multer.File, callback: (error: Error | null, destination: string) => void) {
            callback(null, tmpdir())
        }
        ,
        filename(req: Request, file: Express.Multer.File, callback: (error: Error | null, destination: string) => void) {
            callback(null, `${randomUUID()}__${file.originalname}`)
        }
    })

    return multer({ fileFilter: fileFilter(validation), storage, limits: { fileSize: maxSize * 1024 * 1024 } })
}

