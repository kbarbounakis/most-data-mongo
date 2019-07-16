/**
 * @license
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
const QueryField = require("@themost/query").QueryField;
const MongoClient = require('mongodb').MongoClient;
const SqlFormatter = require('@themost/query').SqlFormatter;

/**
 * @interface MongoAdapterOptions
 */

/**
 *
 * Gets or sets a string which represents mongoDB server address
 * @member MongoAdapterOptions#host
 * @type {string}
 */
/**
 * Gets or sets a number which represents mongoDB server port
 * @member MongoAdapterOptions#port
 * @type {number}
 */
/**
 * Gets or sets a string which represents the target mongoDB  databas
 * @member MongoAdapterOptions#database
 * @type {string}
 */
/**
 * Gets or sets a string which represents a mongoDB authentication database that is going to used while connecting
 * @member MongoAdapterOptions#authenticationDatabase
 * @type {string}
 */
/**
 * Gets or sets a string which represents a user name that is going to used while connecting
 * @member MongoAdapterOptions#user
 * @type {string}
 */
/**
 * Gets or sets a string which represents user password that is going to used while connecting
 * @member MongoAdapterOptions#password
 * @type {string}
 */

/**
 * Gets or sets an object which contains extra options for mongoDB connection
 * @member MongoAdapterOptions#options
 * @type {*}
 */

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

class MongoAdapter {
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
        callback = callback || function () {};
        return callback();
    }

    /**
     * Opens a database connection
     * @param {Function} callback
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
                return self.rawConnection.collection('counters', function (err, counters) {
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

}

class MongoFormatter extends SqlFormatter {
    /**
     * @param {Collection=} collection
     */
    constructor(collection) {
        super();
        this.getCollection = function () {
            return collection;
        };
        this.settings = {
            nameFormat: '\$$1'
        }
    }

    formatFieldEx(obj, format) {
        if (typeof obj === 'object') {
            let result = { };
            if (obj.hasOwnProperty('$name')) {
                // define field for projection e.g. { "field1" : 1 }
                Object.defineProperty(result, obj.$name, {
                    value: 1,
                    enumerable: true,
                    configurable: true
                });
                return result;
            }
            // get property name
            const property = Object.keys(obj)[0];
            if (property) {
                // define field with alias e.g. { "field" : "$field1" }
                if (typeof obj[property] === 'string') {
                    result[property] = '$'.concat(obj[property]);
                    return result;
                }
                if (typeof obj[property] === 'object') {
                    // set aggregated flag (this flag is going to be used from mongo formatter)
                    Object.defineProperty(result, 'aggregated', {
                        value: true,
                        enumerable: false,
                        configurable: false
                    });
                    // get property object e.g. { $max: "price" }
                    const propertyValue = obj[property];
                    if (typeof propertyValue === 'object') {
                        // check if property value is a format function e.g. $year
                        const formatFunctionName = Object.keys(propertyValue)[0];
                        if (/^\$/.test(formatFunctionName) && typeof this[formatFunctionName] === 'function') {
                            const formatFunction = this[formatFunctionName];
                            result[property] =  formatFunction.apply(this, propertyValue[formatFunctionName]);
                            return result;
                        }
                    }
                    result[property] = this.formatFieldEx(propertyValue, format);

                    return result;
                }
            }
            throw new Error('Not yet implemented');
        }
        throw new TypeError('Expected an instance of QueryField');
    }

    formatSelect(query) {
        const self = this;
        const select = query.$select[this.getCollection().s.name] || ['*'];
        if (!Array.isArray(select)) {
            throw new Error('Invalid Argument. Select must be an array of attributes');
        }
        const projection = {};
        let aggregated = false;
        if (select.indexOf("*") < 0) {
            select.forEach(function (x) {
                const attr = self.format(x, '%f');
                if (attr.aggregated) {
                    // set aggregated flag
                    aggregated = true;
                }
                Object.assign(projection, attr);
            });
        }
        if (aggregated) {
            const pipeline = [
                {
                    "$project": projection
                },
                {
                    "$match": this.formatWhere(query.$where)
                }
            ];
            // check if query contains order expression
            if (query.$order) {
                return this.getCollection().aggregate(pipeline).sort(this.formatOrder(query.$order));
            }
            // otherwise return data
            return this.getCollection().aggregate(pipeline);
        } else {
            if (query.$order) {
                return this.getCollection().find(this.formatWhere(query.$where)).project(projection).sort(this.formatOrder(query.$order));
            }
            return this.getCollection().find(this.formatWhere(query.$where)).project(projection);
        }
    }

    formatInsert(query) {
        const insert = query.$insert[this.getCollection().s.name];
        if (insert == null) {
            throw new Error('Invalid Argument. Expected object or array');
        }
        return insert;
    }

    formatUpdate(query) {
        const update = query.$update[this.getCollection().s.name];
        if (update == null) {
            throw new Error('Invalid Argument. Expected object or array');
        }
        return update;
    }

    formatDelete(query) {
        const remove = query.$where;
        if (remove == null) {
            throw new Error('Invalid Argument. Expected expression');
        }
        return remove;
    }
    formatWhere(where) {
        return where;
    }

    /**
     *
     * @param {*} order
     */
    formatOrder(order) {
        const result = {};
        if (order == null)
            return result;
        order.forEach(function (x) {
            const f = x.$desc ? x.$desc : x.$asc;
            const flag = x.$desc ? -1 : 1;
            if (Array.isArray(f)) {
                f.forEach(function (y) {
                    result[y] = flag;
                });
            } else {
                result[f] = flag;
            }
        });
        return result;
    }

    formatLimitSelect(query) {
        const cursor = this.formatSelect(query);
        let skip = 0;
        if ((typeof query.$skip === 'number') && parseInt(query.$skip, 10) > 0)
            skip = parseInt(query.$skip);
        let take = 25;
        if ((typeof query.$take === 'number') && parseInt(query.$take, 10) < 0)
        //do select without paging
            return cursor;
        if ((typeof query.$take === 'number') && parseInt(query.$take) > 0)
            take = parseInt(query.$take);
        return cursor.skip(skip).limit(take);
    }

    escapeName(name) {
        if (typeof name === 'string')
            return name.replace(/(\w+)$|^(\w+)$/g, this.settings.nameFormat);
        if (typeof name === 'object' && name.hasOwnProperty('$name')) {
            return '$'.concat(name['$name']);
        }
        return name;
    }

    // MongoAdapter extensions
    /**
     * @param p0
     * @returns *
     */
    $year(p0) {
        return {
            $year: this.escapeName(p0)
        };
    }
    /**
     * @param p0
     * @returns *
     */
    $month(p0) {
        return {
            $month: this.escapeName(p0)
        };
    }
    /**
     * @param p0
     * @returns *
     */
    $day(p0) {
        return {
            $dayOfMonth: this.escapeName(p0)
        };
    }
    /**
     * @param p0
     * @returns *
     */
    $hour(p0) {
        return {
            $hour: this.escapeName(p0)
        };
    }
    /**
     * @param p0
     * @returns *
     */
    $minute(p0) {
        return {
            $minute: this.escapeName(p0)
        };
    }
    /**
     * @param p0
     * @returns *
     */
    $second(p0) {
        return {
            $second: this.escapeName(p0)
        };
    }

    /**
     * @param p0
     * @returns *
     */
    $floor(p0) {
        return {
            $floor: this.escapeName(p0)
        };
    }
    /**
     * @param p0
     * @returns *
     */
    $ceiling(p0) {
        return {
            $ceil: this.escapeName(p0)
        };
    }

    /**
     * @param p0
     * @returns *
     */
    $tolower(p0) {
        return {
            $toLower: this.escapeName(p0)
        };
    }

    /**
     * @param p0
     * @returns *
     */
    $toupper(p0) {
        return {
            $toUpper: this.escapeName(p0)
        };
    }
    /**
     * @param p0
     * @returns *
     */
    $length(p0) {
        return {
            $length: this.escapeName(p0)
        };
    }


}

module.exports.MongoAdapter = MongoAdapter;
module.exports.MongoFormatter = MongoFormatter;
/**
 * Creates an instance of MongoAdapter object that represents a mongoDB database connection.
 * @param {{host:string,port:number,user:string,password:string,options:*}|*} options - An object that represents the properties of the underlying database connection.
 * @returns {DataAdapter|*}
 */
module.exports.createInstance = function (options) {
    return new MongoAdapter(options);
};
