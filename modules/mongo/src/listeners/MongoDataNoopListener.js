// noinspection JSUnusedGlobalSymbols
export class MongoDataNoopListener {
    /**
     *
     * @param {DataEventArgs} event
     * @param {Function} callback
     */
    beforeRemove(event, callback) {
        return callback();
    }
    /**
     *
     * @param {DataEventArgs} event
     * @param {Function} callback
     */
    afterRemove(event, callback) {
        return callback();
    }
    /**
     *
     * @param {DataEventArgs} event
     * @param {Function} callback
     */
    beforeSave(event, callback) {
        return callback();
    }
    /**
     *
     * @param {DataEventArgs} event
     * @param {Function} callback
     */
    afterSave(event, callback) {
        return callback();
    }
    /**
     *
     * @param {DataEventArgs} event
     * @param {Function} callback
     */
    beforeExecute(event, callback) {
        return callback();
    }
    /**
     *
     * @param {DataEventArgs} event
     * @param {Function} callback
     */
    afterExecute(event, callback) {
        return callback();
    }
}