'use strict';

const direction_names = [
    "北", "北北東", "北東", "東北東",
    "東", "東南東", "南東", "南南東",
    "南", "南南西", "南西", "西南西",
    "西", "西北西", "北西", "北北西"
];

const comp_dashboard = {
  props: ['value'],
  mixins: [mixins_bootstrap],
  store: vue_store,
  template:
`
<div>
  <div class="bg-text top-left">
    <span style="font-size: 20px;" v-on:click="onTapped">{{weather.text}} {{environment.temp_max}}/{{environment.temp_min}}℃</span>
  </div>

  <div id="fullscreenModal" class="modal fade">
    <div class="modal-dialog modal-fullscreen">
      <div class="modal-content" style="background-color: #ccc8;">
        <div class="modal-header">
          <button class="btn btn-default pull-right btn-sm" data-dismiss="modal">閉じる</button>
          <h4 class="modal-title" style="color: white;" class="text-center">ダッシュボード</h4>
        </div>
        <div class="modal-body">

          <table class="equal-table cell-separate">
            <tbody>
              <tr class="cell-border">
                <td>
                    <font :size="S2">{{toLocaleDateString(datetime_now)}} {{new Date(datetime_now).toLocaleString('ja-JP', {"weekday":"short"})}}曜日</font><br>
                    &nbsp;&nbsp;<span :style="fontObject">{{toTimeString(datetime_now)}}</span>
                    <table>
                      <tr>
                        <td><font :size="S4">{{weather.emoji}}</font></td>
                        <td>
                          <font :size="S2" >{{weather.text}}</font><br><font :size="S3">{{environment.temp_max}}℃ / {{environment.temp_min}}℃</font>
                        </td>
                      </tr>
                    </table>
                    <span v-if="room"><label>室内</label> <font :size="S3">🌡️{{room.temperature}}℃ 💧{{room.humidity}}%</font><br></span>
                    <label>屋外</label> <font :size="S3">🌡️{{condition.temperature_2m}}℃ 💧{{condition.relative_humidity_2m}}%</font><br>
                    <br>
                </td>
                <td>
                    <table class="equal-table">
                      <tbody>
                          <tr><td>風速</td><td style="text-align: right;"><font :size="S2">{{condition.windspeed_10m}} m/s</font></td></tr>
                          <tr><td>風向</td><td style="text-align: right;"><font :size="S2">{{angleTo16Direction(condition.winddirection_10m)}} {{condition.winddirection_10m}}°</font></td></tr>
                          <tr><td>UV指数</td><td style="text-align: right;"><font :size="S2">{{condition.uv_index}}</font></td></tr>
                          <tr><td>🌧️降水確率</td><td style="text-align: right;"><font :size="S2">{{condition.precipitation_probability}} %</font></td></tr>
                          <tr><td>🌬️気圧</td><td style="text-align: right;"><font :size="S2">{{condition.pressure_msl}} hPa</font></td></tr>
                          <tr><td>🌅日の出</td><td style="text-align: right;"><font :size="S2">{{toTimeString(sun.rise)}}</font></td></tr>
                          <tr><td>🌇日の入</td><td style="text-align: right;"><font :size="S2">{{toTimeString(sun.set)}}</font></td></tr>
                      </tbody>
                    </table>
                </td>
                <td>
                    <table class="equal-table">
                      <tbody>
                        <tr v-for="(item, index) in week_weather">
                          <td>{{item.week}}曜日 <font :size="S3">{{item.weather.emoji}}</font> {{item.weather.text}}</td><td style="text-align: right;">{{item.temp_max}}℃ / {{item.temp_min}}℃</td>
                        </tr>
                      </tbody>
                    </table>
                </td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>
    </div>
  </div>
</div>
`,
  data: function () {
    return {
        datetime_now: new Date().getTime(),
        weather: {},
        environment: {},
        condition: {},
        sun: {},
        week_weather: [],
        room: null,

        S1: 2,
        S2: 4,
        S3: 5,
        S4: 7,
    }
  },
  computed: {
    fontObject: function(){
        return {
            "font-size": "70px",
        };
    },
  },
  methods: {
    onTapped: function(){
      console.log("onTaped");
      if( !this.$store.state.config.weather_lat ){
        alert("ダッシュボードの設定をしてください。");
        return;
      }
      this.dialog_open("#fullscreenModal");
    },

    angleTo16Direction: function(deg) {
        const d = (deg + 360) % 360;
        const index = Math.round(d / 22.5) % 16;
        return direction_names[index];
    },
    toTimeString: function(tim){
        const to2d = (n) =>{
            return n < 10 ? '0' + n : n;
        };
        var date = new Date(tim);
        return to2d(date.getHours()) + ":" + to2d(date.getMinutes());
    },

    update: async function(){
      var lat = this.$store.state.config.weather_lat;
      var lng = this.$store.state.config.weather_lng;

      if( !lat || !lng )
        return;

        var input = {
            url: 'https://api.open-meteo.com/v1/forecast',
            method: "GET",
            qs: {
                latitude: lat,
                longitude: lng,
                daily: "weathercode,temperature_2m_max,temperature_2m_min",
                timezone: "Asia/Tokyo"
            },
        };
        var result = await do_http(input);
        console.log(result);

        const to2d = (n) =>{
            return n < 10 ? '0' + n : n;
        };
        var now = new Date(this.datetime_now);
        var now_str = now.getFullYear() + '-' + to2d(now.getMonth() + 1) + '-' + to2d(now.getDate());
        var index = result.daily.time.findIndex(item => item == now_str);
        this.weather = iconText(result.daily.weathercode[index]);
        this.environment = {
          temp_max: result.daily.temperature_2m_max[index],
          temp_min: result.daily.temperature_2m_min[index]
        };
        this.week_weather = [];
        for( let i = index + 1 ; i < result.daily.time.length ; i++ ){
            var date = new Date(result.daily.time[i]);
            var item = {
                week: date.toLocaleString('ja-JP', {"weekday":"short"}),
                weather: iconText(result.daily.weathercode[i]),
                temp_max: result.daily.temperature_2m_max[i],
                temp_min: result.daily.temperature_2m_min[i]
            };
            this.week_weather.push(item);
        }

        var input = {
            url: "https://api.open-meteo.com/v1/forecast",
            method: "GET",
            qs: {
                latitude: lat,
                longitude: lng,
                current: "uv_index,precipitation_probability,pressure_msl,windspeed_10m,winddirection_10m,relative_humidity_2m,temperature_2m",
                daily: "sunrise,sunset",
                timezone: "Asia/Tokyo"
            },
        };
        var result = await do_http(input);
        console.log(result);
        this.condition = result.current;
        var index = result.daily.time.findIndex(item => item == now_str);
        this.sun = {
          rise: new Date(result.daily.sunrise[index]).getTime(),
          set: new Date(result.daily.sunset[index]).getTime()
        };

        if( SWITCHBOT_OPENTOKEN && SWITCHBOT_SECRET){
          try{
            const switchbot = new SwitchBot(SWITCHBOT_OPENTOKEN, SWITCHBOT_SECRET);
            var result = await switchbot.getDeviceList();
            console.log(result);
            var item = result.deviceList.find(item => item.deviceType == 'WoIOSensor' || item.deviceType == 'Remote' );
            if( item ){
              var result = await switchbot.getDeviceStatus(item.deviceId);
              console.log(result);
              this.room = {
                humidity: result.humidity,
                temperature: result.temperature
              }
            }
          }catch(error){
            console.error(error);
          }
        }
    },

    onDeviceReady: async function(){
      runAtDaily({ hours: 0 }, async () =>{
        this.update();
      });

      this.update();
    }
  },
  mounted: async function(){
    setInterval(() =>{
      this.datetime_now = new Date().getTime();
    }, CLOCK_UPDATE_INTERVAL);
  }
}

function iconText(weatherCode){
    if(weatherCode === 0) return { text: '快晴'  , emoji: '☀' };  // 0 : Clear Sky
    if(weatherCode === 1) return { text: '晴れ'  , emoji: '🌤' };  // 1 : Mainly Clear
    if(weatherCode === 2) return { text: '一部曇', emoji: '⛅' };  // 2 : Partly Cloudy
    if(weatherCode === 3) return { text: '曇り'  , emoji: '☁' };  // 3 : Overcast
    if(weatherCode <= 49) return { text: '霧'    , emoji: '🌫' };  // 45, 48 : Fog And Depositing Rime Fog
    if(weatherCode <= 59) return { text: '霧雨'  , emoji: '🌧' };  // 51, 53, 55 : Drizzle Light, Moderate And Dense Intensity ・ 56, 57 : Freezing Drizzle Light And Dense Intensity
    if(weatherCode <= 69) return { text: '雨'    , emoji: '☔' };  // 61, 63, 65 : Rain Slight, Moderate And Heavy Intensity ・66, 67 : Freezing Rain Light And Heavy Intensity
    if(weatherCode <= 79) return { text: '雪'    , emoji: '☃' };  // 71, 73, 75 : Snow Fall Slight, Moderate And Heavy Intensity ・ 77 : Snow Grains
    if(weatherCode <= 84) return { text: '俄か雨', emoji: '🌧' };  // 80, 81, 82 : Rain Showers Slight, Moderate And Violent
    if(weatherCode <= 94) return { text: '雪・雹', emoji: '☃' };  // 85, 86 : Snow Showers Slight And Heavy
    if(weatherCode <= 99) return { text: '雷雨'  , emoji: '⛈' };  // 95 : Thunderstorm Slight Or Moderate ・ 96, 99 : Thunderstorm With Slight And Heavy Hail
    return                       { text: '不明'  , emoji: '✨' };
}