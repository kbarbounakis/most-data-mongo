/**
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {SqlFormatter} from '@themost/query';
const debug = require('debug')('themost-framework:mongo');
// noinspection JSUnusedGlobalSymbols
/**
 * @class
 */
export class MongoFormatter extends SqlFormatter {
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
            let result = {};
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
                            result[property] = formatFunction.apply(this, propertyValue[formatFunctionName]);
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

    formatCount(query) {
        return this.formatSelect(query).count();
    }

    formatSelect(query) {
        const self = this;
        const collectionName = this.getCollection().collectionName;
        const select = query.$select[collectionName] || ['*'];
        if (!Array.isArray(select)) {
            throw new Error('Invalid Argument. Select must be an array of attributes');
        }
        let projection;
        let aggregated = false;
        if (select.indexOf("*") < 0) {

            projection = { };
            const testCollection = new RegExp(collectionName + '.', 'g');
            select.forEach(function (x) {
                const attr = self.format(x, '%f');
                if (attr.aggregated) {
                    // set aggregated flag
                    aggregated = true;
                }
                let name;
                for (let key in attr) {
                    // if key starts with `[collection].`
                    if (attr.hasOwnProperty(key)) {
                        // get key
                        name = key;
                        break;
                    }
                }
                // test attribute name
                if (testCollection.test(name)) {
                    Object.defineProperty(attr, name.replace(testCollection, ''), {
                        configurable: true,
                        enumerable: true,
                        writable: true,
                        value: 1
                    });
                    delete attr[name];
                }
                Object.assign(projection, attr);
            });
        }
        // prepare group expression
        let $count;
        // if query has a count expression
        if (typeof query.$count === 'string') {
            // create group expression e.g. { $group: { _id: null, myCount: { $sum: 1 } } },
            $count = {
                $group: {
                    _id: null
                }
            };
            Object.defineProperty($count.$group, query.$count, {
                configurable: true,
                enumerable: true,
                writable: true,
                value: { $sum: 1 }
            });
            // set aggregation flag
            aggregated = true;
            // set projection if empty
            projection = { _id: 0 };
        }
        let $match;
        if (query.$where) {
            $match = this.formatWhere(query.$where);
        }
        let finalSelect;
        if (aggregated) {
            const pipeline = [
                {
                    "$project": projection
                }
            ];
            if ($match) {
                pipeline.push({
                    "$match": $match
                });
            }
            if ($count) {
                pipeline.unshift($count);
            }
            // check if query contains order expression
            if (query.$order) {
                // get order
                const sort = this.formatOrder(query.$order);
                // and return sorted data
                debug('info', 'aggregate', `db.${this.getCollection().collectionName}.aggregate(${JSON.stringify(pipeline)}).sort(${sort})`);
                finalSelect = this.getCollection().aggregate(pipeline).sort(sort);
            }
            else {
                // otherwise return data without order
                debug('info', 'aggregate', `db.${this.getCollection().collectionName}.aggregate(${JSON.stringify(pipeline)})`);
                finalSelect = this.getCollection().aggregate(pipeline);
            }

        } else {
            const find = this.formatWhere(query.$where);
            if (query.$order) {
                const order = this.formatOrder(query.$order);
                debug('info', 'find', `db.${this.getCollection().collectionName}.find(${JSON.stringify(find) || 'null'},${JSON.stringify(projection)}).sort(${JSON.stringify(order)})`);
                finalSelect =  this.getCollection().find(find).project(projection).sort(order);
            }
            else {
                debug('info', 'find', `db.${this.getCollection().collectionName}.find(${JSON.stringify(find) || 'null'},${JSON.stringify(projection)})`);
                finalSelect = this.getCollection().find(find).project(projection);
            }
        }
        return finalSelect;
    }

    formatInsert(query) {
        const insert = query.$insert[this.getCollection().collectionName];
        if (insert == null) {
            throw new Error('Invalid Argument. Expected object or array');
        }
        return insert;
    }

    formatUpdate(query) {
        const update = query.$update[this.getCollection().collectionName];
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

    // noinspection JSCheckFunctionSignatures
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