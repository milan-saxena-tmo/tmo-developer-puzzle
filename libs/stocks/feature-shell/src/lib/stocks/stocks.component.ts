import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PriceQueryFacade } from '@coding-challenge/stocks/data-access-price-query';
import { Subject } from 'rxjs';
import { filter, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'coding-challenge-stocks',
  templateUrl: './stocks.component.html',
  styleUrls: ['./stocks.component.css']
})
export class StocksComponent implements OnInit, OnDestroy {
  stockPickerForm: FormGroup;
  symbol: string;
  period: string;

  quotes$ = this.priceQuery.priceQueries$;
  private destroyed: Subject<boolean> = new Subject();

  timePeriods = [
    { viewValue: 'All available data', value: 'max' },
    { viewValue: 'Five years', value: '5y' },
    { viewValue: 'Two years', value: '2y' },
    { viewValue: 'One year', value: '1y' },
    { viewValue: 'Year-to-date', value: 'ytd' },
    { viewValue: 'Six months', value: '6m' },
    { viewValue: 'Three months', value: '3m' },
    { viewValue: 'One month', value: '1m' },
  ];

  chartData: any;
  isValidForm: boolean;

  constructor(private fb: FormBuilder, private priceQuery: PriceQueryFacade) {
    this.stockPickerForm = fb.group({
      symbol: [null, Validators.required],
      period: [null, Validators.required]
    });
  }

  ngOnInit() {
    this.stockPickerForm.valueChanges
      .pipe(
        // debounce input for 400 milliseconds
        debounceTime(400),
        // only emit if emission is different from previous emission
        distinctUntilChanged(),
        // checking if form is valid
        filter(() => this.stockPickerForm.valid),
        // unsubscribe
        takeUntil(this.destroyed))
      .subscribe((status) => this.fetchQuote());

    this.quotes$.subscribe(newData => (this.chartData = newData));
  }

  ngOnDestroy() {
    this.destroyed.next(true);
    this.destroyed.complete();
  }

  private fetchQuote() {
    const { symbol, period } = this.stockPickerForm.value;
    if (symbol !== null && symbol !== undefined && symbol.length >= 2) {
      this.priceQuery.fetchQuote(symbol, period);
      this.isValidForm = true;
    } else {
      this.isValidForm = false;
    }
  }

}
