/**
* Swipe component for nut.
* @author Shengjie.Yu
* @constructor {Swipe}
*/
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['$'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('$'));
  } else {
    root.Swipe = factory($);
  }
}(this, function($) {
  'use strict';

  var Swipe = function(options) {
    if(!(this instanceof Swipe)) {
      return new Swipe(options);
    }

    this.container = options.container; // swipe container
    this.selector = options.selector || 'li', // swipe element
    this.fontSize = options.fontSize || 18; // init font size
    this.fontSizeDecreate = options.fontSizeDecreate || 1; // font size descrease
    this.heightDecrease = options.heightDecrease || 6; // init height descrease
    this.opacityDecrease = options.opacityDecrease || 0.2; // init opacity descrease
    this.swipeNumber = options.swipeNumber || 5; // showed swipe number
    this.onSwipe = options.onSwipe || $.noop; // event fire when swipe
    this.activeClassName = options.activeClassName || 'active';
    this.init();
  };

  // debounce ratio
  Swipe.debounceRatio = 0.4;

  var supportTouch = 'ontouchstart' in window;

  Swipe.prototype = {
    constructor: Swipe,

    events: {
      start: supportTouch ? 'touchstart' : 'mousedown',
      move: supportTouch ? 'touchmove' : 'mousemove',
      end: supportTouch ? 'touchend' : 'mouseup'
    },

    init: function() {
      this._init();
      this.reLayout();
      this.bindEvent();
    },

    _init: function() {
      this.lastTranslateX = 0; // reset lastTranslateX
      var $container = $(this.container),
        offset = $container.offset(),
        conWidth = $container.width(),
        $mainEl = $container.find('.' + this.activeClassName),
        $wrapper = $container.find('.swipe-wrapper');

      this.conPageXBegin = offset.left;
      this.conPageXEnd = offset.left + conWidth;
      this.$container = $container;
      this.$wrapper = $wrapper;
      this.$mainEl = $mainEl;
      this.elWidth = $mainEl.width();
      this.elHeight = $container.height();
      this.$elems = $container.find(this.selector);
      this.count = this.$elems.size();
      this.initMainIndex = this.initMainIndex || this.$mainEl.index();
      this.lastSwipeTranslate = -(this.count - this.swipeNumber) * this.elWidth;
      this.firstSwipeTranslate = 0;
    },

    bindEvent: function() {
      $(this.container).on(this.events.start, $.proxy(this.onStart, this));
      $(this.container).on(this.events.move, $.proxy(this.onMove, this));
      if(supportTouch) {
        $(this.container).on(this.events.end, $.proxy(this.onEnd, this));
      } else {
        $(document.body).on(this.events.end, $.proxy(this.onEnd, this));
      }
    },

    onStart: function(e) {
      var event = supportTouch ? e.changedTouches[0] : e,
        x = event.pageX, y = event.pageY;

      this.tracking = true;
      this.moving = false;
      this.startX = x;
      this.startY = y;
    },

    onMove: function(e) {
      if(!this.tracking) {
        return false;
      }

      this.moving = true;

      var event = supportTouch ? e.changedTouches[0] : e,
        x = event.pageX, y = event.pageY,
        diffX = x - this.startX, diffY = y - this.startY;

      if(Math.abs(diffX) >= Math.abs(diffY)) {
        e.preventDefault();
      } else {
        return false;
      }

      if(this.debouncing) {
        return false;
      }

      this.reLayout(diffX);
    },

    onEnd: function(e) {
      if(this.moving !== true) {
        this.tracking = false;
        return;
      } else {
        this.moving = false;
      }

      var event = supportTouch ? e.changedTouches[0] : e,
        x = event.pageX, y = event.pageY,
        diffX = x - this.startX, diffY = y - this.startY;

      this.tracking = false;

      if(this.debouncing) {
        return false;
      }

      this.reLayout(diffX);
    },

    reLayout: function(diffX) {
      // diffX is the current touch's move distance, so should add lastTranslateX
      diffX = (diffX || 0) + (this.lastTranslateX || 0);

      var index, // translate index
        edge, // transform edge
        translateNumber = this.getDebounceTranslateValue(diffX); // swipe translate number

      // not translate
      if(translateNumber === 0) {
        index = this.initMainIndex;
      } else {
        index = this.initMainIndex - translateNumber;
      }

      // not beyond range
      index = index > (this.count - 1) ? (this.count - 1) : index < 0 ? 0 : index;

      this.curIndex = index; // set cur index

      this.onSwipe(index); // custom callback

      var i = 0, size = this.count, $swipe,
        yVal, hVal, oVal, fVal;

      for(; i < size; i++) {
        $swipe = this.$elems.eq(i);
        yVal = (this.heightDecrease / 2) * Math.abs(index - i);
        hVal = this.elHeight - this.heightDecrease * Math.abs(index - i);
        oVal = 1 - this.opacityDecrease * Math.abs(index - i);
        fVal = this.fontSize - this.fontSizeDecreate * Math.abs(index - i);

        $swipe.css({
          '-webkit-transform': 'translateY(' + yVal + 'px)',
          'transform': 'translateY(' + yVal + 'px)',
          'height': hVal,
          'opacity': oVal,
          'font-size': fVal
        });

        if(i === index) {
          $swipe.addClass(this.activeClassName);
        } else {
          $swipe.removeClass(this.activeClassName);
        }
      }

      // translate to last swipe element
      if(diffX < this.lastSwipeTranslate) {
        edge = this.lastSwipeTranslate;
        diffX = edge + (diffX - edge) * Swipe.debounceRatio;
      } else if(diffX > this.firstSwipeTranslate) { // translate to first swipe element
        edge = this.firstSwipeTranslate;
        diffX = edge + (diffX - edge) * Swipe.debounceRatio;
      }

      this.$wrapper.css({
        '-webkit-transform': 'translateX(' + diffX + 'px)',
        'transform': 'translateX(' + diffX + 'px)'
      });

      // exclude touchstart, touchmove
      if(this.tracking !== true) {
        this.debounce(diffX);
      }
    },

    debounce: function(diffX) {
      this.debouncing = true;

      var step = this.elWidth,
        swipe = this;

      // some repeat,tobe easy read
      if(diffX < this.lastSwipeTranslate) {
        diffX = this.lastSwipeTranslate;
      } else if(diffX > this.firstSwipeTranslate) {
        diffX = this.firstSwipeTranslate;
      } else {
        diffX = this.getDebounceTranslateValue(diffX) * step;
      }

      this.lastTranslateX = diffX;

      // when debouncing, touchstart,touchmove cancaled
      this.$wrapper.on('webkitTransitionEnd', function() {
        $(this).css({
          'transition-duration': '0ms'
        });
        swipe.debouncing = null;
      });

      (function(swipe) {
        setTimeout(function() {
          swipe.debouncing = null;
        }, 300);
      })(swipe);

      this.$wrapper.css({
        '-webkit-transform': 'translateX(' + diffX + 'px)',
        'transform': 'translateX(' + diffX + 'px)',
        'transition-duration': '300ms'
      });
    },

    // fire when window orientationchange or resize
    reset: function() {
      (function(swipe) {
        setTimeout(function() {
          swipe._init();
          swipe.translateTo(swipe.curIndex);
        }, 300);
      })(this);
    },

    // fire when click swipe element
    translateTo: function(index) {
      this.reLayout(this.getTranslateWidth(index));
    },

    getTranslateWidth: function(index) {
      // translate to some swipe,so should subtract the lastTranslateX,
      // because reLayout function will add lastTranslateX again.
      return (this.initMainIndex - index) * this.elWidth - this.lastTranslateX;
    },

    // get true translate distance
    getDebounceTranslateValue: function(diffX) {
      var step = this.elWidth,
        ret;

      // diffX -= (this.lastTranslateX || 0);
      ret = diffX >= 0 ? Math.floor(diffX / step) : Math.ceil(diffX / step);
      return ret === -0 ? 0 : ret;
    }
  };

  return Swipe;
}));
