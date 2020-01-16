import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { PriceQueryFacade } from '@coding-challenge/stocks/data-access-price-query';
import { Subject } from 'rxjs';
import { filter, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import * as moment from 'moment';

@Component({
  selector: 'coding-challenge-stocks',
  templateUrl: './stocks.component.html',
  styleUrls: ['./stocks.component.css']
})
export class StocksComponent implements OnInit, OnDestroy {
  stockPickerForm: FormGroup;
  symbol: string;
  period: string;
  fromDate: Date;
  toDate: Date;
  fromDateFormatted: string;
  toDateFormatted: string;

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
    { viewValue: 'Custom', value: 'custom' }
  ];

  chartData: any;
  isValidForm: boolean;
  isShowDateRange: boolean;
  maxDate = new Date();

  constructor(private fb: FormBuilder, private priceQuery: PriceQueryFacade) {
    this.stockPickerForm = fb.group({
      symbol: [null, Validators.required],
      period: [null, Validators.required],
      fromDate: [null, Validators.required],
      toDate: [null, Validators.required],
    });
  }

  ngOnInit() {
    const defaultFromDate: Date = (new Date());
    defaultFromDate.setMonth(defaultFromDate.getMonth() - 1);
    const defaultToDate: Date = new Date();

    this.stockPickerForm.patchValue({
      fromDate: defaultFromDate,
      toDate: defaultToDate
    });

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

    this.quotes$.subscribe((newData: any) => {

      if (this.period === 'custom' && newData && newData.length > 0) {
        this.chartData = newData.filter((x: any) => {
          return  x[0] >= this.fromDateFormatted &&  x[0] <= this.toDateFormatted
        });
      } else {
        this.chartData = newData;
      }

    });
  }

  ngOnDestroy() {
    this.destroyed.next(true);
    this.destroyed.complete();
  }

  private fetchQuote() {
    const { symbol, period, fromDate, toDate } = this.stockPickerForm.value;
    if (symbol !== null && symbol !== undefined && symbol.length >= 2) {
      this.fromDateFormatted = moment(fromDate).format('YYYY-MM-DD');
      this.toDateFormatted = moment(toDate).format('YYYY-MM-DD');

      let range: string = period;
      if(period === 'custom') {
        range = this.getRangeFromDateSelection(fromDate);
      }

      this.period = period;

      this.priceQuery.fetchQuote(symbol, range);
      this.isValidForm = true;
    } else {
      this.isValidForm = false;
    }
  }

  onPeriodChange(value: any){
    if (value === 'custom') {
      this.isShowDateRange = true;
    } else {
      this.isShowDateRange = false;
    }
  }

  onFromDateChange(e: any) {
    const { symbol, period, fromDate, toDate } = this.stockPickerForm.value;
    if(fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
      this.stockPickerForm.patchValue({
        toDate: fromDate
      });
    }
    this.fromDate = fromDate;
  }
  onToDateChange(e: any) {
    const { symbol, period, fromDate, toDate } = this.stockPickerForm.value;
    if(fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
      this.stockPickerForm.patchValue({
        fromDate: toDate
      });
    }
    this.toDate = toDate;
  }

  getRangeFromDateSelection(fromDate: Date) : string {
    let range = 'max';

    const today = moment(new Date());
    const startDate = moment(fromDate);
    const diffInDays = Math.abs(today.diff(startDate, 'days'));

    if(diffInDays > 5 * 365) {
      range = 'max';
    } else if(diffInDays > 2 * 365 ) {
      range = '5y';
    } else if(diffInDays > 365) {
      range = '2y';
    } else if(diffInDays > 6 * 30) {
      range = '1y';
    } else if(diffInDays > 3 * 30) {
      range = '6m';
    } else if(diffInDays > 30) {
      range = '3m';
    } else {
      range = '1m';
    }

    return range;
  }
}
