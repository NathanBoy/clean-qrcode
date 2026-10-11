'use strict';

// 弹层内部使用的唯一命名空间前缀
var QR_NS = 'qrcode_ext';

function $id(id) {
  return document.getElementById(id);
}

function nsId(name) {
  return QR_NS + '_' + name;
}

function showResult(dom, base64, text) {
  if (base64) {
    dom.innerHTML =
      '<div id="' + nsId('mask') + '" style="margin:0!important;font-family:\'Source Sans Pro\', \'Microsoft Yahei\',sans-serif,Arial!important; font-size:14px!important;color:black!important;position:fixed!important;top:0!important;right:0!important;bottom:0!important;left:0!important;background:rgba(0,0,0,0.39)!important;z-index:2147483646!important"></div>' +
      '<div style="margin:0!important;font-family:\'Source Sans Pro\', \'Microsoft Yahei\',sans-serif,Arial!important; font-size:14px!important;color:black!important;position:fixed!important;top:80px!important;left:50%!important;margin-left:-121px!important;padding:10px 10px!important;width:260px!important;border:1px solid #d9d9d9!important;background:#fff!important;text-align:center!important;z-index:2147483647!important;">' +
        '<a id="' + nsId('close') + '" href="javascript:;" style="text-decoration:none!important;color:#666!important;position:absolute!important;top:5px!important;right:10px!important;display:block!important;width:20px!important;height:20px!important;font-size:20px!important;cursor:pointer!important">×</a>' +
        '<p style="margin:0!important;padding: 0!important;line-height:10px!important">' + chrome.i18n.getMessage('showQRcodeImg') + '</p>' +
        '<img style="box-shadow:2px 2px 4px #888888!important;margin: 10px!important;" width="220" height="220" src="' + base64 + '" />' +
        '<p style="margin:0!important;padding:0!important;line-height:10px!important"><input id="' + nsId('text') + '" style="width:100%!important;padding:5px 0!important;border:1px solid #E5E5DB!important;background:#FFF!important;color:#47433F!important;" value=\'' + text + '\'></input></p>' +
      '</div>';
  } else {
    dom.innerHTML =
      '<div id="' + nsId('mask') + '" style="margin:0!important;font-family:\'Source Sans Pro\', \'Microsoft Yahei\',sans-serif,Arial!important; font-size:14px!important;color:black!important;position:fixed!important;top:0!important;right:0!important;bottom:0!important;left:0!important;background:rgba(0,0,0,0.39)!important;z-index:2147483646!important"></div>' +
      '<div style="margin:0!important;font-family:\'Source Sans Pro\', \'Microsoft Yahei\',sans-serif,Arial!important; font-size:14px!important;color:black!important;position:fixed!important;top:80px!important;left:50%!important;margin-left:-121px!important;padding:10px 10px!important;width:260px!important;border:1px solid #d9d9d9!important;background:#fff!important;text-align:center!important;z-index:2147483647!important;">' +
        '<a id="' + nsId('close') + '" href="javascript:;" style="text-decoration:none!important;color:#666!important;position:absolute!important;top:5px!important;right:10px!important;display:block!important;width:20px!important;height:20px!important;font-size:20px!important;cursor:pointer!important">×</a>' +
        '<p style="margin:0!important;padding: 0!important;line-height:10px!important">' + chrome.i18n.getMessage('showDecodeText') + '</p>' +
        '<p style="margin:0!important;padding:0!important;margin-top:10px!important;line-height:10px!important"><input id="' + nsId('text') + '" style="width:100%!important;padding:5px 0!important;border:1px solid #E5E5DB!important;background:#FFF!important;color:#47433F!important;" value=\'' + text + '\'></input></p>' +
      '</div>';
  }
  dom.style.display = 'block';

  // 点击内容复制
  var plugin_text = $id(nsId('text'));
  plugin_text.onclick = function () {
    plugin_text.select();
    var raw = plugin_text.value;
    copyText(raw).then(function () {
      plugin_text.value = chrome.i18n.getMessage('copied');
      plugin_text.style.color = 'green';
      setTimeout(function () {
        plugin_text.value = raw;
        plugin_text.style.color = 'black';
      }, 1200);
    });
  };

  // 关闭弹层
  var close_btn = $id(nsId('mask'));
  close_btn.onclick = function () {
    dom.innerHTML = ' ';
  };
  var close_btn2 = $id(nsId('close'));
  close_btn2.onclick = function () {
    dom.innerHTML = ' ';
  };

  return false;
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(function () {
      return legacyCopy(text);
    });
  }
  return Promise.resolve(legacyCopy(text));
}

function legacyCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  var ok = false;
  try {
    ok = document.execCommand('Copy');
  } catch (e) {
    ok = false;
  }
  document.body.removeChild(ta);
  return Promise.resolve(ok);
}

function getMaskContainer() {
  var qrcode_div = $id(nsId('plugin'));
  if (!qrcode_div) {
    qrcode_div = document.createElement('div');
    qrcode_div.id = nsId('plugin');
    qrcode_div.style.display = 'none';
    document.body.appendChild(qrcode_div);
  }
  return qrcode_div;
}

function showQrcode(qrcode_text) {
  var qrcode_dom = getMaskContainer();
  var base64;
  try {
    base64 = qrgen.canvas(get_qrcode_option(qrcode_text, 8)).toDataURL();
    showResult(qrcode_dom, base64, qrcode_text);
  } catch (e) {
    alert(chrome.i18n.getMessage('textToLong'));
  }
}

function showDecodeText(decode_text) {
  var qrcode_dom = getMaskContainer();
  showResult(qrcode_dom, null, decode_text);
}

chrome.runtime.onMessage.addListener(function (msg) {
  if (msg.encodeText && '' !== msg.encodeText.trim()) {
    showQrcode(msg.encodeText);
  } else if (msg.decodeText) {
    showDecodeText(msg.decodeText);
  }
});
