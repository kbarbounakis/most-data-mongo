import { DataError } from "@themost/common";

// noinspection JSUnusedGlobalSymbols
export class MongoDataObjectAssociationListener {
    /**
     *
     * @param {DataEventArgs} event
     */
    async beforeSaveAsync(event) {
        const context = event.model.context;
        // enumerate mapping
        const keys = Object.keys(event.target);
        // get mapping of type association where this model is child (foreign key associations)
        const mappings = keys.map( (key) => {
           return event.model.inferMapping(key);
        }).filter( mapping => {
            return (mapping && mapping.associationType==='association' && mapping.childModel===event.model.name);
        });
        for (let i = 0; i < mappings.length; i++) {
            const mapping = mappings[i];
            if (Object.prototype.hasOwnProperty.call(event.target, mapping.childField)) {
                const value = event.target[mapping.childField];
                if (value != null) {
                    const associatedModel = context.model(mapping.parentModel);
                    const associatedObject = await associatedModel
                        .find(value)
                        .select(mapping.parentField)
                        .getItem();
                    if (associatedObject == null) {
                        throw new DataError('E_DATA','An associated object cannot be found.',null,mapping.parentModel);
                    }
                    // set database reference
                    Object.defineProperty(event.target, mapping.childField, {
                        configurable: true,
                        enumerable: true,
                        value: {
                            "$ref" : associatedModel.sourceAdapter,
                            "$id" : associatedObject._id
                        }
                    });
                }
            }
        }
    }
    /**
     *
     * @param {DataEventArgs} event
     * @param {Function} callback
     */
    beforeSave(event, callback) {
        return MongoDataObjectAssociationListener.prototype.beforeSaveAsync(event).then (() => {
            return callback();
        }).catch( (err) => {
            return callback(err);
        });
    }
    /**
     *
     * @param {DataEventArgs} event
     */
    async afterSaveAsync(event) {
        //
    }
    /**
     *
     * @param {DataEventArgs} event
     * @param {Function} callback
     */
    afterSave(event, callback) {
        return MongoDataObjectAssociationListener.prototype.afterSaveAsync(event).then (() => {
            return callback();
        }).catch( (err) => {
            return callback(err);
        });
    }
}