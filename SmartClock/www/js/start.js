'use strict';

//const vConsole = new VConsole();
//const remoteConsole = new RemoteConsole("http://[remote server]/logio-post");
//window.datgui = new dat.GUI();

var vue_options = {
    el: "#top",
    mixins: [mixins_bootstrap],
    store: vue_store,
    router: vue_router,
    data: {
    },
    computed: {
    },
    methods: {
        // Webページをリロードする(デバッグ用)
        reload: function(){
            location.reload();
        },
        onNotify: async function(e){
            console.log(e);
            if( e.event == 'config_update_smb' ){
                await this.$refs.page_top.scan_all_files();
            }
            if( e.event == 'config_update' ){
                await this.$refs.page_top.background_change();
                await this.$refs.page_dashboard.update();
            }
        },
        onTapped: function(e){
            console.log("onTapped");
            this.$refs.page_top.change_size();
        },
        onDeviceReady: async function(){
            // 画面常時On
            window.powermanagement.acquire();

            await this.$refs.page_config.onDeviceReady();
            this.$refs.page_top.onDeviceReady();
            this.$refs.page_webrtc.onDeviceReady();
            this.$refs.page_dashboard.onDeviceReady();
        },
    },
    created: function(){
    },
    mounted: function(){
        proc_load();
    }
};
vue_add_data(vue_options, { progress_title: '' }); // for progress-dialog
vue_add_global_components(components_bootstrap);
vue_add_global_components(components_utils);

/* add additional components */
vue_add_global_component("comp_config", comp_config);
vue_add_global_component("comp_top", comp_top);
vue_add_global_component("comp_webrtc", comp_webrtc);
vue_add_global_component("comp_dashboard", comp_dashboard);

window.vue = new Vue( vue_options );


function runAtDaily(date, callback) {
  const now = new Date();
  const next = new Date();
  next.setHours(24 + date.hours, date.minutes, date.seconds, 0);
  const delay = next - now;
  setTimeout(() => {
    setInterval(callback, 24 * 60 * 60 * 1000);
  }, delay);
}