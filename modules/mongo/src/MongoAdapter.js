/**
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */


import {MongoFormatter} from "./MongoFormatter";
import {MongoClient} from "mongodb";

/**
 * @param {{$insert:*}|*} query
 * @returns {Promise}
 * @private
 */
function executeInsert(query) {
    const self = this;
    return new Promise((resolve, reject) => {
        //get first property of $insert
        const entity = Object.keys(query.$insert)[0];
        if (entity == null) {
            return reject('Invalid insert expression. Entity may not be null');
        }
        self.open(function (err) {
            if (err) {
                return reject(err);
            }
            /**
             * @type {Db|*}
             */
            const db = self.rawConnection;
            return db.collection(entity, {strict: false}, function (err, collection) {
                if (err) {
                    return reject(err);
                }
                const formatter = new MongoFormatter(collection);
                /**
                 * @type {*}
                 */
                const obj = formatter.formatInsert(query);
                if (Array.isArray(obj)) {
                    // noinspection JSUnresolvedFunction
                    return collection.insertMany(obj, function (err, result) {
                        if (err) {
                            return reject(err);
                        }
                        return resolve(result.ops);
                    });
                } else if (typeof obj === 'object') {
                    // noinspection JSUnresolvedFunction
                    return collection.insertOne(obj, function (err, result) {
                        if (err) {
                            return reject(err);
                        }
                        return resolve(result.ops && result.ops[0]);
                    });
                } else {
                    return reject(new Error('Invalid insert object. Expected an object or an array of objects'));
                }
            });
        });
    });

}

/**
 * @param {{$delete:*,$where:*}|*} query
 * @returns {Promise}
 * @private
 */
function executeDelete(query) {
    const self = this;
    return new Promise((resolve, reject) => {
        //get first property of $delete
        const entity = query.$delete;
        if (entity == null) {
            return reject('Invalid delete expression. Entity may not be null');
        }
        if (query.$where == null) {
            return reject('Invalid delete expression. Query may not be null');
        }
        self.open(function (err) {
            if (err) {
                return reject(err);
            }
            /**
             * @type {Db|*}
             */
            const db = self.rawConnection;
            return db.collection(entity, {strict: false}, function (err, collection) {
                if (err) {
                    return reject(err);
                }
                const formatter = new MongoFormatter(collection);
                const where = formatter.formatDelete(query);
                return collection.removeMany(where, function (err, result) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(result);
                });
            });
        });
    });
}

/**
 * @param {{$update:*,$where:*}|*} query
 * @returns {Promise}
 * @private
 */
function executeUpdate(query) {
    const self = this;
    return new Promise((resolve, reject) => {
        //get first property of $update
        const entity = Object.keys(query.$update)[0];
        if (entity == null) {
            return reject('Invalid update expression. Entity may not be null');
        }
        if (query.$where == null) {
            return reject('Invalid update expression. Query may not be null');
        }
        self.open(function (err) {
            if (err) {
                return reject(err);
            }
            /**
             * @type {Db|*}             */
            const db = self.rawConnection;
            return db.collection(entity, {strict: false}, function (err, collection) {
                if (err) {
                    return reject(err);
                }
                const formatter = new MongoFormatter(collection);
                const obj = formatter.formatUpdate(query);
                if (typeof obj === 'object') {
                    const filter = formatter.formatWhere(query.$where);
                    const update = {
                        $set: obj
                    };
                    // noinspection JSUnresolvedFunction
                    return collection.updateMany(filter, update, function (err, result) {
                        if (err) {
                            return reject(err);
                        }
                        return resolve(result);
                    });
                } else {
                    return reject(new Error('Invalid update object. Expected an object or an array of objects'));
                }
            });
        });
    });
}



/**
 * @param {{$select:*,$where:*}|*} query
 * @returns {Promise}
 * @private
 */
function executeSelect(query) {
    const self = this;
    return new Promise( (resolve, reject) => {
        //get first property of $update
        const entity = Object.keys(query.$select)[0];
        if (entity == null) {
            return reject('Invalid select expression. Entity may not be null');
        }
        self.open(function (err) {
            if (err) {
                return reject(err);
            }
            /**
             * @type {Db|*}
             */
            const db = self.rawConnection;
            return db.collection(entity, {strict: false}, function (err, collection) {
                const formatter = new MongoFormatter(collection);
                return formatter.formatLimitSelect(query).toArray(function (err, result) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(result);
                });
            });
        });
    });
}


/**
 *
 */
export class MongoAdapter {
    /**
     *
     * @param {MongoAdapterOptions} options
     */
    constructor(options) {
        if (options == null) {
            throw new Error('Connection options may not be null.');
        }
        let connectionURL_ = 'mongodb://';
        if (options.user && options.user.length) {
            connectionURL_ += options.user;
            connectionURL_ += ':' + (options.password || '') + '@';
        }
        connectionURL_ += options.host || '127.0.0.1';
        connectionURL_ += ':' + (options.port || 27017);

        if (options.database == null) {
            throw new Error('Connection database may not be null.');
        }
        // finalize connection url
        connectionURL_ += '/' + (options.authenticationDatabase ? options.authenticationDatabase : options.database);

        options.options = options.options || {};
        Object.assign(options.options, {
            "useNewUrlParser": true
        });

        Object.defineProperty(options.options, 'db', {
            value: options.database,
            configurable: false,
            enumerable: false
        });

        Object.defineProperty(this, 'connectionURL', {
            value: connectionURL_,
            configurable: false,
            enumerable: false
        });

        Object.defineProperty(this, 'connectionOptions', {
            value: options.options,
            configurable: false,
            enumerable: false
        });

    }

    // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    /**
     * @param name
     * @param query
     * @param callback
     * @returns {*}
     */
    createView(name, query, callback) {
        callback = callback || function () {
        };
        return callback();
    }

    /**
     * Opens a database connection
     * @param {MongoAdapterExecuteCallback} callback
     */
    open(callback) {
        if (this.rawConnection != null) {
            //the connection is already opened
            return callback();
        }
        const self = this;
        const connectionOptions = this.connectionOptions;
        MongoClient.connect(this.connectionURL, connectionOptions, function (err, mongoClient) {
            if (err) {
                return callback(err);
            }
            self.rawConnection = mongoClient.db(connectionOptions.db);
            return callback();
        });
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Opens database connection
     * @returns {Promise<*>}
     */
    openAsync() {
        return new Promise((resolve, reject) => {
            return this.open( err => {
                if (err) {
                    return reject(err);
                }
                return resolve();
            })
        });
    }

    /**
     * Closes database connection
     * @param {Function} callback
     */
    close(callback) {
        if (this.rawConnection == null) {
            //the connection is already closed
            return callback();
        }
        const self = this;
        try {
            self.rawConnection.close(true);
            process.nextTick(function () {
                delete self.rawConnection;
                return callback();
            });
        } catch (err) {
            delete self.rawConnection;
            return callback();
        }
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Closes database connection
     * @returns {Promise<*>}
     */
    closeAsync() {
        return new Promise((resolve, reject) => {
            return this.close( err => {
                if (err) {
                    return reject(err);
                }
                return resolve();
            })
        });
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {*} migrationScheme - An object that represents the data model migrationScheme we want to migrate
     * @param {Function} callback - A callback function
     */
    migrate(migrationScheme, callback) {
        let self = this;
        self.open(function (err) {
            if (err) {
                return callback(err);
            }
            let counter = migrationScheme.add.find(function (x) {
                return x.type === 'Counter';
            });
            if (counter) {
                // add default counter if any
                return self.rawConnection.collection('counters', function (err) {
                    if (err) {
                        return callback(err);
                    }
                    self.counters = self.counters || [];
                    if (typeof self.counters.find(function (x) {
                        return (x.entity === migrationScheme.appliesTo) && (x.attribute === counter.name);
                    }) === 'undefined') {
                        self.counters.push({entity: migrationScheme.appliesTo, attribute: counter.name});
                    }
                    return callback(null, true);
                });
            }
            return callback(null, true);
        });
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {*} migration
     */
    migrateAsync(migration) {
        return new Promise((resolve, reject) => {
            return this.migrate(migration, (err) => {
                if (err) {
                    return reject(err);
                }
                return resolve();
            })
        });
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Produces a new identity value for the given entity and attribute.
     * @param entity {String} The target entity name
     * @param attribute {String} The target attribute
     * @param callback {Function}
     */
    selectIdentity(entity, attribute, callback) {
        let self = this;
        self.open(function (err) {
            if (err) {
                return callback(err);
            }
            return self.rawConnection.collection('counters', null, function (err, counters) {
                if (err) {
                    return callback(err);
                }
                let doc = {entity: entity, attribute: attribute};
                counters.findOneAndUpdate(doc, {$inc: {seq: 1}}, {
                    returnOriginal: false,
                    upsert: true
                }, function (err, result) {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, result.value.seq);
                });
            });
        });
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Produces a new identity value for the given entity and attribute.
     * @param {string} entity The target entity name
     * @param {string} attribute The target attribute
     * @returns Promise<*>
     */
    selectIdentityAsync(entity, attribute) {
        return new Promise((resolve, reject) => {
            return this.selectIdentity(entity, attribute, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            })
        });
    }

    /**
     * Executes the given query against the underlying database.
     * @param {*} query - A query expression to execute.
     * @param {*} values - An object which represents the named parameters that are going to used during query parsing
     * @param {Function} callback - A callback function where the first argument will contain the Error object if an error occurred, or null otherwise. The second argument will contain the result.
     */
    execute(query, values, callback) {
        if (query == null) {
            return callback(new Error('Invalid argument. Query may not be null'));
        }
        if (typeof query !== 'object') {
            return callback(new Error('Unsupported query expression. Expected a valid query object'));
        }
        if (query.hasOwnProperty('$insert')) {
            return executeInsert.call(this, query).then(function (result) {
                return callback(null, result);
            }).catch(function (err) {
                return callback(err);
            });
        } else if (query.hasOwnProperty('$delete')) {
            return executeDelete.call(this, query).then(function (result) {
                return callback(null, result);
            }).catch(function (err) {
                return callback(err);
            });
        } else if (query.hasOwnProperty('$update')) {
            return executeUpdate.call(this, query).then(function (result) {
                return callback(null, result);
            }).catch(function (err) {
                return callback(err);
            });
        } else if (query.hasOwnProperty('$select') || query.hasOwnProperty('$projection')) {
            return executeSelect.bind(this)(query).then(function (result) {
                return callback(null, result);
            }).catch(function (err) {
                return callback(err);
            });
        }
        return callback(new Error('Not yet implemented'));
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Executes the specified query against the underlying database and returns a result set.
     * @param {*} query
     * @param {Array<*>=} values
     * @returns {Promise<*>}
     */
    executeAsync(query, values) {
        return new Promise((resolve, reject) => {
            return this.execute(query, values, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            })
        });
    }

    /**
     * Begins a transactional operation by executing the given function
     * @param {MongoTransactionFunctionCallback} transactionFunc
     * @param {MongoAdapterExecuteCallback} callback
     * @returns {*}
     */
    executeInTransaction(transactionFunc, callback) {
        transactionFunc = transactionFunc || function() {
        };
        callback = callback || function() {
        };
        return this.open( err => {
            if (err) {
                return callback();
            }
            transactionFunc.bind(this)( err => {
               if (err) {
                   return callback(err);
               }
               return callback();
            });
        });
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Begins a transactional operation by executing the given function
     * @param {MongoTransactionFunction} transactionFunc
     * @returns {Promise<void>}
     */
    executeInTransactionAsync(transactionFunc) {
        return new Promise((resolve, reject) => {
            this.executeInTransaction((cb) => {
                transactionFunc.bind(this)().then(() => {
                    return cb();
                }).catch( err => {
                    return cb(err);
                });
            }, ((error) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            }));
        });
    }
}
// noinspection JSUnusedGlobalSymbols
/**
 * Creates an instance of MongoAdapter object that represents a mongoDB database connection.
 * @param {MongoAdapterOptions} options
 */
export function createInstance(options) {
    return new MongoAdapter(options);
}
