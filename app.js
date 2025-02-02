/**
* Copyright (c) 2017 Intel Corporation
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


"use strict";
var Broker = require("./lib/mqtt/connector"),
    ApiData = require('./api/data.ingestion'),
    ApiActuation = require('./api/actuation'),
    config = require("./config"),
    logger = require("./lib/logger").init(config),
    authService = require("./lib/authService"),
    health = require('./lib/health');

process.env.APP_ROOT = __dirname;
var brokerConnector = Broker.singleton(config.broker, logger);

function brokerCb(err) {
    if (!err) {
        // Manage Connections to API Server
        var apiDataConnector = new ApiData(logger);
        apiDataConnector.bind(brokerConnector);
        var apiActuationConnector = new ApiActuation(logger, brokerConnector);
        apiActuationConnector.start().then(() => {
            logger.info("Actuation connector connected!");
        }).catch(err => {
            logger.error("Actuation connector error: ", err);
            process.exit(1);
        });
        health.init(brokerConnector);
    } else {
        logger.error("Error on Broker connection ", err);
        process.exit(1);
    }
}

function authServiceCb() {
    logger.info("OISP MQTT-Kafka bridge");
    brokerConnector.connect(brokerCb);
}

logger.info("OISP MQTT-gateway authorization agent");
authService.init(config, logger, authServiceCb);
