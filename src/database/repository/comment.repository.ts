import { IComment } from "../../common/interfaces";
import { commentModel } from "../model";
import { DatabaseRepository } from "./base.repository";




export class CommentRepository extends DatabaseRepository<IComment> {

    constructor() {
        super(commentModel)
    }

}