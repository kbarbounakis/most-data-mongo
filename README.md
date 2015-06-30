most-data-mongo
===============

Most Web Framework MongoDB Adapter

##Install

$ npm install most-data-mongo

##Usage

Register MongoDB adapter on app.json as follows:

  "adapterTypes": [
        { "name":"MongoDB Data Adapter", "invariantName": "mongo", "type":"most-data-mongo" }
    ]
    
    adapters: {
        { "name":"mongo-db", "invariantName":"mongo", "default":false,
            "options": {
              "host":"localhost",
              "port":27017,
              "database":"db"
            }
    }
}

If you are intended to use MongoDB adapter as the default database adapter set the property "default" to true. 
