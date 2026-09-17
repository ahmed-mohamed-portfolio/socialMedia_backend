import mongoose, { models, Types, UpdateQuery } from "mongoose"
import { IComment, IUser } from "../../common/interfaces"

const { Schema } = mongoose


const commentSchema = new Schema<IComment>(
    {

        content: {
            type: String,
            required: function (this) {
                return !this.attachments?.length
            }
        },

        attachments: { type: [String] },

        postId: { type: Types.ObjectId, required: true, ref: "Post" },

        commentId: { type: Types.ObjectId, ref: "Comment" },

        likes: [{ type: Types.ObjectId, ref: "User" }],

        tags: [{ type: Types.ObjectId, ref: "User" }],

        updatedBy: {
            type: Types.ObjectId,
            ref: "User"
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
        collection: "SOCIAL_APP_COMMENTS"
    }
)

commentSchema.virtual("reply", {
    localField: '_id',
    foreignField: "commentId",
    ref: "Comment"
})

commentSchema.pre(["find", "findOne"], function () {
    const query = this.getQuery()
    // console.log("== query ==", query);
    // console.log("{ ...query }", { ...query });

    if (query.paranoid === false) {
        this.setQuery({ ...query })
    } else {
        this.setQuery({ ...query, deletedAt: { $exists: false } })

    }
})

commentSchema.pre(["updateOne", "findOneAndUpdate"], function () {


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
    console.log("query", query);

    if (query.paranoid === false) {
        this.setQuery({ ...query })
    } else {
        this.setQuery({ deletedAt: { $exists: false }, ...query })

    }
})

commentSchema.pre(["deleteOne", "findOneAndDelete"], function () {


    const query = this.getQuery()
    console.log("query", query);

    if (query.force === false) {
        this.setQuery({ ...query })
    } else {
        this.setQuery({ deletedAt: { $exists: true }, ...query })

    }
})


export const commentModel = models.Comment || mongoose.model<IComment>("Comment", commentSchema)

commentModel.syncIndexes()