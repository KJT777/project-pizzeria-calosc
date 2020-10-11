import {
  settings,
  select,
  classNames
} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import Booking from './components/Booking.js';

/* eslint-disable no-unused-vars */ 


const app = { //obiekt który pomoże nam w organizacji kodu naszej aplikacji,
  initPages: function () {
    const thisApp = this;

    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.navLinks = document.querySelectorAll(select.nav.links);
    thisApp.orderLink = document.querySelector(select.homeLinks.order);
    thisApp.bookingLink = document.querySelector(select.homeLinks.booking);
    
    const idFromHash = window.location.hash.replace('#/', '');

    let pageMatchingHash = thisApp.pages[0].id;

    for (let page of thisApp.pages) {
      if (page.id == idFromHash) {
        pageMatchingHash = page.id;
        break;
      }
    }

    thisApp.activatePage(idFromHash);

    for (let link of thisApp.navLinks) {
      link.addEventListener('click', function (event) {
        const clickedElement = this;
        event.preventDefault();
        const id = clickedElement.getAttribute('href').replace('#', '');
        thisApp.activatePage(id);
        window.location.hash = '#/' + id;
      });
    }
    thisApp.orderLink.addEventListener('click', function (event) {
      const orderId = 'order';
      event.preventDefault();

      thisApp.activatePage(orderId);
      window.location.hash = '/' + orderId;
    });
    /* Booking */
    thisApp.bookingLink.addEventListener('click', function (event) {
      const bookingId = 'booking';
      event.preventDefault();

      thisApp.activatePage(bookingId);
      window.location.hash = '/' + bookingId;
    });
  },
  activatePage: function (pageId) {
    const thisApp = this;

    /* add class "active" to matching pages, remove from non-matching */
    for (let page of thisApp.pages) {
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }
    /* add class "active" to matching links, remove from non-matching */
    for (let link of thisApp.navLinks) {
      link.classList.toggle(
        classNames.nav.active,
        link.getAttribute('href') == '#' + pageId
      );
    }

  },

  initBooking: function () {
    const thisApp = this;
    thisApp.bookingTab = document.querySelector(select.containerOf.booking);
    thisApp.booking = new Booking(thisApp.bookingTab);
  },

  initMenu: function () {
    const thisApp = this;
    //console.log('thisApp.data:', thisApp.data);
    for (let productData in thisApp.data.products) { // ProductData to ID, i identyfikator
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },

  initData: function () { // data = dataSource
    const thisApp = this;

    thisApp.data = {};
    const url = settings.db.url + '/' + settings.db.product;

    fetch(url)
      .then(function (rawResponse) {
        return rawResponse.json();
      })
      .then(function (parsedResponse) {
        //console.log('parsedResponse', parsedResponse);

        /* save parsedResponse as thisApp.data.products */
        thisApp.data.products = parsedResponse;
        /* execute initMenu method */
        thisApp.initMenu();
      });
    //console.log('thisApp.data', JSON.stringify(thisApp.data));
  },

  initCart: function () {
    const thisApp = this;

    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);

    thisApp.productList = document.querySelector(select.containerOf.menu);
    thisApp.productList.addEventListener('add-to-cart', function (event) {
      app.cart.add(event.detail.product);
    });
  },

  init: function () {
    const thisApp = this;
    //console.log('*** App starting ***');
    //console.log('thisApp:', thisApp);
    //console.log('classNames:', classNames);
    //console.log('settings:', settings);
    //console.log('templates:', templates);
    thisApp.initPages();
    thisApp.initData();
    thisApp.initCart();
    thisApp.initBooking();
  },
};

app.init(); //wywołanie metody, która będzie uruchamiać wszystkie pozostałe komponenty strony.

