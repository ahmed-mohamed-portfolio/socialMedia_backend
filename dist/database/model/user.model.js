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
const { Schema } = mongoose_1.default;
const userSchema = new Schema({
    firstName: { type: String },
    lastName: { type: String },
    slug: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
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
    createdAt: { type: Date, default: Date.now },
    credentialsUpdatedAt: { type: Date, default: Date.now }
});
userSchema
    .virtual("userName")
    .set(function (value) {
    let [firstName, lastName] = value.split(" ");
    this.firstName = firstName;
    this.lastName = lastName;
    this.slug = value.replaceAll(/\s+/g, "-");
})
    .get(function () {
    return `${this.firstName} ${this.lastName}`;
});
userSchema.pre("validate", function () {
    if (this.password && this.provider == 1 /* ProviderEnum.google */) {
        throw new application_exceptions_1.BadRequestException("google account cant hold password");
    }
});
userSchema.pre("validate", function () {
    if (!this.slug || this.slug.includes(" ")) {
        throw new application_exceptions_1.BadRequestException("invalid slug format");
    }
});
const userModel = mongoose_1.models.User || mongoose_1.default.model("User", userSchema);
exports.default = userModel;
