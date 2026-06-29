"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    applyQueryOptions(query, select, options = {}) {
        if (select) {
            query.select(select);
        }
        if (options.populate) {
            query.populate(options.populate);
        }
        if (options.sort) {
            query.sort(options.sort);
        }
        if (options.skip !== undefined) {
            query.skip(options.skip);
        }
        if (options.limit !== undefined) {
            query.limit(options.limit);
        }
        if (options.lean) {
            query.lean();
        }
        if (options.session) {
            query.session(options.session);
        }
        return query;
    }
    create(data) {
        return this.model.create(data);
    }
    insertOne(data, options = {}) {
        const doc = new this.model(data);
        return doc.save(options);
    }
    insertMany(data = [], options = {}) {
        return this.model.insertMany(data, options);
    }
    findOne(filter = {}, select, options = {}) {
        const query = this.model.findOne(filter, null, options);
        return this.applyQueryOptions(query, select, options);
    }
    findone(filter = {}, select, populate) {
        return this.findOne(filter, select, { populate });
    }
    find(filter = {}, select, options = {}) {
        const query = this.model.find(filter, null, options);
        return this.applyQueryOptions(query, select, options);
    }
    findById(id, select, options = {}) {
        const query = this.model.findById(id, null, options);
        return this.applyQueryOptions(query, select, options);
    }
    updateOne(filter = {}, data = {}, options = {}) {
        return this.model.updateOne(filter, data, options);
    }
    updateMany(filter = {}, data = {}, options = {}) {
        return this.model.updateMany(filter, data, options);
    }
    findOneAndUpdate(filter = {}, data = {}, select, options = {}) {
        const query = this.model.findOneAndUpdate(filter, data, options);
        return this.applyQueryOptions(query, select, options);
    }
    findByIdAndUpdate(id, data = {}, select, options = {}) {
        const query = this.model.findByIdAndUpdate(id, data, options);
        return this.applyQueryOptions(query, select, options);
    }
    deleteOne(filter = {}, options = {}) {
        return this.model.deleteOne(filter, options);
    }
    deleteMany(filter = {}, options = {}) {
        return this.model.deleteMany(filter, options);
    }
    findOneAndDelete(filter = {}, select, options = {}) {
        const query = this.model.findOneAndDelete(filter, options);
        return this.applyQueryOptions(query, select, options);
    }
    findByIdAndDelete(id, select, options = {}) {
        const query = this.model.findByIdAndDelete(id, options);
        return this.applyQueryOptions(query, select, options);
    }
    countDocuments(filter = {}, options = {}) {
        return this.model.countDocuments(filter, options);
    }
    exists(filter = {}) {
        return this.model.exists(filter);
    }
}
exports.DatabaseRepository = DatabaseRepository;
