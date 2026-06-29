import { HydratedDocument, Model, PopulateOptions } from "mongoose";
import { IUser } from "../../common/interfaces";




export class DatabaseRepository {
    constructor(private model: Model<IUser>) {
        this.model = model
    }

    create(data: Partial<IUser>): Promise<HydratedDocument<IUser>> {
        return this.model.create(data)
    }

    findone(
        filter: Partial<IUser>
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
