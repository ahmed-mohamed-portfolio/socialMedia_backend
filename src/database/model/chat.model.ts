import mongoose, { models, Types, UpdateQuery } from "mongoose"
import { IChat, IMessage, IUser } from "../../common/interfaces"
import { ChatEnum } from "../../common/enums"

const { Schema } = mongoose

const messageSchema = new Schema<IMessage>(
    {
        content: {
            type: String,
            required: function (this) {
                return !this.attachments?.length;
            }
        },

        attachments: { type: [String] },

        likes: [
            {
                type: Types.ObjectId,
                ref: "User"
            }
        ],

        tags: [
            {
                type: Types.ObjectId,
                ref: "User"
            }
        ],

        createdBy: {
            type: Types.ObjectId,
            ref: "User",
            required: true
        },

        deletedAt: { type: Date },
        restoredAt: { type: Date }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        strict: true,
        strictQuery: true
    }
);

const chatSchema = new Schema<IChat>(
    {
        participants: [
            {
                type: Types.ObjectId,
                ref: "User",
                required: true
            }
        ],

        type: {
            type: String,
            enum: ChatEnum,
            default: ChatEnum.ovo
        },

        // OVM
        group: {
            type: String,
            required: function (this) {
                return this.type == ChatEnum.ovm;
            }
        },

        roomId: {
            type: String,
            required: function (this) {
                return this.type == ChatEnum.ovm;
            }
        },

        group_image: {
            type: String
        },

        messages: {
            type: [messageSchema],
            required: true
        },

        createdBy: {
            type: Types.ObjectId,
            ref: "User",
            required: true
        },

        deletedAt: { type: Date },
        restoredAt: { type: Date }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        strict: true,
        strictQuery: true,
        collection: "SOCIAL_APP_CHATS"
    }
);


chatSchema.pre(["find", "findOne"], function () {
    const query = this.getQuery()
    // console.log("== query ==", query);
    // console.log("{ ...query }", { ...query });

    if (query.paranoid === false) {
        this.setQuery({ ...query })
    } else {
        this.setQuery({ ...query, deletedAt: { $exists: false } })

    }
})

chatSchema.pre(["updateOne", "findOneAndUpdate"], function () {


    const update = this.getUpdate() as UpdateQuery<IChat>
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

chatSchema.pre(["deleteOne", "findOneAndDelete"], function () {


    const query = this.getQuery()
    // console.log("query", query);

    if (query.force === false) {
        this.setQuery({ ...query })
    } else {
        this.setQuery({ deletedAt: { $exists: true }, ...query })

    }
})


export const chatModel = models.chat || mongoose.model<IChat>("chat", chatSchema)

chatModel.syncIndexes()