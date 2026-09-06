import { HydratedDocument } from "mongoose";




export interface IPaginate<TRawDocs> {
    docs: HydratedDocument<TRawDocs>[],
    currentPage?: number | string | undefined,
    pages?: number | string,
    size?: number | string | undefined,
}
