'use strict';

const comp_top = {
  props: ['value'],
  mixins: [mixins_bootstrap],
  store: vue_store,
  template: `
    <div class="bg-text" v-bind:class="classObject">
        <span class="time_style" style="font-size: 150px;">{{toTimeString(datetime_now)}}</span><br>
        <span class="date_style" style="font-size: 40px;">{{toDateString(datetime_now)}}</span><br>
    </div>
`,
  data: function () {
    return {
      datetime_now: new Date().getTime(), // 現在日時
      background_url: null, // 背景画像のURL
      is_dark_prev: false, // ひとつ前がダーク表示だったか
      is_dark: true, // ダーク表示かどうか
      initialized: false,
      background_size: "cover",
      smb_list: [],
    }
  },
  computed: {
    classObject: function(){
      return {
        "center": this.is_dark,
        "bottom-right": !this.is_dark
      };
    }
  },
  methods: {
    // 日付表示文字列に変換
    toDateString: function(tim){
      const d = new Date(tim);
      const weekStr = ["日", "月", "火", "水", "木", "金", "土"];
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${weekStr[d.getDay()]})`; 
    },
    // 時間表示文字列に変換
    toTimeString: function(tim){
      const to2d = (d) => {
        return ("00" + d).slice(-2);
      };
      const d = new Date(tim);
      return `${to2d(d.getHours())}:${to2d(d.getMinutes())}`; 
    },

    // 背景表示変更(背景画像またはダーク表示)
    background_update: function(){
      document.body.style.backgroundImage = this.is_dark ? "none": 'url(' + this.background_url + ')';
    },
    // 背景画像のランダム変更と背景表示変更
    background_change: async function(){
      console.log("background_change called");
      if( this.initialized && this.smb_list.length > 0){
        const index = Math.floor(Math.random() * this.smb_list.length);
        var result = await simplesamba_plugin.readFile(this.smb_list[index]);
//        console.log(result);
        var fname = this.smb_list[index].toLowerCase();
        this.background_url = await LibDataUrl.from(result.result, fname.endsWith(".png") ? "image/png" : "image/jpeg");
      }

      this.background_update();
    },
    // 背景ダーク表示の設定と背景表示変更
    background_change_dark: function(is_dark_now){
      if( (this.is_dark == is_dark_now) || (is_dark_now && !this.is_dark_prev)){
        this.is_dark_prev = is_dark_now;
        return;
      }
      
      this.is_dark = is_dark_now;
      this.is_dark_perv = this.is_dark;
      this.background_update();
    },

    change_size: function(){
      this.background_size = this.background_size == "cover" ? "contain" : "cover";
      document.body.style.backgroundSize = this.background_size;
    },
    scan_all_files: async function(){
      console.log("scan start");
      if( !this.initialized )
        return;

      var folder = this.$store.state.config.samba_folder || "/";
      const scan_folder = async (list, folder) => {
        var result = await simplesamba_plugin.list(folder);
//        console.log(result);
        for( let item of result.list ){
          if( item.isDirectory ){
            await scan_folder(list, folder + item.name);
          }else{
            var fname = item.name.toLowerCase();
            if( fname.endsWith(".jpg") || fname.endsWith(".jpeg") || fname.endsWith(".png") )
              list.push(folder + item.name);
          }
        }
      };
      var list = [];
      await scan_folder(list, folder);
      this.smb_list = list;
      localStorage.setItem("smartclock_list", JSON.stringify(list));
      console.log("scan end");
    },

    // Cordova初期化処理が完了した
    onDeviceReady: async function(){
      console.log('comp_top: onDeviceReady called');

      // 照度取得開始
      const light_type = "android.sensor.light";
      samplesensor.addDevice(light_type);

      // 定期的に照度を取得し、背景表示変更
      setInterval(async () =>{
//        console.log("light sensor called");
        const values = await samplesensor.getValue(light_type);
//        console.log(JSON.stringify(values));
        this.background_change_dark(values[0] < BRIGHTNESS_THRESHOLD);
      }, BRIGHTNESS_UPDATE_INTERVAL);

      this.initialized = true;
      await this.background_change();
    },
  },
  mounted: async function(){
    var list = localStorage.getItem("smartclock_list");
    if( list ){
      this.smb_list = JSON.parse(list);
    }

    // 定期的に日時を更新
    setInterval(() =>{
      this.datetime_now = new Date().getTime();
    }, CLOCK_UPDATE_INTERVAL);

    // 定期的に背景画像を変更
    setInterval(async () =>{
      await this.background_change();
    }, BGIMAGE_UPDATE_INTERVAL);
  }
}

