import { BadRequestException } from './../../common/exceptions/application.exceptions';
import mongoose, { models } from "mongoose"
import { IUser } from "../../common/interfaces"
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enums"

const { Schema } = mongoose

const userSchema = new Schema<IUser>({
    firstName: { type: String },
    lastName: { type: String },
    slug: { type: String },
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
    dateOfBirth: { type: Date },
    gender: { type: String, default: GenderEnum.male },
    role: { type: Number, default: RoleEnum.user },
    provider: { type: Number, default: ProviderEnum.system },
    confirmEmail: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    credentialsUpdatedAt: { type: Date, default: Date.now }
})

userSchema
    .virtual("userName")
    .set(function (value) {
        let [firstName, lastName] = value.split(" ")
        this.firstName = firstName
        this.lastName = lastName

        this.slug = value.replaceAll(/\s+/g, "-")
    })
    .get(function () {
        return `${this.firstName} ${this.lastName}`
    })



userSchema.pre("validate", function () {
    if (this.password && this.provider == ProviderEnum.google) {
        throw new BadRequestException("google account cant hold password")
    }
})

userSchema.pre("validate", function () {
    if (!this.slug || this.slug.includes(" ")) {
        throw new BadRequestException("invalid slug format")
    }
})

const userModel = models.User || mongoose.model<IUser>("User", userSchema)

export default userModel
