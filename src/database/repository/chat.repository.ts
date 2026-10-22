import { PopulateOptions, QueryFilter } from "mongoose";
import { IChat } from "../../common/interfaces";
import { chatModel } from "../model";
import { DatabaseRepository } from "./base.repository";


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


export class ChatRepository extends DatabaseRepository<IChat> {

    constructor() {
        super(chatModel)
    }


    findOneChat(filter: QueryFilter<IChat> = {}, select?: Select, options: Options = {}, page?: string | number, size?: string | number) {

        page = parseInt(page as string)
        size = parseInt(size as string)

        const query = this.model.findOne(filter, { messages: { $slice: [-(page * size), size] } }, options)

        return this.applyQueryOptions(query, select, options)
    }

}