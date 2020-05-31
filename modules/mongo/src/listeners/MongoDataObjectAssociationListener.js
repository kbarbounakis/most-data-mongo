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
        // get mappings of type association where this model is child (foreign key associations)
        // and nested property is false
        let mappings = keys.filter( key => {
            const attribute = event.model.getAttribute(key);
            return attribute && !attribute.nested;
        }).map( (key) => {
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
                        value: associatedObject[mapping.parentField]
                    });
                }
            }
        }
        // get mappings of type junction where this model is parent (foreign key associations)
        // and nested property is false
        mappings = keys.filter( key => {
            const attribute = event.model.getAttribute(key);
            return attribute && !attribute.nested;
        }).map( (key) => {
            return event.model.inferMapping(key);
        }).filter( mapping => {
            return (mapping && mapping.associationType==='junction'
                && mapping.parentModel === event.model.name);
        });
        for (let i = 0; i < mappings.length; i++) {
            // get mapping
            const junction = mappings[i];
            if (Object.prototype.hasOwnProperty.call(event.target, junction.refersTo)) {
                /**
                 * get array of values
                 * @type {Array}
                 */
                const values = event.target[junction.refersTo];
                if (values && values.length) {
                    // get associated model
                    const associatedModel = context.model(junction.childModel);
                    for (let j = 0; j < values.length; j++) {
                        const value = values[j];
                        // find associated object
                        const associatedObject = await associatedModel
                            .find(value)
                            .select(junction.childField)
                            .getItem();
                        // throw error if null
                        if (associatedObject == null) {
                            throw new DataError('E_DATA','An associated object cannot be found.',null,mapping.parentModel);
                        }
                        // set current value as object reference
                        values[j] = associatedObject[junction.childField];
                    }
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
        const context = event.model.context;
        // enumerate mapping
        const keys = Object.keys(event.target);
        // get mappings of type junction where this model is child (foreign key associations)
        // and nested property is false
        let mappings = keys.filter( key => {
            const attribute = event.model.getAttribute(key);
            return attribute && !attribute.nested;
        }).map( (key) => {
            return event.model.inferMapping(key);
        }).filter( mapping => {
            return (mapping && mapping.associationType==='junction' && mapping.childModel === event.model.name);
        });
        for (let i = 0; i < mappings.length; i++) {
            /**
             * @type {DataAssociationMapping|*}
             */
            const junction = mappings[i];
            // get associated model
            const associatedModel = context.model(junction.parentModel);
            const junctionModel = context.model(junction.associationAdapter);
            Args.notNull(associatedModel, 'Parent model');
            if (Object.prototype.hasOwnProperty.call(event.target, junction.refersTo)) {
                /**
                 * get array of values
                 * @type {Array}
                 */
                const values = event.target[junction.refersTo];
                if (values && values.length) {
                    for (let j = 0; j < values.length; j++) {
                        const value = values[j];
                        // find associated object
                        const associatedObject = await associatedModel
                            .find(value)
                            .select(junction.refersTo)
                            .getItem();
                        // throw error if null
                        if (associatedObject == null) {
                            throw new DataError('E_DATA','An associated object cannot be found.',null,mapping.parentModel);
                        }
                        // set current value as object reference
                        values[j] = associatedObject._id;
                    }
                }
            }
        }
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