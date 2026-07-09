import mongoose from "mongoose"
import { IUser } from "../../common/interfaces"
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enums"
const { Schema } = mongoose

const userSchema = new Schema<IUser>({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    profilePic: { type: String },
    profileCoverPic: [{ type: String }],
    password: {
        type: String,
        required: function (this) {
            return this.provider === ProviderEnum.system
        }
    },
    gender: { type: Number, default: GenderEnum.male },
    role: { type: Number, default: RoleEnum.user },
    provider: { type: Number, default: ProviderEnum.system },
    confirmEmail: { type: Boolean, default: false }
})

userSchema
    .virtual("userName")
    .set(function (value) {
        let [firstName, lastName] = value.split(" ")
        this.firstName = firstName
        this.lastName = lastName
    })
    .get(function () {
        return `${this.firstName} ${this.lastName}`
    })

const userModel = mongoose.model<IUser>("User", userSchema)

export default userModel
