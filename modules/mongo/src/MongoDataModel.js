import {DataModel} from "@themost/data";
import {Args} from "@themost/common";

export class MongoDataModel extends DataModel {
    /**
     * @param {*} source
     */
    constructor(source) {
        super(source);
    }

    /**
     *
     * @param {*} value
     * @param {number=} state
     * @returns {any}
     */
    cast(value, state) {
        if (Array.isArray(value)) {
            return value.map( (item) => {
                return this.castOne(value, state);
            });
        }
        return this.castOne(value, state);
    }
    castOne(value, state) {
        const currentState = Number.isInteger(state) ? state: 1;
        Args.check([1, 2, 4].indexOf(currentState) >= 0, 'Current data object state is invalid.');
        const keys = this.attributes.filter( attribute => {
            // remove non-editable attributes
            if (state === 2 && Object.prototype.hasOwnProperty.call(attribute, 'editable') && attribute.editable === false) {
                return false;
            }
            if (attribute.many === true) {
                // get mapping
                const mapping  = this.inferMapping(attribute.name);
                // remove many-to-many association where this model is the child model
                // todo: validate this feature for mongo
                if (mapping.associationType === 'junction' && mapping.parentModel !== this.name) {
                    return false;
                }
                // remove one-to-many association where this model is the parent model
                if (mapping.associationType === 'association' && mapping.parentModel === this.name) {
                    return false;
                }
            }
            return true;
        }).map( attribute => {
            return attribute.name;
        });
        return keys.reduce((obj, key) => {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                obj[key] = value[key];
            }
            return obj;
        }, {});

    }

}