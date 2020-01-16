import {Inject, Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PriceQueryResponse } from './../+state/price-query.type';
import { Observable } from 'rxjs';
import { StocksAppConfig, StocksAppConfigToken } from '@coding-challenge/stocks/data-access-app-config';

@Injectable({
  providedIn: 'root'
})
export class StockService {

  getStockDetails(symbol, period): Observable<PriceQueryResponse[]>{
    // creating the proxy api url by using the base url from env
    const apiURL=  `${this.env.apiURL}/stock/${symbol}/${period}`;

    // return the response as Observable
    return this.httpClient.get<PriceQueryResponse[]>(apiURL);
  }

  constructor(@Inject(StocksAppConfigToken) private env: StocksAppConfig, private httpClient: HttpClient) {}

}
