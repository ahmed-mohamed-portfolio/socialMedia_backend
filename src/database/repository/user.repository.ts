import { IUser } from "../../common/interfaces";
import userModel from "../model/user.model";
import { DatabaseRepository } from "./base.repository";


export class UserRepository extends DatabaseRepository<IUser> {

    constructor() {
        super(userModel)
    }

}