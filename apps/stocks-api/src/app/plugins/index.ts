'use strict';

import { getStock } from '../services/stock.service';
const Joi = require('@hapi/joi');

export const plugin = {
  name: 'stockAPI',
  version: '1.0.0',
  register: async function (server, options) {

    // logging options which I passed while invoking the api
    console.log(options);

    server.method({
      name: 'getStockData',
      method: getStock,
      options: {
        cache: {
          expiresIn: 60 * 10000,
          generateTimeout: 10000
        },
        generateKey: function (symbol, period){
          const key = `${symbol}-${period}`;
          console.log('api cache key: ' + key);
          return key;
        }
      }
    });

    server.route({
      method: 'GET',
      path: '/{symbol}/{period}',
      handler: async (request, h) => {

        const symbol = request.params.symbol;
        const period = request.params.period;

        const stockData = await server.methods.getStockData(symbol, period);
        return h.response(stockData);

      },
      // adding validation using JOI,
      // 1. symbol and period are mandatory fields
      // 2. both fields has min 2 alphabets
      options: {
        validate: {
          params: Joi.object({
            symbol: Joi.string().required().min(2),
            period: Joi.string().required().min(2)
          })
        }
      }

    });
  }
};
