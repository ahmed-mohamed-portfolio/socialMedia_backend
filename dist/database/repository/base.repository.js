"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
        this.model = model;
    }
    create(data) {
        return this.model.create(data);
    }
    findone(filter, select, populate) {
        let docs = this.model.findOne(filter);
        if (select) {
            docs = docs.select(select);
        }
        if (populate) {
            docs = docs.populate(populate);
        }
        return docs;
    }
}
exports.DatabaseRepository = DatabaseRepository;
