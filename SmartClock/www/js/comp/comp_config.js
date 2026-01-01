'use strict';

const comp_config = {
  props: ['value'],
  mixins: [mixins_bootstrap],
  store: vue_store,
  template:
`
<div>
  <button class="bg-text bottom-left secret-btn" v-on:click="onTouched"></button>

  <div class="modal fade" id="dialog_config">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h4 class="modal-title">設定</h4>
        </div>
        <div class="modal-body">
          <ul class="nav nav-tabs">
            <li class="active"><a href="#tab-samba" data-toggle="tab">Samba</a></li>
            <li><a href="#tab-weather" data-toggle="tab">Dashboard</a></li>
            <li><a href="#tab-webrtc" data-toggle="tab">WebRTC</a></li>
          </ul>
          <br>

          <div class="tab-content">
            <div id="tab-samba" class="tab-pane fade in active">
              <label>folder</label> <input type="text" class="form-control" v-model="param_config.samba_folder"><br>
              <button class="btn btn-default btn-sm pull-right" v-on:click="test_folder">接続テスト</button>
              <button class="btn btn-default btn-xs" v-on:click="back_folder">戻る</button>
              <ul>
                <li v-for="(item, index) in dir_list">
                  {{item.name}} <button class="btn btn-default btn-xs" v-on:click="change_folder(item.name)">選択</button>
                </li>
              </ul>
            </div>

            <div id="tab-weather" class="tab-pane fade">
              <div class="form-inline">
                <button class="btn btn-default btn-sm" v-on:click="map_currentPosition">現在地取得</button><br>
                <label>latitude</label> <input type="text" class="form-control" v-model="param_config.weather_lat"><br>
                <label>longitude</label> <input type="text" class="form-control" v-model="param_config.weather_lng">
              </div>
            </div>

            <div id="tab-webrtc" class="tab-pane fade">
              <div class="form-inline">
                <label>path</label> <input type="text" class="form-control" v-model="param_config.webrtc_path"><br>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-default" data-dismiss="modal">キャンセル</button>
          <button type="button" class="btn btn-primary" v-on:click="config_save">保存</button>
        </div>
      </div><!-- /.modal-content -->
    </div><!-- /.modal-dialog -->
  </div><!-- /.modal -->
</div>
`,
  data: function () {
    return {
      param_config: {},
      dir_list: [],
    }
  },
  methods: {
    change_folder: async function(name){
      try{
        var folder = this.param_config.samba_folder || "/";
        folder += name;
        this.param_config.samba_folder = folder;
        await this.update_folder();
      }catch(error){
          console.error(error);
      }
    },
    back_folder: async function(){
      try{
        var folder = this.param_config.samba_folder || "/";
        if( folder.endsWith("/") )
          folder = folder.slice(0, -1);
        folder = folder.substring(0, folder.lastIndexOf("/"));
        this.param_config.samba_folder = folder + "/";
        await this.update_folder();
      }catch(error){
          console.error(error);
      }
    },
    test_folder: async function(){
      try{
          var result = await simplesamba_plugin.auth(SAMBA_USER, SAMBA_PASSWORD, SAMBA_HOST);
          console.log(result);
          await this.update_folder();
          this.toast_show("接続成功");
      }catch(error){
          console.error(error);
      }
    },
    update_folder: async function(){
      try{
          var folder = this.param_config.samba_folder || "/";
          var result = await simplesamba_plugin.list(folder);
          console.log(JSON.stringify(result));
          this.dir_list = result.list.filter(item => item.isDirectory );
      }catch(error){
          console.error(error);
      }
    }, 

    map_currentPosition: function () {
      navigator.geolocation.getCurrentPosition((position) => {
        this.$set(this.param_config, "weather_lat", position.coords.latitude);
        this.$set(this.param_config, "weather_lng", position.coords.longitude);
      }, (error) => {
          console.error(error);
      }, { timeout: 30000 });
    },

    onTouched: function(){
      console.log("onTouched called");
      this.param_config = this.obj_clone(this.$store.state.config);
      this.dialog_open("#dialog_config");
    },

    config_save: async function(){
      try{
        this.progress_open();
        var result = await simplesamba_plugin.auth(SAMBA_USER, SAMBA_PASSWORD, SAMBA_HOST);
        console.log(result);
        this.$store.state.config = this.obj_clone(this.param_config);
        localStorage.setItem("smartclock_config", JSON.stringify(this.$store.state.config));
        if( confirm("ファイルリストを更新しますか？") )
          this.$emit('notify', { event: 'config_update_smb' });
        this.$emit('notify', { event: 'config_update' });
        this.dialog_close("#dialog_config");
      }catch(error){
        console.error(error);
      }finally{
        this.progress_close();
      }
    },

    onDeviceReady: async function(){
      var config = localStorage.getItem("smartclock_config");
      if( config ){
        this.$store.state.config = JSON.parse(config);
      }

      try{
        if( SAMBA_USER ){
          var result = await simplesamba_plugin.auth(SAMBA_USER, SAMBA_PASSWORD, SAMBA_HOST);
          console.log(result);
        }
      }catch(error){
        console.error(error);
      }
    },

  },
  mounted: async function(){
  }
}
