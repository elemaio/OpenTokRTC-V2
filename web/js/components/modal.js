!(function (global) {
  'use strict';

  var transEndEventName =
    ('WebkitTransition' in document.documentElement.style) ?
    'webkitTransitionEnd' : 'transitionend';

  var closeHandlers = {};
  var keyPressHandler;
  var _queuedModals = [];
  var _modalShown = false;
  var preShowFocusElement;

  function addCloseHandler(selector) {
    var closeElement = document.querySelector(selector + ' .close');
    if (!closeElement) {
      return;
    }

    var handler = function () {
      Utils.sendEvent('modal:close');
      hide(selector);
    };
    closeHandlers[selector] = {
      target: closeElement,
      handler: handler
    };

    keyPressHandler = function (event) {
      var keyCode = event.which || event.keyCode;
      if (keyCode === 27) { // escape key maps to keycode `27`
        handler();
      }
    };

    closeElement.addEventListener('click', handler);
    document.body.addEventListener('keyup', keyPressHandler);
  }

  function removeCloseHandler(selector) {
    var obj = closeHandlers[selector];
    obj && obj.target.removeEventListener('click', obj.handler);
    document.body.removeEventListener('keyup', keyPressHandler);
  }

  function show(selector, preShowCb) {
    var screenFree;
    preShowFocusElement = document.activeElement;
    preShowFocusElement && preShowFocusElement.blur();
    if (!_modalShown) {
      screenFree = Promise.resolve();
    } else {
      screenFree = new Promise(function (resolve) {
        _queuedModals.push(resolve);
      });
    }

    return screenFree.then(function () {
      return new Promise(function (resolve) {
        _modalShown = true;
        preShowCb && preShowCb();
        var modal = document.querySelector(selector);
        modal.addEventListener(transEndEventName, function onTransitionend() {
          modal.removeEventListener(transEndEventName, onTransitionend);
          addCloseHandler(selector);
          resolve();
        });
        modal.classList.add('visible');
        modal.classList.add('show');
      });
    });
  }

  function hide(selector) {
    return new Promise(function (resolve) {
      var modal = document.querySelector(selector);

      modal.addEventListener(transEndEventName, function onTransitionend() {
        modal.removeEventListener(transEndEventName, onTransitionend);
        modal.classList.remove('visible');
        preShowFocusElement && preShowFocusElement.focus();
        resolve();
      });
      removeCloseHandler(selector);
      modal.classList.remove('show');
    }).then(function () {
      _modalShown = false;
      var nextScreen = _queuedModals.shift();
      nextScreen && nextScreen();
    });
  }

  global.Modal = {
    show: show,
    hide: hide
  };
}(this));
