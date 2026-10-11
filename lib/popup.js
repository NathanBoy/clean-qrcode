'use strict';

(function () {
  function $id(id) {
    return document.getElementById(id);
  }
  function show(dom) {
    dom.style.display = 'block';
  }

  function convertImgToBase64(url, callback, outputFormat) {
    var canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d'),
      img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      canvas.height = img.height;
      canvas.width = img.width;
      ctx.drawImage(img, 0, 0);
      var dataURL = canvas.toDataURL(outputFormat || 'image/png');
      callback.call(this, dataURL);
      canvas = null;
    };
    img.src = url;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs && tabs[0];
    var favicon_dom = $id('favicon');
    var qrcode_dom = $id('qrcode');

    favicon_dom.onerror = function () {
      favicon_dom.src = 'icon/icon_32.png';
      favicon_dom.onerror = null;
    };
    if (tab && tab.favIconUrl) {
      favicon_dom.src = tab.favIconUrl;
      show(favicon_dom);
    }

    var url = (tab && tab.url) || '';
    var options = get_qrcode_option(url, 8);

    try {
      qrcode_dom.src = qrgen.canvas(options).toDataURL();
      $id('short_url').value = url;
    } catch (e) {
      /* 内容为空或超长时静默忽略 */
    }

    // 点击复制当前 URL
    $id('short_url').onclick = function () {
      var short_url = $id('short_url').value;
      $id('short_url').select();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(short_url).then(function () {
          flashCopied();
        }, function () {
          fallbackCopy(short_url);
        });
      } else {
        fallbackCopy(short_url);
      }
    };
  });

  function flashCopied() {
    var input = $id('short_url');
    var text = input.value;
    input.value = chrome.i18n.getMessage('copied');
    setTimeout(function () {
      input.value = text;
    }, 1200);
  }

  function fallbackCopy(text) {
    var input = $id('short_url');
    input.value = text;
    input.select();
    var ok = false;
    try {
      ok = document.execCommand('Copy');
    } catch (e) {
      ok = false;
    }
    if (ok) {
      flashCopied();
    }
  }
})();
