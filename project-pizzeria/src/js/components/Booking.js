import {
  templates,
  select,
  settings,
  classNames
} from '../settings.js';
  import utils from '../utils.js';
  import AmountWidget from './AmountWidget.js';
  import DatePicker from './DatePicker.js';
  import HourPicker from './HourPicker.js';
  
  class Booking {
    constructor(elemBooking) {
      const thisBooking = this;
  
      thisBooking.render(elemBooking);
      thisBooking.initWidgets();
      thisBooking.getData();
      thisBooking.selectTable();
    }
  
    selectTable(){
      const thisBooking = this;
      for(let table of thisBooking.dom.tables) {
        table.addEventListener('click', function(){
          table.classList.add(classNames.booking.tableBooked);
          let tableSelectedId = parseInt(table.getAttribute(settings.booking.tableIdAttribute));
          thisBooking.tableSelected = tableSelectedId;
        });
      }
    }
  
    sendReservation() {
      const thisBooking = this;
      const url = settings.db.url + '/' + settings.db.booking;
  
      const payload = {
        date: thisBooking.dom.datePicker.value,
        hour: thisBooking.dom.hourPicker.value,
        duration: thisBooking.dom.hoursAmount.value,
        table: thisBooking.tableSelected,
        phone: thisBooking.dom.phone.value,
        address: thisBooking.dom.address.value,
        starters: [],
        people: thisBooking.peopleAmount.value,
      };
  
      console.log('payload', payload);
        
      for (let starter of thisBooking.dom.starters) {
        if (starter.checked === true) {
          payload.starters.push(starter.value);
        }
      }
  
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };
  
      fetch(url, options)
        .then(function (response) {
          return response.json();
        }).then(function (parsedResponse) {
          console.log('parsedResponse', parsedResponse);
        });
    }
  
    getData() {
      const thisBooking = this;
  
      const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
      const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);
  
      const params = {
        booking: [
          startDateParam,
          endDateParam,
        ],
        eventsCurrent: [
          settings.db.notRepeatParam,
          startDateParam,
          endDateParam,
        ],
        eventsRepeat: [
          settings.db.repeatParam,
          endDateParam,
        ],
      };
  
      //console.log('getData params', params);
  
      const urls = {
        booking: settings.db.url + '/' + settings.db.booking +
          '?' + params.booking.join('&'),
        eventsCurrent: settings.db.url + '/' + settings.db.event +
          '?' + params.eventsCurrent.join('&'),
        eventsRepeat: settings.db.url + '/' + settings.db.event +
          '?' + params.eventsRepeat.join('&'),
      };
  
      Promise.all([
        fetch(urls.booking),
        fetch(urls.eventsCurrent),
        fetch(urls.eventsRepeat),
      ])
        .then(function (allResponses) {
          const bookingsResponse = allResponses[0];
          const eventsCurrentResponse = allResponses[1];
          const eventsRepeatResponse = allResponses[2];
          return Promise.all([
            bookingsResponse.json(),
            eventsCurrentResponse.json(),
            eventsRepeatResponse.json(),
          ]);
        })
        .then(function ([bookings, eventsCurrent, eventsRepeat]) {
          //console.log(bookings);
          //console.log(eventsCurrent);
          //console.log(eventsRepeat);
          thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
        });
    }
  
    parseData(bookings, eventsCurrent, eventsRepeat) {
      const thisBooking = this;
  
      thisBooking.booked = {}; //inf o zaj. stol.
  
      for (let item of bookings) {
        thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
      }
  
      for (let item of eventsCurrent) {
        thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
      }
  
      const minDate = thisBooking.datePicker.minDate;
      const maxDate = thisBooking.datePicker.maxDate;
  
      for (let item of eventsRepeat) {
        if (item.repeat == 'daily'){
          for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
            thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
          }
        }
      }
      //console.log('thisBooking.booked', thisBooking.booked);
      thisBooking.updateDOM();
    }
  
    makeBooked(date, hour, duration, table) {
      const thisBooking = this;
  
      if (typeof thisBooking.booked[date] == 'undefined') {
        thisBooking.booked[date] = {};
      }
  
      const startHour = utils.hourToNumber(hour);
  
      for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
        //console.log('loop', hourBlock);
        if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
          thisBooking.booked[date][hourBlock] = [];
        }
  
        thisBooking.booked[date][hourBlock].push(table);
      }
    }
  
    updateDOM(){
      const thisBooking = this;
      //wart. wybrane przez użytkownika
      thisBooking.date = thisBooking.datePicker.value;
      thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);
      // wszystkie stoliki zajęte
      let allAvailable = false;
  
      if(typeof thisBooking.booked[thisBooking.date] == 'undefined' || typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'){
        allAvailable = true;
      }
  
      for(let table of thisBooking.dom.tables){
        let tableId = table.getAttribute(settings.booking.tableIdAttribute);
        if(!isNaN(tableId)){
          tableId = parseInt(tableId);
        }
  
        if(
          !allAvailable &&
          thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
        ){
          table.classList.add(classNames.booking.tableBooked);
        } else {
          table.classList.remove(classNames.booking.tableBooked);
        }
      }
    }
  
    render(elemBooking) {
      const thisBooking = this;
      const generatedHTML = templates.bookingWidget();
      thisBooking.dom = {};
      thisBooking.dom.wrapper = elemBooking;
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      thisBooking.dom.wrapper.appendChild(generatedDOM);
      thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
      thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
      thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
      thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
      thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
      thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.bookingPhone);
      thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.bookingAddress);
      thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
      thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.bookingForm);
    }
  
    initWidgets() {
      const thisBooking = this;
      thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
      thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
      thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
      thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
  
      thisBooking.dom.wrapper.addEventListener('updated', function(){
        thisBooking.updateDOM();
      });
  
      thisBooking.dom.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisBooking.sendReservation();
      });
    }
  }
  
  export default Booking;