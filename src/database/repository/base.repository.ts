import { HydratedDocument, Model, PopulateOptions, QueryFilter, UpdateQuery } from "mongoose"
import { IPaginate } from "../../common/interfaces/pagination.inteface"

type Select = string | Record<string, 0 | 1>

type Options = {
    populate?: PopulateOptions | PopulateOptions[]
    sort?: any
    skip?: number
    limit?: number
    lean?: boolean
    session?: any
    new?: boolean
}

export class DatabaseRepository<TRawDocs> {
    constructor(private model: Model<TRawDocs>) { }

    private applyQueryOptions(query: any, select?: Select, options: Options = {}) {
        if (select) {
            query.select(select)
        }

        if (options.populate) {
            query.populate(options.populate)
        }

        if (options.sort) {
            query.sort(options.sort)
        }

        if (options.skip !== undefined) {
            query.skip(options.skip)
        }

        if (options.limit !== undefined) {
            query.limit(options.limit)
        }

        if (options.lean) {
            query.lean()
        }

        if (options.session) {
            query.session(options.session)
        }

        return query
    }

    create(data: Partial<TRawDocs>): Promise<HydratedDocument<TRawDocs>> {
        return this.model.create(data)
    }

    insertOne(data: Partial<TRawDocs>, options: Options = {}) {
        const doc = new this.model(data)

        return doc.save(options)
    }

    insertMany(data: Partial<TRawDocs>[] = [], options: Options = {}) {
        return this.model.insertMany(data, options)
    }

    findOne(filter: QueryFilter<TRawDocs> = {}, select?: Select, options: Options = {}) {
        const query = this.model.findOne(filter, null, options)

        return this.applyQueryOptions(query, select, options)
    }

    findone(filter: QueryFilter<TRawDocs> = {}, select?: Select, populate?: PopulateOptions | PopulateOptions[]) {
        return this.findOne(filter, select, { populate })
    }

    find(filter: QueryFilter<TRawDocs> = {}, select?: Select, options: Options = {}) {
        const query = this.model.find(filter, null, options)

        return this.applyQueryOptions(query, select, options)
    }


    async paginate(filter: QueryFilter<TRawDocs> = {}, select?: Select, options: Options = {}, page: number | string | undefined = 0, size: number | string | undefined = 5): Promise<IPaginate<TRawDocs>> {

        let count: number = -1
        if (Number(page) > 0) {
            page = parseInt(page as string)
            size = parseInt(size as string)

            options.limit = size
            options.skip = (page - 1) * size

            count = await this.model.countDocuments(filter)
        }

        const docs = await this.find(filter, select, options)

        return {
            docs,
            ...(Number(page) > 0 ? {
                currentPage: page,
                size,
                pages: Math.ceil(count / Number(size))
            }
                : {})
        }
    }

    findById(id: string, select?: Select, options: Options = {}) {
        const query = this.model.findById(id, null, options)

        return this.applyQueryOptions(query, select, options)
    }

    updateOne(filter: QueryFilter<TRawDocs> = {}, data: UpdateQuery<TRawDocs> = {}, options: Options = {}) {
        return this.model.updateOne(filter, { ...data, $inc: { ...data.$inc, __v: 1 } }, options)
    }

    updateMany(filter: QueryFilter<TRawDocs> = {}, data: UpdateQuery<TRawDocs> = {}, options: Options = {}) {
        return this.model.updateMany(filter, { ...data, $inc: { ...data.$inc, __v: 1 } }, options)
    }

    findOneAndUpdate(filter: QueryFilter<TRawDocs> = {}, data: UpdateQuery<TRawDocs> = {}, select?: Select, options: Options = {}) {
        const query = this.model.findOneAndUpdate(filter, { ...data, $inc: { ...data.$inc, __v: 1 } }, { ...options, new: options.new ?? true })

        return this.applyQueryOptions(query, select, options)
    }

    findByIdAndUpdate(id: string, data: UpdateQuery<TRawDocs> = {}, select?: Select, options: Options = {}) {
        const query = this.model.findByIdAndUpdate(id, { ...data, $inc: { ...data.$inc, __v: 1 } }, { ...options, new: options.new ?? true })

        return this.applyQueryOptions(query, select, options)
    }

    deleteOne(filter: QueryFilter<TRawDocs> = {}, options: Options = {}) {
        return this.model.deleteOne(filter, options)
    }

    deleteMany(filter: QueryFilter<TRawDocs> = {}, options: Options = {}) {
        return this.model.deleteMany(filter, options)
    }

    findOneAndDelete(filter: QueryFilter<TRawDocs> = {}, select?: Select, options: Options = {}) {
        const query = this.model.findOneAndDelete(filter, options)

        return this.applyQueryOptions(query, select, options)
    }

    findByIdAndDelete(id: string, select?: Select, options: Options = {}) {
        const query = this.model.findByIdAndDelete(id, options)

        return this.applyQueryOptions(query, select, options)
    }

    countDocuments(filter: QueryFilter<TRawDocs> = {}, options: Options = {}) {
        return this.model.countDocuments(filter, options)
    }

    exists(filter: QueryFilter<TRawDocs> = {}) {
        return this.model.exists(filter)
    }
}
