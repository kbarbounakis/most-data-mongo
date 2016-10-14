/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2015, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-11-27

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.

 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.

 * Neither the name of most-query nor the names of its
 contributors may be used to endorse or promote products derived from
 this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */
/**
 * @private
 */
var MongoClient = require('mongodb').MongoClient;

var qry = require('most-query'),
    Q = require('q'),
    _ = require('lodash'),
    util = require('util');
/**
 * @class MongoAdapter
 * @property {Db} rawConnection
 * @param {{host:string,port:number,database:string,user:string,password:string,options:*}|*} options
 * @constructor
 * @augments {DataAdapter|*}
 */
function MongoAdapter(options) {
    if (_.isNil(options)) {
        throw new Error('Connection options may not be null.');
    }
    var connectionURL_ = 'mongodb://';
    if (_.isString(options.user) && !_.isEmpty(options.user)) {
        connectionURL_ += options.user;
        connectionURL_ += ':' + (options.password || '') + '@';
    }
    connectionURL_ += options.host || '127.0.0.1';
    connectionURL_ += ':' + (options.port || 27017);

    if (_.isNil(options.database)) {
        throw new Error('Connection database may not be null.');
    }

    connectionURL_ += '/' + options.database;

    this.getConnectionURL = function() {
        return connectionURL_;
    };

    this.getConnectionOptions = function() {
        return options.options;
    }

}

/**
 * Opens the underlying database connection
 * @param {Function} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
 */
MongoAdapter.prototype.open = function(callback) {
    if (_.isObject(this.rawConnection)) {
        //the connection is already opened
        return callback();
    }
    var self = this;
    MongoClient.connect(this.getConnectionURL(), this.getConnectionOptions(), function(err, mongoClient) {
        if (err) {
            return callback(err);
        }
        self.rawConnection = mongoClient;
        return callback();
    });

};

/**
 * Executes the given query against the underlying database.
 * @param {*} query - A query expression to execute.
 * @param {*} values - An object which represents the named parameters that are going to used during query parsing
 * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise. The second argument will contain the result.
 */
MongoAdapter.prototype.execute = function(query, values, callback) {
    if (_.isNil(query)) {
        return callback(new Error('Invalid argument. Query may not be null'));
    }
    if (!_.isObject(query)) {
        return callback(new Error('Unsupported query expression. Expected a valid query object'));
    }
    if (query.hasOwnProperty('$insert')) {
        return executeInsert_.call(this, query).then(function(result) {
            return callback(null, result);
        }).catch(function(err) {
            return callback(err);
        });
    }
    else if (query.hasOwnProperty('$delete')) {
        return executeDelete_.call(this, query).then(function(result) {
            return callback(null, result);
        }).catch(function(err) {
            return callback(err);
        });
    }
    else if (query.hasOwnProperty('$update')) {
        return executeUpdate_.call(this, query).then(function(result) {
            return callback(null, result);
        }).catch(function(err) {
            return callback(err);
        });
    }
    else if (query.hasOwnProperty('$select') || query.hasOwnProperty('$projection')) {
        return executeSelect_.call(this, query).then(function(result) {
            return callback(null, result);
        }).catch(function(err) {
            return callback(err);
        });
    }
    return callback(new Error('Not yet implemented'));
};
/**
 * @param {{$insert:*}|*} query
 * @returns {*|promise}
 * @private
 */
function executeInsert_(query) {
    var deferred = Q.defer();
    var self = this;
    process.nextTick(function() {
        //get first property of $insert
        var entity = Object.keys(query.$insert)[0];
        if (_.isNil(entity)) {
            return deferred.reject('Invalid insert expression. Entity may not be null');
        }
        self.open(function(err) {
            if (err) { return deferred.reject(err); }
            /**
             * @type {Db|*}
             */
            var db = self.rawConnection;
            return db.collection(entity, { strict:false }, function(err, collection) {
                if (err) { return deferred.reject(err); }
                var formatter = new MongoFormatter(collection);
                var obj = formatter.formatInsert(query);
                if (_.isArray(obj)) {
                    return collection.insertMany(obj, function(err, result) {
                        if (err) { return deferred.reject(err); }
                        return deferred.resolve(result);
                    });
                }
                else if (_.isObject(obj)) {
                    return collection.insertOne(obj, function(err, result) {
                        if (err) { return deferred.reject(err); }
                        return deferred.resolve(result);
                    });
                }
                else {
                    return deferred.reject(new Error('Invalid insert object. Expected an object or an array of objects'));
                }
            });
        });

    });
    return deferred.promise;
}

/**
 * @param {{$delete:*,$where:*}|*} query
 * @returns {*|promise}
 * @private
 */
function executeDelete_(query) {
    var deferred = Q.defer();
    var self = this;
    process.nextTick(function() {
        //get first property of $delete
        var entity = query.$delete;
        if (_.isNil(entity)) {
            return deferred.reject('Invalid delete expression. Entity may not be null');
        }
        if (_.isNil(query.$where)) {
            return deferred.reject('Invalid delete expression. Query may not be null');
        }
        self.open(function(err) {
            if (err) { return deferred.reject(err); }
            /**
             * @type {Db|*}
             */
            var db = self.rawConnection;
            return db.collection(entity, { strict:true }, function(err, collection) {
                if (err) { return deferred.reject(err); }
                var formatter = new MongoFormatter(collection);
                var where = formatter.formatDelete(query);
                return collection.removeMany(where, function(err, result) {
                    if (err) { return deferred.reject(err); }
                    return deferred.resolve(result);
                });
            });
        });

    });
    return deferred.promise;
}

/**
 * @param {{$update:*,$where:*}|*} query
 * @returns {*|promise}
 * @private
 */
function executeUpdate_(query) {
    var deferred = Q.defer();
    var self = this;
    process.nextTick(function() {
        //get first property of $update
        var entity = Object.keys(query.$update)[0];
        if (_.isNil(entity)) {
            return deferred.reject('Invalid update expression. Entity may not be null');
        }
        if (_.isNil(query.$where)) {
            return deferred.reject('Invalid update expression. Query may not be null');
        }
        self.open(function(err) {
            if (err) { return deferred.reject(err); }
            /**
             * @type {Db|*}
             */
            var db = self.rawConnection;
            return db.collection(entity, { strict:true }, function(err, collection) {
                if (err) { return deferred.reject(err); }
                var formatter = new MongoFormatter(collection);
                var obj = formatter.formatUpdate(query);
                if (_.isObject(obj)) {
                    return collection.updateMany(formatter.formatWhere(query.$where), obj, function(err, result) {
                        if (err) { return deferred.reject(err); }
                        return deferred.resolve(result);
                    });
                }
                else {
                    return deferred.reject(new Error('Invalid update object. Expected an object or an array of objects'));
                }


            });
        });

    });
    return deferred.promise;
}

/**
 * @param {{$select:*,$where:*}|*} query
 * @returns {*|promise}
 * @private
 */
function executeSelect_(query) {
    var deferred = Q.defer();
    var self = this;
    process.nextTick(function() {
        //get first property of $update
        var entity = Object.keys(query.$select)[0];
        if (_.isNil(entity)) {
            return deferred.reject('Invalid select expression. Entity may not be null');
        }
        self.open(function(err) {
            if (err) { return deferred.reject(err); }
            /**
             * @type {Db|*}
             */
            var db = self.rawConnection;
            return db.collection(entity, { strict:true }, function(err, collection) {
                var formatter = new MongoFormatter(collection);
                return formatter.formatLimitSelect(query).toArray(function(err, result) {
                    if (err) { return deferred.reject(err); }
                    return deferred.resolve(result);
                });
            });
        });

    });
    return deferred.promise;
}

/**
 * Closes the underlying database connection
 * @param {Function=} callback - A callback function where the first argument will contain the Error object if an error occured, or null otherwise.
 */
MongoAdapter.prototype.close = function(callback) {

    if (_.isNil(this.rawConnection)) {
        //the connection is already closed
        return callback();
    }
    var self = this;
    try {
        self.rawConnection.close(true);
        process.nextTick(function() {
            delete self.rawConnection;
            return callback();
        });
    }
    catch(err) {
        delete self.rawConnection;
        return callback();
    }

};

/**
 *
 * @param obj {*} An Object that represents the data model scheme we want to migrate
 * @param callback {Function}
 */
MongoAdapter.prototype.migrate = function(obj, callback) {
    var self = this;
    self.open(function(err) {
        if (err) { return callback(err); }
        var db = self.rawConnection;
        var counter = obj.add.find(function(x) { return x.type === 'Counter'; });
        if (counter) {
            //add default counter if any
            self.rawConnection.collection('counters', function(err, counters) {
                if (err) { return callback(err); }
                self.counters = self.counters || [];
                if (typeof self.counters.find(function(x) { return (x.entity === obj.appliesTo) && (x.attribute === counter.name); }) === 'undefined') {
                    self.counters.push({ entity:obj.appliesTo , attribute:counter.name });
                }
                return callback(null, true);
            });
        }
        else {
            callback(null, true);
        }
    });
};

/**
 *
 * @param {string} name
 * @param {QueryExpression|*} query
 * @param {Function} callback
 * @returns {*}
 */
MongoAdapter.prototype.createView = function(name, query, callback) {
    callback = callback || function() { };
    //do nothing
   return callback();
};

/**
 * Produces a new identity value for the given entity and attribute.
 * @param entity {String} The target entity name
 * @param attribute {String} The target attribute
 * @param callback {Function=}
 */
MongoAdapter.prototype.selectIdentity = function(entity, attribute , callback) {
    var self = this;
    self.open(function(err) {
        if (err) { return callback(err); }
        self.rawConnection.collection('counters', null, function(err, counters) {
            if (err) { return callback(err); }
            var doc = { entity: entity, attribute: attribute };
            counters.findOneAndUpdate( doc, { $inc: { seq: 1 } }, { returnOriginal: false, upsert:true }, function(err, result) {
                if (err) { return callback(err); }
                callback(null, result.value.seq);
            });
        });
    });
};

/**
 * @class
 * @constructor
 * @param {Collection} collection
 * @augments SqlFormatter
 */
function MongoFormatter(collection) {
    if (_.isNil(collection)) {
        throw new Error('Invalid Argument. Expected a valid collection object');
    }
    if (!_.isFunction(collection.find)) {
        throw new Error('Invalid Argument. Expected a valid collection object');
    }
    this.getCollection = function() {
        return collection;
    }
}
util.inherits(MongoFormatter, qry.classes.SqlFormatter);

/**
 * @param {QueryExpression|*} q
 * @returns {Cursor|*}
 */
MongoFormatter.prototype.formatSelect = function(q) {
    /**
     * @type Array|*
     */
    var select = q.$select[this.getCollection().s.name] || ['*'];
    if (!_.isArray(select)) {
        throw new Error('Invalid Argument. Select must be an array of attributes');
    }
    var projection = { }, isAggregated = false;
    if (select.indexOf("*")<0) {
        _.forEach(select, function(x) {
            if (_.isString(x)) {
                projection[x] = 1;
            }
            else {
                var alias = Object.keys(x)[0];
                projection[alias] = x[alias];
                isAggregated = true;
            }
        });
    }
    if (isAggregated) {
        var pipeline = [
            { "$project" : projection },
            {  "$match" : this.formatWhere(q.$where) }
        ];
        return this.getCollection().aggregate(pipeline).sort(this.formatOrder(q.$order));
    }
    else {
        return this.getCollection().find(this.formatWhere(q.$where), projection).sort(this.formatOrder(q.$order));
    }
};

/**
 * @param {QueryExpression|*} q
 * @returns {*}
 */
MongoFormatter.prototype.formatInsert = function(q) {
    var insert = q.$insert[this.getCollection().s.name];
    if (_.isEmpty(insert)) {
        throw new Error('Invalid Argument. Expected object or array');
    }
    return insert;
};

/**
 * @param {QueryExpression|*} q
 * @returns {*}
 */
MongoFormatter.prototype.formatUpdate = function(q) {
    var update = q.$update[this.getCollection().s.name];
    if (_.isEmpty(update)) {
        throw new Error('Invalid Argument. Expected object or array');
    }
    return update;
};

/**
 * @param {QueryExpression|*} q
 * @returns {*}
 */
MongoFormatter.prototype.formatDelete = function(q) {
    var remove = q.$where;
    if (_.isEmpty(remove)) {
        throw new Error('Invalid Argument. Expected expression');
    }
    return remove;
};

/**
 * @param {*} where
 * @returns {Cursor|*}
 */
MongoFormatter.prototype.formatWhere = function(where) {
    return where;
};

/**
 * Formats a order object to the equivalent SQL statement
 * @param {*} order
 * @returns {*}
 */
MongoFormatter.prototype.formatOrder = function(order)
{
    var self = this, result = { };
    if (!util.isArray(order))
        return result;
    _.forEach(order, function(x) {
        var f = _.isEmpty(x.$desc) ? x.$asc : x.$desc, flag = _.isEmpty(x.$desc) ? 1 : -1;
        if (_.isArray(f)) {
            _.forEach(f, function(y) {
                result[y] = flag;
            });
        }
        else {
            result[f] = flag;
        }
    });

    return result;

};

/**
 * @param {QueryExpression|*} q
 * @returns {Cursor|*}
 */
MongoFormatter.prototype.formatLimitSelect = function(q) {
    var cursor = this.formatSelect(q);
    var skip = 0;
    if (_.isNumber(q.$skip) && parseInt(q.$skip)>0)
        skip = parseInt(q.$skip);
    var take = 25;
    if (_.isNumber(q.$take) && parseInt(q.$take)<0)
        //do select without paging
        return cursor;
    if (_.isNumber(q.$take) && parseInt(q.$take)>0)
        take = parseInt(q.$take);
    return cursor.skip(skip).limit(take);
};

var mongoadp = { };

mongoadp.MongoAdapter = MongoAdapter;
mongoadp.MongoFormatter = MongoFormatter;
/**
 * Creates an instance of MongoAdapter object that represents a mongoDB database connection.
 * @param {{host:string,port:number,user:string,password:string,options:*}|*} options - An object that represents the properties of the underlying database connection.
 * @returns {DataAdapter|*}
 */
mongoadp.createInstance = function(options) {
    return new MongoAdapter(options);
};

if (typeof exports !== 'undefined')
{
    module.exports = mongoadp;
}