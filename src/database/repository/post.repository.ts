import { IPost } from "../../common/interfaces";
import { postModel } from "../model";
import { DatabaseRepository } from "./base.repository";




export class PostRepository extends DatabaseRepository<IPost> {

    constructor() {
        super(postModel)
    }

}