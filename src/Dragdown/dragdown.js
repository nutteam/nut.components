/**
* Dragdown component for nut.
* @author Shengjie.Yu
* @constructor {Dragdown}
*/
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['$'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('$'));
  } else {
    root.Dragdown = factory($);
  }
}(this, function($) {
  'use strict';

  var Dragdown = function(options) {
    if(!(this instanceof Dragdown)) {
      return new Dragdown(options);
    }

    this.url = options.url || '';
    this.ck = options.ck || '';
    this.spLog = options.spLog || '';
    this.$container = $('body');
    this.maxHeight = 155; // max height of the dragdown banner
    this.showed = false;
    this.init();
  };

  // swipe ratio
  Dragdown.swipeRatio = 1.5;

  var supportTouch = 'ontouchstart' in window;

  Dragdown.prototype = {
    constructor: Dragdown,

    events: {
      start: supportTouch ? 'touchstart' : 'mousedown',
      move: supportTouch ? 'touchmove' : 'mousemove',
      end: supportTouch ? 'touchend' : 'mouseup'
    },

    init: function() {
      this.render();
      this.bindEvent();
    },

    render: function() {
      var spHref = UC.spLog.logs(this.ck, this.url, this.spLog);
      this.$dragdown = $(
        '<div id="dragdown" class="box-dragdown">' +
        '<a class="dragdown" ' + spHref + '></a></div>'
      );
      this.$container.prepend(this.$dragdown);
    },

    bindEvent: function() {
      this.$container.on(this.events.start, $.proxy(this.onStart, this));
      this.$container.on(this.events.move, $.proxy(this.onMove, this));
      this.$container.on(this.events.end, $.proxy(this.onEnd, this));
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

      if(this.bouncing) {
        return false;
      }

      this.handleSlide({
        event: e,
        diffX: diffX,
        diffY: diffY,
        isMove: true
      });
    },

    onEnd: function(e) {
      if(this.moving !== true) {
        this.tracking = false;
        return;
      } else {
        this.moving = false;
      }

      this.tracking = false;

      var event = supportTouch ? e.changedTouches[0] : e,
        x = event.pageX, y = event.pageY,
        diffX = x - this.startX, diffY = y - this.startY;

      if(this.bouncing) {
        return false;
      }

      this.handleSlide({
        event: e,
        diffX: diffX,
        diffY: diffY
      });

      // if translateY is less than maxHeight, bounce back
      if(this.curTranslateY < this.maxHeight) {
        this.bounce();
      } else {
        this.showed = true;
      }
    },

    handleSlide: function(params) {
      var diffX = params.diffX,
        diffY = params.diffY,
        event = params.event,
        isMove = params.isMove;

      if(this.showed) {
        if(Math.abs(diffX) < Math.abs(diffY) &&
            diffY < 0 &&
            document.body.scrollTop === 0) {
          if(isMove) {
            event.preventDefault();
          }
          this.slide(diffY);
        }
      } else {
        if(Math.abs(diffX) < Math.abs(diffY) &&
            diffY > 0 &&
            document.body.scrollTop === 0) {
          if(isMove) {
            event.preventDefault();
          }
          this.slide(diffY);
        }
      }
    },

    slide: function(diffY) {
      diffY *= Dragdown.swipeRatio;
      diffY += (this.lastTranslateY || 0);

      diffY = Math.min(diffY, this.maxHeight);

      if(!this.tracking) {
        this.lastTranslateY = diffY;
      }

      this.$dragdown.height(diffY);
      this.curTranslateY = diffY;
    },

    bounce: function() {
      var self = this;

      var bounceCallback = function() {
        $(self.$dragdown).css({
          'transition-duration': '0ms'
        });
        self.lastTranslateY = 0;
        self.bouncing = null;
        self.showed = false;
      };
      
      // when bouncing, touchstart,touchmove cancaled
      this.$dragdown.on('webkitTransitionEnd', function() {
        bounceCallback();
      });

      // sometimes, webkitTransitionEnd not fire, so need fallback
      setTimeout(function() {
        bounceCallback();
      }, 300);

      this.$dragdown.css({
        'transition-duration': '300ms',
        'height': 0
      });

      self.bouncing = true;
    }
  };

  return Dragdown;
}));
