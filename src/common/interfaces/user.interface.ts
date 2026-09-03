import { Types } from 'mongoose';
import { GenderEnum, ProviderEnum, RoleEnum } from "../enums"

export interface IUser {
    userName: string
    firstName: string
    slug: string
    lastName: string
    email: string
    phone?: string
    profilePic?: string
    profileCoverPic?: string[]
    password: string
    gender?: GenderEnum
    role?: RoleEnum
    provider?: ProviderEnum
    confirmEmail: boolean
    deletedAt?: Date
    restoredAt?: Date
    dateOfBirth: Date
    credentialsUpdatedAt: Date
    friends?: Types.ObjectId[] | IUser[]
}
