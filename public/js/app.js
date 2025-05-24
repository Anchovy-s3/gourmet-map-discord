// グローバル変数
let map;
let markers = [];
let restaurants = [];
let infoWindow;

// Google Mapの初期化
function initMap() {
    try {
        console.log('initMap関数を実行...');
        
        // Google Mapsが利用可能かチェック
        if (typeof google !== 'object' || typeof google.maps !== 'object') {
            throw new Error('Google Maps APIが読み込まれていません');
        }
        
        // 初期表示位置（東京）
        const tokyo = { lat: 35.6812, lng: 139.7671 };
        
        const mapDiv = document.getElementById("map");
        if (!mapDiv) {
            throw new Error('地図表示用のDOM要素が見つかりません');
        }
        
        console.log('Google Maps オブジェクトを初期化...');
        
        // マップの初期化 - モバイル対応を強化
        map = new google.maps.Map(mapDiv, {
            zoom: 12,
            center: tokyo,
            gestureHandling: 'greedy', // モバイルでのジェスチャー操作を改善
            fullscreenControl: true,   // 全画面表示ボタンを追加
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM // ズームコントロールの位置を右下に
            }
        });
        
        console.log('Google Maps 初期化成功');
    } catch (error) {
        console.error('Google Maps 初期化エラー:', error);
        handleMapError(error);
    }
    
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
        // マーカーのオプションを設定
        const markerOptions = {
            position: { lat: restaurant.lat, lng: restaurant.lng },
            map: map,
            title: restaurant.name,
            animation: google.maps.Animation.DROP
        };
        
        // デフォルト位置情報の場合は異なるアイコンや色を設定
        if (restaurant.isDefaultLocation) {
            markerOptions.icon = {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#FFA500', // オレンジ色
                fillOpacity: 0.7,
                strokeWeight: 2,
                strokeColor: '#FF4500', // 赤みがかったオレンジ色
                scale: 8
            };
            markerOptions.title = `${restaurant.name} (正確な位置情報なし)`;
        }
        
        // マーカーの作成
        const marker = new google.maps.Marker(markerOptions);
        
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
    // デフォルト位置情報の場合は注意メッセージを表示
    const warningMessage = restaurant.isDefaultLocation 
        ? '<div class="info-window-warning">※正確な位置情報が取得できませんでした</div>'
        : '';
        
    // 情報ウィンドウの内容を設定
    const content = `
        <div class="info-window">
            <div class="info-window-name">${escapeHtml(restaurant.name)}</div>
            ${warningMessage}
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
          // フィードバック効果を追加する関数
        const addActiveEffect = (element) => {
            element.classList.add('restaurant-item-active');
            setTimeout(() => {
                element.classList.remove('restaurant-item-active');
            }, 300);
        };
        
        // リストアイテムをクリックまたはタップしたときにマップをその位置に移動
        const moveToLocation = () => {
            // アクティブ効果を追加
            addActiveEffect(li);
            
            const position = { lat: restaurant.lat, lng: restaurant.lng };
            map.setCenter(position);
            map.setZoom(16);
            
            // スマホでは地図エリアへスクロール
            if (window.innerWidth <= 768) {
                document.getElementById('map-container').scrollIntoView({ behavior: 'smooth' });
            }
            
            // 対応するマーカーを検索
            const marker = markers.find(m => 
                m.getPosition().lat() === restaurant.lat && 
                m.getPosition().lng() === restaurant.lng
            );
            
            if (marker) {
                openInfoWindow(restaurant, marker);
            }
        };
          // クリックとタッチイベントの両方をサポート
        li.addEventListener('click', moveToLocation);
        li.addEventListener('touchend', (e) => {
            e.preventDefault(); // デフォルトのタッチイベントを防止
            moveToLocation();
        });
        
        list.appendChild(li);
    });
}

// 検索機能のセットアップ
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    
    // 入力イベントで検索を実行
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
    
    // モバイルでの検索体験向上: フォーカス時にスクロール
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        searchInput.addEventListener('focus', () => {
            // 少し遅延を入れてキーボードが表示された後にスクロール
            setTimeout(() => {
                searchInput.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        });
    }
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

// マップ初期化失敗時のエラーハンドリング
function handleMapError(error) {
    console.error('マップ初期化エラー:', error);
    const mapDiv = document.getElementById('map');
    if (mapDiv) {
        mapDiv.innerHTML = `
            <div style="text-align:center;padding:20px;color:#c00;">
                <p>マップの初期化に失敗しました</p>
                <p>${error.message || 'エラーが発生しました'}</p>
                <button onclick="location.reload()" style="padding:8px 16px;background:#4A55A2;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:10px;">
                    再読み込み
                </button>
            </div>
        `;
    }
}