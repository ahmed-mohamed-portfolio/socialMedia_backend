"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const application_exceptions_1 = require("./../../common/exceptions/application.exceptions");
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../../common/enums");
const security_services_1 = require("../../common/services/security.services");
const email_events_1 = require("../../common/utils/email/email.events");
const { Schema } = mongoose_1.default;
const userSchema = new Schema({
    firstName: { type: String },
    lastName: { type: String },
    slug: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: false },
    profilePic: { type: String },
    profileCoverPic: [{ type: String }],
    password: {
        type: String,
        required: function () {
            return this.provider === 0 /* ProviderEnum.system */;
        }
    },
    dateOfBirth: { type: Date },
    gender: { type: String, default: enums_1.GenderEnum.male },
    role: { type: Number, default: 1 /* RoleEnum.user */ },
    provider: { type: Number, default: 0 /* ProviderEnum.system */ },
    confirmEmail: { type: Boolean, default: false },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
    credentialsUpdatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_USERS" // اسم Collection في MongoDB
});
userSchema
    .virtual("userName")
    .set(function (value) {
    let [firstName, lastName] = value.split(" ");
    this.firstName = firstName;
    this.lastName = lastName;
})
    .get(function () {
    return `${this.firstName} ${this.lastName}`;
});
userSchema.pre(["find", "findOne"], function () {
    const query = this.getQuery();
    // console.log("== query ==", query);
    // console.log("{ ...query }", { ...query });
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
});
userSchema.pre(["updateOne", "findOneAndUpdate"], function () {
    const update = this.getUpdate();
    console.log("update", update);
    if (update.deletedAt) {
        this.setUpdate({ ...update, $unset: { restoredAt: 1 } });
    }
    if (update.restoredAt) {
        this.setUpdate({ ...update, $unset: { deletedAt: 1 } });
        this.setQuery({ ...this.getQuery(), deletedAt: { $exists: true } });
    }
    const query = this.getQuery();
    console.log("query", query);
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ deletedAt: { $exists: false }, ...query });
    }
});
userSchema.pre(["deleteOne", "findOneAndDelete"], function () {
    const query = this.getQuery();
    console.log("query", query);
    if (query.force === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ deletedAt: { $exists: true }, ...query });
    }
});
userSchema.pre("save", async function () {
    console.log(this.modifiedPaths());
    console.log(this.isNew);
    this.wasNew = this.isNew;
    if (this.isModified('password')) {
        this.password = await new security_services_1.SecurityService().generateHash({ planText: this.password });
    }
    if (this.phone && this.isModified('phone')) {
        this.phone = await new security_services_1.SecurityService().generateEncryption(this.phone);
    }
});
userSchema.post('save', async function () {
    let that = this;
    if (that.wasNew && this.provider == 0 /* ProviderEnum.system */) {
        email_events_1.verifyEmailEvent.emit("verifyEmail", { userId: this._id, email: this.email });
    }
});
userSchema.pre("validate", function () {
    if (this.password && this.provider == 1 /* ProviderEnum.google */) {
        throw new application_exceptions_1.BadRequestException("google account cant hold password");
    }
});
userSchema.pre("validate", function () {
    this.slug = `${this.firstName} ${this.lastName}`.toLocaleLowerCase().replaceAll(/\s+/g, "-");
    if (!this.slug || this.slug.includes(" ")) {
        throw new application_exceptions_1.BadRequestException("invalid slug format");
    }
});
const userModel = mongoose_1.models.User || mongoose_1.default.model("User", userSchema);
exports.default = userModel;
