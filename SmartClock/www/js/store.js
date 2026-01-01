'use strict';

const CLOCK_UPDATE_INTERVAL = 20000; // 日時表示の更新頻度(msec)
const BRIGHTNESS_UPDATE_INTERVAL = 10000; // 照度の取得頻度(msec)
const BGIMAGE_UPDATE_INTERVAL = 120000; // 背景画像の更新頻度(msec)
const BRIGHTNESS_THRESHOLD = 2.0; // ダーク表示にする照度の閾値

const SAMBA_USER = "[Sambaサーバのユーザ名]";
const SAMBA_PASSWORD = "[Sambaサーバのパスワード]";
const SAMBA_HOST = "[Sambaサーバのサーバ名]";
const SWITCHBOT_OPENTOKEN = "[SwitchBotのオープントークン)";
const SWITCHBOT_SECRET = "[SwitchBotのシークレット]";
const WEBRTC_USER = "[MediaMTXのユーザ名]";
const WEBRTC_PASSWORD = "[MediaMTXのパスワード]";
const WEBRTC_URL = "https://[MediaMTXのホスト名:28889";

const vue_store = new Vuex.Store({
  state: {
    config: {},
  },
  mutations: {
  }
});