// グローバル変数
let map;
let markers = [];
let restaurants = [];
let infoWindow;

// Google Mapの初期化
function initMap() {
    // 初期表示位置（東京）
    const tokyo = { lat: 35.6812, lng: 139.7671 };
    
    // マップの初期化
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: tokyo,
    });
    
    // 情報ウィンドウの初期化
    infoWindow = new google.maps.InfoWindow();
    
    // レストラン情報を読み込み
    loadRestaurants();
    
    // 検索機能の設定
    setupSearch();
}

// レストラン情報を取得して表示
async function loadRestaurants() {
    try {
        const response = await fetch('/api/restaurants');
        restaurants = await response.json();
        
        // マップにマーカーを表示
        displayMarkers();
        
        // リストにレストランを表示
        displayRestaurantList();
    } catch (error) {
        console.error('レストラン情報の取得に失敗しました:', error);
    }
}

// マップにマーカーを表示
function displayMarkers() {
    // 以前のマーカーをクリア
    clearMarkers();
    
    // 範囲を設定するためのバウンド
    const bounds = new google.maps.LatLngBounds();
    
    restaurants.forEach(restaurant => {
        // マーカーの作成
        const marker = new google.maps.Marker({
            position: { lat: restaurant.lat, lng: restaurant.lng },
            map: map,
            title: restaurant.name,
            animation: google.maps.Animation.DROP
        });
        
        // マーカーをクリックしたときの情報ウィンドウを設定
        marker.addListener('click', () => {
            openInfoWindow(restaurant, marker);
        });
        
        // マーカーを配列に追加
        markers.push(marker);
        
        // バウンドを拡張
        bounds.extend(marker.getPosition());
    });
    
    // すべてのマーカーが見えるように地図を調整（マーカーが1つ以上ある場合のみ）
    if (markers.length > 0) {
        map.fitBounds(bounds);
        
        // ズームレベルが高すぎる場合は調整
        const listener = google.maps.event.addListener(map, 'idle', function() {
            if (map.getZoom() > 16) {
                map.setZoom(16);
            }
            google.maps.event.removeListener(listener);
        });
    }
}

// マーカーをすべて削除
function clearMarkers() {
    markers.forEach(marker => {
        marker.setMap(null);
    });
    markers = [];
}

// 情報ウィンドウを開く
function openInfoWindow(restaurant, marker) {
    // 情報ウィンドウの内容を設定
    const content = `
        <div class="info-window">
            <div class="info-window-name">${escapeHtml(restaurant.name)}</div>
            <div class="info-window-address">${escapeHtml(restaurant.address || '住所情報なし')}</div>
            <div class="info-window-links">
                <a href="${restaurant.url}" target="_blank">食べログで見る</a>
                <a href="${restaurant.messageUrl}" target="_blank">Discord投稿を見る</a>
            </div>
        </div>
    `;
    
    infoWindow.setContent(content);
    infoWindow.open(map, marker);
}

// レストランリストを表示
function displayRestaurantList() {
    const list = document.getElementById('restaurant-list');
    list.innerHTML = '';
    
    if (restaurants.length === 0) {
        list.innerHTML = '<li class="restaurant-item">登録されたレストランはありません</li>';
        return;
    }
    
    // 日付で新しい順に並べ替え
    const sortedRestaurants = [...restaurants].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    sortedRestaurants.forEach(restaurant => {
        const li = document.createElement('li');
        li.className = 'restaurant-item';
        
        li.innerHTML = `
            <div class="restaurant-name">${escapeHtml(restaurant.name)}</div>
            <div class="restaurant-address">${escapeHtml(restaurant.address || '住所情報なし')}</div>
            <div class="restaurant-links">
                <a href="${restaurant.url}" target="_blank">食べログ</a>
                <a href="${restaurant.messageUrl}" target="_blank">Discord投稿</a>
            </div>
        `;
        
        // リストアイテムをクリックしたときにマップをその位置に移動
        li.addEventListener('click', () => {
            const position = { lat: restaurant.lat, lng: restaurant.lng };
            map.setCenter(position);
            map.setZoom(16);
            
            // 対応するマーカーを検索
            const marker = markers.find(m => 
                m.getPosition().lat() === restaurant.lat && 
                m.getPosition().lng() === restaurant.lng
            );
            
            if (marker) {
                openInfoWindow(restaurant, marker);
            }
        });
        
        list.appendChild(li);
    });
}

// 検索機能のセットアップ
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        
        // 検索条件に一致するレストランをフィルタリング
        const filteredRestaurants = restaurants.filter(restaurant => 
            restaurant.name.toLowerCase().includes(searchTerm) ||
            (restaurant.address && restaurant.address.toLowerCase().includes(searchTerm))
        );
        
        // フィルタリングされた結果を表示
        updateDisplayWithFiltered(filteredRestaurants);
    });
}

// フィルタリングされた結果でマップとリストを更新
function updateDisplayWithFiltered(filteredRestaurants) {
    // 一時的にレストラン配列を置き換え
    const originalRestaurants = restaurants;
    restaurants = filteredRestaurants;
    
    // マーカーとリストを更新
    displayMarkers();
    displayRestaurantList();
    
    // 元のレストラン配列を復元
    restaurants = originalRestaurants;
}

// HTML特殊文字をエスケープする（XSS対策）
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ページの読み込みが完了したとき、マップが読み込まれるまで待機
window.onload = function() {
    // Google Mapsが既に読み込まれているかチェック
    if (typeof google === 'object' && typeof google.maps === 'object') {
        initMap();
    }
};