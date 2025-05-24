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
    const mapScript = $('script:contains("GLatLng")').text() || 
                      $('script:contains("LatLng")').text();
    
    if (mapScript) {
      // GLatLng(latitude, longitude) または LatLng(latitude, longitude) のパターンを検索
      const matches = mapScript.match(/(?:GLatLng|LatLng)\((-?\d+\.\d+), (-?\d+\.\d+)\)/);
      if (matches && matches.length === 3) {
        lat = parseFloat(matches[1]);
        lng = parseFloat(matches[2]);
      }
    }
    
    // 住所の取得
    const address = $('.rstinfo-table__address').text().trim() || 
                   $('.locality').text().trim() + $('.street-address').text().trim();
    
    // 電話番号の取得
    const phone = $('.rstinfo-table__tel').text().trim() || 
                 $('.rstdtl-side-yoyaku__tel-number').text().trim();

    if (!lat || !lng) {
      throw new Error('地図情報が見つかりません');
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
    };
  } catch (error) {
    console.error(`Error extracting restaurant info from ${url}:`, error);
    throw error;
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

// Google Maps APIキーを提供するAPI
app.get('/api/config/maps-api-key', (req, res) => {
  try {
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
      // 新しい店舗情報が保存された場合、確認メッセージを送信
      await message.reply(`「${restaurantInfo.name}」の位置情報を地図に追加しました！`);
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