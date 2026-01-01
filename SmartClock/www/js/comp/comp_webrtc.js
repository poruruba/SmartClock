'use strict';

const comp_webrtc = {
  props: ['value'],
  mixins: [mixins_bootstrap],
  store: vue_store,
  template:
`
<div class="bg-text top-right">
  <button v-if="!pc" class="secret-btn" v-on:click="onTapped"></button>
  <button v-else="pc" class="btn btn-danger btn-xs" v-on:click="onTapped">録画中</button>
</div>
`,
  data: function () {
    return {
        pc: null,
    }
  },
  methods: {
    onTapped: async function(){
        console.log("onTapped");
        if( !this.$store.state.config?.webrtc_path ){
            alert("WebRTCの設定をしてください。");
            return;
        }

        if( this.pc ){
            if( !confirm("録画を停止しますか？") )
                return;

            webrtc_disconnect(this.pc);
            this.pc = null;
        }else{
            if( !confirm("録画を開始しますか？") )
                return;

            var result = await check_permission_webrtc();
            if (!result){
                await request_permission_webrtc();
                result = await check_permission_webrtc();
            }
            if( !result ){
                alert("実行には権限の付与が必要です。");
                cordova.plugins.diagnostic.switchToSettings();
                return;
            }

            var stream;
            try{
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true
                    });
                } catch (error) {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false
                    });
                }
                var input = {
                    stream: stream,
                    user: WEBRTC_USER,
                    password: WEBRTC_PASSWORD,
                    name: this.$store.state.config.webrtc_path,
                    timeout: 5000,
                    force_h264: true,
                };
                this.pc = await webrtc_send_connect(input, (module, event) =>{
                    console.log(module, event);
                    if (module == 'peer' &&
                        (event.type == "connectionstatechange" &&
                            (event.connectionState == "disconnected" || event.connectionState == "failed" || event.connectionState == "closed")) ){

                        webrtc_disconnect(this.pc);
                        this.pc = null;
                    }
                });
            }catch(error){
                console.error(error);
                if( stream ){
                    stream.getTracks().forEach(track => {
                        track.stop();
                        console.log(`トラック '${track.kind}' を停止しました。`);
                    });
                }
                alert(error);
            }
        }
    },
    onDeviceReady: function(){
    }
  },
  mounted: function(){
  }
}

async function check_permission_webrtc(){
    var result = await new Promise((resolve, reject) =>{
        cordova.plugins.diagnostic.getPermissionsAuthorizationStatus((statuses) =>{
            resolve(statuses);
        }, function(error){
            console.error(error);
            reject(error);
        }, [
            cordova.plugins.diagnostic.permission.CAMERA,
            cordova.plugins.diagnostic.permission.RECORD_AUDIO
        ]);
    });

    return result["CAMERA"] == cordova.plugins.diagnostic.permissionStatus.GRANTED &&
            result["RECORD_AUDIO"] == cordova.plugins.diagnostic.permissionStatus.GRANTED;
}

async function request_permission_webrtc(){
    var result = await new Promise((resolve, reject) =>{
        cordova.plugins.diagnostic.requestRuntimePermissions(function(statuses){
            console.log("Camera: " + statuses["CAMERA"]);
            console.log("Microphone: " + statuses["RECORD_AUDIO"]);
            resolve(statuses);
        }, function(error){
            reject(error);
        }, [
            cordova.plugins.diagnostic.permission.CAMERA,
            cordova.plugins.diagnostic.permission.RECORD_AUDIO
        ]);
    });
    console.log(result);
}
