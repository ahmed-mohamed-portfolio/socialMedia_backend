"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const userSchema = new Schema({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    profilePic: { type: String },
    profileCoverPic: [{ type: String }],
    password: {
        type: String, required: function () {
            return this.provider === 0 /* ProviderEnum.system */;
        }
    },
    gender: { type: Number, default: 0 /* GenderEnum.male */ },
    role: { type: Number, default: 1 /* RoleEnum.user */ },
    provider: { type: Number, default: 0 /* ProviderEnum.system */ },
    confirmEmail: { type: Boolean }
});
userSchema.virtual('userName').set(function (value) {
    let [firstName, lastName] = value.split(' ');
    this.firstName = firstName;
    this.lastName = lastName;
}).get(function () {
    return `${this.firstName} ${this.lastName}`;
});
const userModel = mongoose_1.default.model('User', userSchema);
exports.default = userModel;
