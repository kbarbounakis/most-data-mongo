/**
 * MOST Web Framework 2.0 Codename Blueshift
 * Copyright (c) 2017, THEMOST LP All rights reserved
 *
 * Use of this source code is governed by an BSD-3-Clause license that can be
 * found in the LICENSE file at https://themost.io/license
 */
import {SqlFormatter} from '@themost/query';
import {Args, LangUtils} from '@themost/common';
const debug = require('debug')('themost-framework:mongo');
const REFERENCE_REGEXP = /^\$/;

function getOwnPropertyName(any) {
    if (any) {
        // noinspection LoopStatementThatDoesntLoopJS
        for(let key in any) {
            if  (any.hasOwnProperty(key)) {
                return key;
            }
        }
    }
}

/**
 * Returns true if the specified string is a method (e.g. $concat) or name reference (e.g. $dateCreated)
 * @param {string} str
 * @returns {*}
 */
export function isMethodOrNameReference(str) {
    return REFERENCE_REGEXP.test(str)
}

// noinspection JSUnusedGlobalSymbols
/**
 * @class
 */
export class MongoFormatter extends SqlFormatter {
    /**
     * @param {MongoCollection} collection
     */
    constructor(collection) {
        super();
        this.getCollection = function () {
            return collection;
        };
        this.settings = {
            nameFormat: '$$$1'
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
            $match = {
                $expr: this.formatWhere(query.$where)
            };
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
            if (query.$order) {
                const order = this.formatOrder(query.$order);
                debug('info', 'find', `db.${this.getCollection().collectionName}.find(${JSON.stringify($match) || 'null'},${JSON.stringify(projection)}).sort(${JSON.stringify(order)})`);
                finalSelect =  this.getCollection().find($match).project(projection).sort(order);
            }
            else {
                debug('info', 'find', `db.${this.getCollection().collectionName}.find(${JSON.stringify($match) || 'null'},${JSON.stringify(projection)})`);
                finalSelect = this.getCollection().find($match).project(projection);
            }
        }
        return finalSelect;
    }

    formatInsert(query) {
        const insert = query.$insert[this.getCollection().collectionName];
        if (insert == null) {
            throw new Error('Invalid Argument. Expected object or array');
        }
        let value;
        // format insert values
        for (let key in insert) {
            if (insert.hasOwnProperty(key) && typeof insert[key] === 'string') {
                value = insert[key];
                if (LangUtils.isDate(value)) {
                    // update value
                    insert[key] = new Date(value);
                }
            }
        }
        return insert;
    }

    formatUpdate(query) {
        const update = query.$update[this.getCollection().collectionName];
        if (update == null) {
            throw new Error('Invalid Argument. Expected object or array');
        }
        let value;
        // format update values
        for (let key in update) {
            if (update.hasOwnProperty(key) && typeof update[key] === 'string') {
                value = update[key];
                if (LangUtils.isDate(value)) {
                    // update value
                    update[key] = new Date(value);
                }
            }
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

    isComparison(obj) {
        for(let key in obj) {
            if (obj.hasOwnProperty(key)) {
                return (/^\$(eq|ne|lt|lte|gt|gte|in|nin)$/g.test(key));
            }
        }
        return false;
    }

    formatWhere(expr) {
        if (expr == null) {
            return;
        }
        const name = getOwnPropertyName(expr);
        if (isMethodOrNameReference(name)) {
            // get format method
            const formatFunc = this[name];
            if (typeof formatFunc === 'function') {
                if (Array.isArray(expr[name])) {
                    return formatFunc.apply(this, expr[name]);
                }
                return formatFunc.call(this, expr[name]);
            }
            throw new Error('Invalid expression or bad syntax');
        }
        else {
            let args = [];
            // get compare expression e.g. { "$eq" : "John" }
            let comparerExpr = expr[name];
            // call format where by assigning field as first argument
            // e.g. { "$eq" : [ "$givenName",  "John" ] }
            let comparerName = getOwnPropertyName(comparerExpr);
            // add an exception here for simple equality expressions e.g. { "firstName": "John" }
            if (isMethodOrNameReference(comparerName)  === false) {
                // extract and return an equality expression
                return this.formatWhere({
                    $eq: [
                        this.escapeName(name),
                        expr[name]
                    ]
                });
            }
            // get comparer arguments e.g. "John"
            let comparerArgs = comparerExpr[comparerName];
            if (Array.isArray(comparerArgs)) {
                // copy arguments
                args = comparerArgs.slice();
                // insert item
                args.unshift(`$${name}`);
            }
            else {
                // if expression is a comparison expression like $eq or $gt etc
                if (this.isComparison(comparerExpr)) {
                    args.push(this.escapeName(name));
                    args.push(comparerArgs)
                }
                else {
                    // push arguments e.g. { $year: "$BirthDate" }
                    let comparerFunc = { };
                    Object.defineProperty(comparerFunc, comparerName, {
                        configurable: true,
                        enumerable: true,
                        writable: true,
                        value: this.escapeName(name)
                    });
                    args.push(comparerFunc);
                    // analyze compare arguments
                    // if compare arguments is an object e.g. { $gt: 1990 }
                    if (typeof comparerArgs === 'object') {
                        // get comparer name
                        comparerName = getOwnPropertyName(comparerArgs);
                        // if comparer is a method reference e.g. $gt
                        if (isMethodOrNameReference(comparerName)) {
                            // get real arguments e.g. 1990 or ['test', 4]
                            comparerArgs = comparerArgs[comparerName];
                            // and push to final arguments
                            if (Array.isArray(comparerArgs)) {
                                args.push.apply(args, comparerArgs);
                            }
                            else {
                                args.push(comparerArgs);
                            }
                            //
                            const comparerFuncFinal = { };
                            Object.defineProperty(comparerFuncFinal, comparerName, {
                                configurable: true,
                                enumerable: true,
                                writable: true,
                                value: args
                            });
                            // e.g. { $gt: [ { $year: '$BirthDate'}, 1990 ] }
                            return this.formatWhere(comparerFuncFinal);
                        }
                    }
                    // otherwise push arguments
                    args.push(comparerArgs);
                    // and execute
                    return this.formatWhere({
                        $eq: args
                    });
                }
            }
            // create new comparer expression e.g. { "$eq": [ "$givenName", "John" ] }
            const formatFunc = this[comparerName];
            if (typeof formatFunc === 'function') {
                return formatFunc.apply(this, args);
            }
        }
    }

    $and() {
        const conditions = Array.from(arguments);
        Args.check(conditions.length, 'Expected at least one expression.');
        return {
            $and: conditions.map( condition => {
                return this.formatWhere(condition);
            })
        };
    }

    $or() {
        const conditions = Array.from(arguments);
        Args.check(conditions.length, 'Expected at least one expression.');
        return {
            $or: conditions.map( condition => {
                return this.formatWhere(condition);
            })
        };
    }

    $eq(left, right) {
        if (Array.isArray(right)) {
            return this.$in(left, right);
        }
        return {
            $eq: [
                this.escape(left),
                this.escape(right)
            ]
        };
    }

    $gt(left, right) {
        return {
            $gt: [
                this.escape(left),
                this.escape(right)
            ]
        };
    }

    $gte(left, right) {
        return {
            $gte: [
                this.escape(left),
                this.escape(right)
            ]
        };
    }

    $lt(left, right) {
        return {
            $lt: [
                this.escape(left),
                this.escape(right)
            ]
        };
    }

    $lte(left, right) {
        return {
            $lte: [
                this.escape(left),
                this.escape(right)
            ]
        };
    }

    $in(left, right) {
        Args.check(Array.isArray(right), new Error('The right operand of an IN statement must be an array.'));
        return {
            $in: [
                this.escape(left),
                right.map( x => {
                    return this.escape(x);
                })
            ]
        };
    }

    $nin(left, right) {
        Args.check(Array.isArray(right), new Error('The right operand of a NOT IN statement must be an array.'));
        return {
            $nin: [
                this.escape(left),
                right.map( x => {
                    return this.escape(x);
                })
            ]
        };
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

    _escapeName(expr, nameFormat) {
        const testCollection = new RegExp(this.getCollection().collectionName + '.', 'g');
        if (typeof expr === 'string') {
            return expr.replace(testCollection, '').replace(/\$?(\w+)|^\$?(\w+)$/g, nameFormat);
        }
        if (typeof expr === 'object' && expr.hasOwnProperty('$name')) {
            return expr.$name.replace(testCollection, '').replace(/\$?(\w+)|^\$?(\w+)$/g, nameFormat);
        }
        return expr;
    }

    /**
     * @param value
     * @param unquoted
     */
    escape(value, unquoted) {
       if (value != null && typeof value === 'object') {
           // if value is name reference
           if (value.hasOwnProperty('$name')) {
               return this.escapeName(value.$name);
           }
           const name = getOwnPropertyName(value);
           if (isMethodOrNameReference(name)) {
               // get format method
               const formatFunc = this[name];
               if (typeof formatFunc === 'function') {
                   const arg = value[name];
                   if (Array.isArray(arg)) {
                       return formatFunc.apply(this, arg);
                   }
                   else {
                       return formatFunc.call(this, arg);
                   }
               }
           }
       }
       return value;
    }

    escapeName(expr) {
        return this._escapeName(expr, this.settings.nameFormat);
    }

    // MongoAdapter extensions
    /**
     * @param p0
     * @returns *
     */
    $year(p0) {
        return {
            $year: {
                date: this.escape(p0),
                timezone: new Date().toTimeString().match(/(\+\d+)/)[0]
            }
        };
    }

    /**
     * @param p0
     * @returns *
     */
    $month(p0) {
        return {
            $month: {
                date: this.escape(p0),
                timezone: new Date().toTimeString().match(/(\+\d+)/)[0]
            }
        };
    }

    /**
     * @param p0
     * @returns *
     */
    $day(p0) {
        return {
            $dayOfMonth: {
                date: this.escape(p0),
                timezone: new Date().toTimeString().match(/(\+\d+)/)[0]
            }
        };
    }

    /**
     * @param p0
     * @returns *
     */
    $dayOfMonth(p0) {
        // get timezone
        return {
            $dayOfMonth: {
                date: this.escape(p0),
                timezone: new Date().toTimeString().match(/(\+\d+)/)[0]
            }
        };
    }

    /**
     * @param p0
     * @returns *
     */
    $hour(p0) {
        return {
            $hour: {
                date: this.escape(p0),
                timezone: new Date().toTimeString().match(/(\+\d+)/)[0]
            }
        };
    }

    /**
     * @param p0
     * @returns *
     */
    $minute(p0) {
        return {
            $minute: {
                date: this.escape(p0),
                timezone: new Date().toTimeString().match(/(\+\d+)/)[0]
            }
        };
    }

    /**
     * @param p0
     * @returns *
     */
    $second(p0) {
        return {
            $second: {
                date: this.escape(p0),
                timezone: new Date().toTimeString().match(/(\+\d+)/)[0]
            }
        };
    }

    /**
     * @param p0
     * @returns *
     */
    $floor(p0) {
        return {
            $floor: this.escape(p0)
        };
    }

    /**
     * @param p0
     * @returns *
     */
    $ceiling(p0) {
        return {
            $ceil: this.escape(p0)
        };
    }

    /**
     * @param p0
     * @returns *
     */
    $tolower(p0) {
        return {
            $toLower: this.escape(p0)
        };
    }

    /**
     * @param p0
     * @returns *
     */
    $toupper(p0) {
        return {
            $toUpper: this.escape(p0)
        };
    }

    /**
     * @param p0
     * @returns *
     */
    $length(p0) {
        return {
            $length: this.escape(p0)
        };
    }


}
