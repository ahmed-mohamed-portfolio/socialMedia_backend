import { HydratedDocument, Model, PopulateOptions } from "mongoose";
import { IUser } from "../../common/interfaces";




export class DatabaseRepository<TRawDocs> {
    constructor(private model: Model<TRawDocs>) {
        this.model = model
    }

    create(data: Partial<TRawDocs>): Promise<HydratedDocument<TRawDocs>> {
        return this.model.create(data)
    }

    findone(
        filter: Partial<TRawDocs>
        , select?: string | Record<string, 0 | 1>
        , populate?: PopulateOptions | PopulateOptions[]
    ) {
        let docs = this.model.findOne(filter)
        if (select) {
            docs = docs.select(select)
        }
        if (populate) {
            docs = docs.populate(populate)
        }

        return docs

    }
}
