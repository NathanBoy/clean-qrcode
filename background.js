'use strict';

// 右键菜单标识
const ENCODE_MENU_ID = 'qrcode-ctx-encode';
const DECODE_MENU_ID = 'qrcode-ctx-decode';

// 安装时创建右键菜单
chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: ENCODE_MENU_ID,
    title: chrome.i18n.getMessage('generate'),
    contexts: ['page', 'frame', 'selection', 'link', 'image', 'video', 'audio'],
    documentUrlPatterns: ['http://*/*', 'https://*/*', 'ftp://*/*'],
  });

  chrome.contextMenus.create({
    id: DECODE_MENU_ID,
    title: chrome.i18n.getMessage('decode'),
    contexts: ['image'],
    documentUrlPatterns: ['http://*/*', 'https://*/*', 'ftp://*/*'],
  });
});

// 点击菜单：把目标内容发送给 content script 渲染/解析
chrome.contextMenus.onClicked.addListener(function (menu, evt) {
  // 生成二维码
  if (menu.menuItemId === ENCODE_MENU_ID) {
    let encodeText = null;
    let type = null;

    if (menu.linkUrl) {
      encodeText = menu.linkUrl;
      type = 'link';
    } else if (menu.selectionText && '' !== menu.selectionText.trim()) {
      encodeText = menu.selectionText;
      type = 'text';
    } else if (menu.srcUrl) {
      encodeText = menu.srcUrl;
      type = 'media';
    } else if (menu.pageUrl) {
      encodeText = menu.pageUrl;
      type = 'page';
    }

    if (encodeText) {
      chrome.tabs.sendMessage(evt.id, { encodeText: encodeText, type: type });
    }
  }
  // 解析二维码
  else if (menu.menuItemId === DECODE_MENU_ID) {
    if (menu.srcUrl) {
      // 交给 content script 解码（content script 有 DOM，zxing 需要 canvas/Image）
      chrome.tabs.sendMessage(evt.id, { decodeUrl: menu.srcUrl });
    }
  }
});
