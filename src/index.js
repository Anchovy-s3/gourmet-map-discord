require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, '../data/restaurants.json');

// ミドルウェアの設定
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// データファイルの初期化
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// 店舗データの読み込み
function loadRestaurants() {
  try {
    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading restaurants data:', error);
    return [];
  }
}

// 店舗データの保存
function saveRestaurant(restaurant) {
  try {
    const restaurants = loadRestaurants();
    // 既存のデータをURLで確認
    const exists = restaurants.some(r => r.url === restaurant.url);
    if (!exists) {
      restaurants.push(restaurant);
      fs.writeFileSync(DATA_FILE, JSON.stringify(restaurants, null, 2));
      console.log('Restaurant saved:', restaurant.name);
    } else {
      console.log('Restaurant already exists:', restaurant.name);
    }
    return !exists;
  } catch (error) {
    console.error('Error saving restaurant data:', error);
    return false;
  }
}

// 食べログURLから店舗情報を抽出
async function extractRestaurantInfo(url, messageUrl) {
  try {
    console.log(`Extracting info from: ${url}`);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // 店舗名の取得
    const name = $('h2.display-name span').text().trim() || $('h1.restaurant-name').text().trim();
      // 地図情報の取得
    let lat, lng;
    
    // 方法1: スクリプト内の座標パターンを検索
    const allScripts = $('script').toArray();
    for (const script of allScripts) {
      const scriptContent = $(script).html() || '';
      
      // 各種パターンを試す
      const patterns = [
        /(?:GLatLng|LatLng)\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)/,       // GLatLng(35.123, 139.123)
        /latitude["\s:=]+(-?\d+\.\d+)/i,                            // latitude: 35.123 または latitude="35.123"
        /longitude["\s:=]+(-?\d+\.\d+)/i,                           // longitude: 139.123
        /lat["\s:=]+(-?\d+\.\d+)/i,                                 // lat: 35.123
        /lng["\s:=]+(-?\d+\.\d+)/i,                                 // lng: 139.123
        /center:\s*\{\s*lat\s*:\s*(-?\d+\.\d+)\s*,\s*lng\s*:\s*(-?\d+\.\d+)\s*\}/ // center: { lat: 35.123, lng: 139.123 }
      ];
      
      for (const pattern of patterns) {
        const matches = scriptContent.match(pattern);
        if (matches) {
          if (pattern.toString().includes('center')) {
            // center パターンの場合は緯度と経度の両方が取得できる
            if (!lat && matches[1]) lat = parseFloat(matches[1]);
            if (!lng && matches[2]) lng = parseFloat(matches[2]);
          } else if (pattern.toString().includes('GLatLng|LatLng')) {
            // GLatLng または LatLng パターンの場合
            if (!lat && matches[1]) lat = parseFloat(matches[1]);
            if (!lng && matches[2]) lng = parseFloat(matches[2]);
          } else if (pattern.toString().includes('latitude') || pattern.toString().includes('lat[')) {
            // 緯度のみのパターン
            if (!lat && matches[1]) lat = parseFloat(matches[1]);
          } else if (pattern.toString().includes('longitude') || pattern.toString().includes('lng[')) {
            // 経度のみのパターン
            if (!lng && matches[1]) lng = parseFloat(matches[1]);
          }
        }
      }
      
      // 緯度と経度の両方が取得できたら終了
      if (lat && lng) break;
    }
    
    // 方法2: data 属性を持つ要素から抽出
    if (!lat || !lng) {
      const mapElements = $('[data-lat][data-lng], [data-latitude][data-longitude]').first();
      if (mapElements.length) {
        lat = parseFloat(mapElements.attr('data-lat') || mapElements.attr('data-latitude'));
        lng = parseFloat(mapElements.attr('data-lng') || mapElements.attr('data-longitude'));
      }
    }
    
    // 方法3: URLパラメータからの取得を試みる（Google MapsへのリンクURLから）
    if (!lat || !lng) {
      const mapLinks = $('a[href*="maps.google"], a[href*="google.com/maps"]');
      if (mapLinks.length) {
        const href = mapLinks.attr('href');
        const matches = href.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (matches && matches.length === 3) {
          lat = parseFloat(matches[1]);
          lng = parseFloat(matches[2]);
        }
      }
    }
    
    // 住所の取得（セレクタを増やして対応）
    const address = $('.rstinfo-table__address').text().trim() || 
                   $('.locality').text().trim() + $('.street-address').text().trim() ||
                   $('[property="address"], [itemprop="address"]').text().trim() ||
                   $('[class*="address"]').text().trim();
    
    // 電話番号の取得（セレクタを増やして対応）
    const phone = $('.rstinfo-table__tel').text().trim() || 
                 $('.rstdtl-side-yoyaku__tel-number').text().trim() ||
                 $('[property="telephone"], [itemprop="telephone"]').text().trim() ||
                 $('[class*="tel"]').text().trim();
    
    // 地図情報が見つからない場合、住所から地理座標を取得する（住所からの座標取得はAPIが必要なため実装していません）
    if (!lat || !lng) {
      // 位置情報が見つからない場合のデフォルト値として東京駅の座標を使用
      console.warn('地図情報が見つかりませんでした。デフォルト座標（東京駅）を使用します。');
      lat = 35.6812;
      lng = 139.7671;
    }

    return {
      name,
      url,
      lat,
      lng,
      address,
      phone,
      messageUrl,
      timestamp: new Date().toISOString()
    };  } catch (error) {
    console.error(`Error extracting restaurant info from ${url}:`, error);
    // エラーが発生した場合でもデフォルト値を持った情報を返す
    return {
      name: url.split('/').pop() || 'Unknown Restaurant',
      url,
      lat: 35.6812, // 東京駅のデフォルト座標
      lng: 139.7671,
      address: 'Address not available',
      phone: 'Phone not available',
      messageUrl,
      timestamp: new Date().toISOString(),
      isDefaultLocation: true // デフォルト位置情報を使用したことを示すフラグ
    };
  }
}

// APIエンドポイントの設定
// レストラン情報を取得するAPI
app.get('/api/restaurants', (req, res) => {
  try {
    const restaurants = loadRestaurants();
    res.json(restaurants);
  } catch (error) {
    console.error('Error loading restaurants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ヘルスチェックエンドポイント（Docker/Nginx用）
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Google Maps APIキーを提供するAPI
app.get('/api/config/maps-api-key', (req, res) => {
  try {
    // APIキーが存在するか確認
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key is not set in environment variables');
      return res.status(500).json({ error: 'API key is not configured' });
    }
    
    // キャッシュ制御とセキュリティヘッダー
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    
    console.log('Providing Google Maps API key to client');
    res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY });
  } catch (error) {
    console.error('Error providing Maps API key:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// メインページのルート
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Discordボットの設定
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// URLから食べログのURLを抽出する正規表現
const tabelogRegex = /https:\/\/tabelog\.com\/\w+\/A\d+\/A\d+\/\d+\//;

client.on('messageCreate', async (message) => {
  // ボット自身のメッセージは無視
  if (message.author.bot) return;
  
  // メッセージから食べログURLを抽出
  const match = message.content.match(tabelogRegex);
  if (!match) return;
  
  const tabelogUrl = match[0];
  console.log(`食べログURL検出: ${tabelogUrl}`);
  
  try {
    // Discordのメッセージへのリンクを作成
    const messageUrl = `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`;
    
    // 店舗情報を抽出
    const restaurantInfo = await extractRestaurantInfo(tabelogUrl, messageUrl);
      // 店舗情報を保存
    const isNewRestaurant = saveRestaurant(restaurantInfo);
    
    if (isNewRestaurant) {
      // 新しい店舗情報が保存された場合の確認メッセージ
      if (restaurantInfo.isDefaultLocation) {
        // デフォルト位置情報が使用された場合
        await message.reply(`「${restaurantInfo.name}」を追加しましたが、正確な位置情報が取得できませんでした。地図上ではデフォルト位置（東京駅付近）に表示されます。`);
      } else {
        // 正確な位置情報が取得できた場合
        await message.reply(`「${restaurantInfo.name}」の位置情報を地図に追加しました！`);
      }
    }
  } catch (error) {
    console.error('Error processing tabelog URL:', error);
  }
});

// サーバーとDiscordボットの起動
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  
  // Discordボットのログイン
  client.login(process.env.DISCORD_TOKEN)
    .then(() => {
      console.log('Discord bot is connected');
    })
    .catch((error) => {
      console.error('Error connecting to Discord:', error);
    });
});