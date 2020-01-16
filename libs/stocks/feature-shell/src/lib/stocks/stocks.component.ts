import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
    // setting default from date as (current date -1 month)
    const defaultFromDate: Date = (new Date());
    defaultFromDate.setMonth(defaultFromDate.getMonth() - 1);
    // setting default to date as current date
    const defaultToDate: Date = new Date();

    // setting default from and to date on date picker
    this.stockPickerForm.patchValue({
      fromDate: defaultFromDate,
      toDate: defaultToDate
    });

    // below code replace the "Go button" click event to make call
    // We are checking value change of any form control anding invoking the api only only when
    // 1. form is valid
    // 2. user done typing in textbox
    // 3. checking values are not null or empty (handle from inside fetchQuote())
    // 4. user enter atleast 2 char in textbox (handle from inside fetchQuote())
    this.stockPickerForm.valueChanges
      .pipe(
        // debounce input for 400 milliseconds for type ahead (make sure user done typing in textbox)
        debounceTime(400),
        // only emit if emission is different from previous emission
        distinctUntilChanged(),
        // checking if form is valid
        filter(() => this.stockPickerForm.valid),
        // unsubscribe the object
        takeUntil(this.destroyed))
      .subscribe((status) => this.fetchQuote());

    // handling the api response
    // if drop down value is other than custom date range then pass the full data to chart
    // else filter the data from response by selected date range
    this.quotes$.subscribe((newData: any) => {

      if (this.period === 'custom' && newData && newData.length > 0) {
        // change the date format to filter records
        const fromDateFormatted = moment(this.fromDate).format('YYYY-MM-DD');
        const toDateFormatted = moment(this.toDate).format('YYYY-MM-DD');

        // filter records if custom date range selected
        this.chartData = newData.filter((x: any) => {
          return  x[0] >= fromDateFormatted &&  x[0] <= toDateFormatted
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

  // Used this method to trigger an action to make the call based on input
  private fetchQuote() {
    // getting form control values
    const { symbol, period, fromDate, toDate } = this.stockPickerForm.value;
    // checking user enters atleast 2 char in textbox
    if (symbol !== null && symbol !== undefined && symbol.length >= 2) {

      let range: string = period;
      // if custom date range selected then passing the most suitable parameters to get records
      // because real api doesn't support from date and to date as parameters for date range
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

  // show hide the date picker based on dropdown value
  onPeriodChange(value: any){
    if (value === 'custom') {
      this.isShowDateRange = true;
    } else {
      this.isShowDateRange = false;
    }
  }

  // resetting the value of date-picker if invalid value selected
  onFromDateChange(e: any) {
    const { symbol, period, fromDate, toDate } = this.stockPickerForm.value;
    if(fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
      this.stockPickerForm.patchValue({
        toDate: fromDate
      });
    }
    this.fromDate = fromDate;
  }

  // resetting the value of date-picker if invalid value selected
  onToDateChange(e: any) {
    const { symbol, period, fromDate, toDate } = this.stockPickerForm.value;
    if(fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
      this.stockPickerForm.patchValue({
        fromDate: toDate
      });
    }
    this.toDate = toDate;
  }

  // if custom date range selected then passing the most suitable parameters to get records
  // because real api doesn't support from date and to date as parameters for date range
  getRangeFromDateSelection(fromDate: Date) : string {
    let range = 'max';

    const today = moment(new Date());
    const startDate = moment(fromDate);
    const diffInDays = Math.abs(today.diff(startDate, 'days'));

    // we have only below parameters supported in api to fetch record
    // for better performance, we are calling only api with suitable date range
    // e.g we are fetching all records only if date range selected is above 5 years
    // if needs only last 5 days data then calling api with 1 month parameter (last 30 days data) and then filter last 5 days record
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
