import { environment as env} from './../../environments/environment';
import * as Wreck from '@hapi/wreck';

export const getStock = async function( symbol, period) {

  // creating the external api url by using the base url from env
  const apiURL = `${env.apiURL}/beta/stock/${symbol}/chart/${period}?token=${env.apiKey}`;

  //logging when invoking the real api
  console.log(apiURL);

  // invoking the api by using Wreck which return the response as promise
  const { res, payload } = await Wreck.get(apiURL, {
    json: true
  });

  return payload;
};
