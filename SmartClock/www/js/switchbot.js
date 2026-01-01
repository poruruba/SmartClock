"use strict";

const base_url = "https://api.switch-bot.com/v1.1";

class SwitchBot{
    constructor(token, secret){
      this.authorization = token;
      this.secret = secret;
    }

    async makeSign() {
      const t = new Date().getTime();
      const nonce = "RequestID";
      const data = this.authorization + t + nonce;

      const keyData = new TextEncoder().encode(this.secret);
      const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const dataBuffer = new TextEncoder().encode(data);
      const signature = await crypto.subtle.sign("HMAC", key, dataBuffer);
      const sign = btoa(String.fromCharCode(...new Uint8Array(signature)));

      return {
        Authorization: this.authorization,
        sign: sign,
        nonce: nonce,
        t: t
      };
    }

    async getDeviceList(){
      var headers = await this.makeSign();
      var json = await do_get_with_authorization(base_url + "/devices", null, headers);
      if( json.statusCode != 100 )
        throw new Error("statusCode is not 100");
      return json.body;
    }

    async getDeviceStatus(deviceId){
      var headers = await this.makeSign();
      var json = await do_get_with_authorization(base_url + "/devices/" + deviceId + "/status", null, headers);
      if( json.statusCode != 100 )
        throw new Error("statusCode is not 100");
      return json.body;
    }

    async sendDeviceControlCommand(deviceId, commandType, command, parameter ){
      var headers = await this.makeSign();
      var params = {
        command: command,
        parameter: parameter,
        commandType: commandType
      };
      var json = await do_post_with_authorization(base_url + "/devices/" + deviceId + "/commands", params, headers);
      if( json.statusCode != 100 )
        throw new Error("statusCode is not 100");
    }
}

function do_get_with_authorization(url, qs, authorization) {
  var params = new URLSearchParams(qs ? qs : {});

  var params_str = params.toString();
  var postfix = (params_str == "") ? "" : ((url.indexOf('?') >= 0) ? ('&' + params_str) : ('?' + params_str));
  console.log(url + postfix);
  return _fetch(url + postfix, {
      method: 'GET',
      headers: authorization
    })
    .then((response) => {
      if (!response.ok)
        throw new Error('status is not 200');
      return response.json();
    });
}

function do_post_with_authorization(url, body, authorization) {
  var headers = JSON.parse(JSON.stringify(headers));
  headers["Content-Type"] = "application/json";

  return _fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: headers
    })
    .then((response) => {
      if (!response.ok)
        throw new Error('status is not 200');
      return response.json();
    });
}