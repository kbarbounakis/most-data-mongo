// noinspection JSUnusedGlobalSymbols
export class MongoDataNestedObjectListener {
    async beforeSaveAsync(event) {

    }
    /**
     *
     * @param {DataEventArgs} event
     * @param {Function} callback
     */
    beforeSave(event, callback) {
        return callback();
    }
    async afterSaveAsync(event) {

    }
    /**
     *
     * @param {DataEventArgs} event
     * @param {Function} callback
     */
    afterSave(event, callback) {
        return callback();
    }
}