import { BadRequestException } from './../../common/exceptions/application.exceptions';
import mongoose, { HydratedDocument, models, Types, UpdateQuery } from "mongoose"
import { IUser } from "../../common/interfaces"
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enums"
import { SecurityService } from '../../common/services/security.services';
import { verifyEmailEvent } from '../../common/utils/email/email.events';


const { Schema } = mongoose

const userSchema = new Schema<IUser>({
    firstName: { type: String },
    lastName: { type: String },
    slug: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: false },
    profilePic: { type: String },
    profileCoverPic: [{ type: String }],
    password: {
        type: String,
        required: function (this) {
            return this.provider === ProviderEnum.system
        }
    },
    friends: [
        {
            type: Types.ObjectId, // هخزن ID
            ref: "User"           // الـ ID ده تابع لـ User
        }
    ],
    dateOfBirth: { type: Date },
    gender: { type: String, default: GenderEnum.male },
    role: { type: Number, default: RoleEnum.user },
    provider: { type: Number, default: ProviderEnum.system },
    confirmEmail: { type: Boolean, default: false },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
    credentialsUpdatedAt: { type: Date, default: Date.now }
},
    {
        timestamps: true,              // createdAt + updatedAt تلقائي
        toObject: { virtuals: true }, // أظهر virtuals في toObject()
        toJSON: { virtuals: true },   // أظهر virtuals في JSON
        strict: true,                 // تجاهل/امنع fields الغير موجودة في Schema أثناء الحفظ
        strictQuery: true,            // strict behavior على fields الموجودة في filter
        collection: "SOCIAL_APP_USERS" // اسم Collection في MongoDB
    }
)

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




userSchema.pre(["find", "findOne"], function () {
    const query = this.getQuery()
    // console.log("== query ==", query);
    // console.log("{ ...query }", { ...query });

    if (query.paranoid === false) {
        this.setQuery({ ...query })
    } else {
        this.setQuery({ ...query, deletedAt: { $exists: false } })

    }
})

userSchema.pre(["updateOne", "findOneAndUpdate"], function () {


    const update = this.getUpdate() as UpdateQuery<IUser>
    // console.log("update", update);

    if (update.deletedAt) {
        this.setUpdate({ ...update, $unset: { restoredAt: 1 } })
    }

    if (update.restoredAt) {
        this.setUpdate({ ...update, $unset: { deletedAt: 1 } })
        this.setQuery({ ...this.getQuery(), deletedAt: { $exists: true } })
    }



    const query = this.getQuery()
    // console.log("query", query);

    if (query.paranoid === false) {
        this.setQuery({ ...query })
    } else {
        this.setQuery({ deletedAt: { $exists: false }, ...query })

    }
})

userSchema.pre(["deleteOne", "findOneAndDelete"], function () {


    const query = this.getQuery()
    // console.log("query", query);

    if (query.force === false) {
        this.setQuery({ ...query })
    } else {
        this.setQuery({ deletedAt: { $exists: true }, ...query })

    }
})

userSchema.pre("save", async function (this: HydratedDocument<IUser> & { wasNew: boolean }) {

    // console.log(this.modifiedPaths());
    // console.log(this.isNew);
    this.wasNew = this.isNew
    if (this.isModified('password')) {
        this.password = await new SecurityService().generateHash({ planText: this.password })
    }

    if (this.phone && this.isModified('phone')) {
        this.phone = await new SecurityService().generateEncryption(this.phone)
    }

})

userSchema.post('save', async function () {

    let that = this as HydratedDocument<IUser> & { wasNew: boolean }
    if (that.wasNew && this.provider == ProviderEnum.system) {

        verifyEmailEvent.emit("verifyEmail", { userId: this._id, email: this.email })

    }

})

userSchema.pre("validate", function () {
    if (this.password && this.provider == ProviderEnum.google) {
        throw new BadRequestException("google account cant hold password")
    }
})

userSchema.pre("validate", function () {
    this.slug = `${this.firstName} ${this.lastName}`.toLocaleLowerCase().replaceAll(/\s+/g, "-")

    if (!this.slug || this.slug.includes(" ")) {
        throw new BadRequestException("invalid slug format")
    }
})

const userModel = models.User || mongoose.model<IUser>("User", userSchema)

export default userModel
