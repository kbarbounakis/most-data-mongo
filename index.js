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
var MongoClient = require('mongodb').MongoClient,
    qry = require('most-query'),
    util = require('util');
/**
 * @class MongoAdapter
 * @param {*} options
 * @constructor
 * @augments {DataAdapter|*}
 */
function MongoAdapter(options) {
    //
}

/**
 * @class MongoFormatter
 * @constructor
 * @augments {DataAdapter|*}
 */
function MongoFormatter() {

}
util.inherits(MongoFormatter, qry.classes.SqlFormatter);

var mongoadp = {
    /**
     * @constructs MongoAdapter
     * */
    MongoAdapter : MongoAdapter,
    /**
     * Creates an instance of MongoAdapter object that represents a mongoDB database connection.
     * @param options An object that represents the properties of the underlying database connection.
     * @returns {DataAdapter|*}
     */
    createInstance: function(options) {
        return new MongoAdapter(options);
    }
};
if (typeof exports !== 'undefined')
{
    module.exports = mongoadp;
}