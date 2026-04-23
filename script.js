// 初始化地图
const map = new AMap.Map('map', {
    center: [106.713478, 26.578343], // 贵阳坐标
    zoom: 7,
    viewMode: '3D'
});

// 添加地图控件
map.addControl(new AMap.Scale());
map.addControl(new AMap.ToolBar());
map.addControl(new AMap.MapType());

// 定义景点坐标
const locations = [
    {
        name: '东莞',
        position: [113.74626, 23.03848],
        description: '出发地'
    },
    {
        name: '贵阳',
        position: [106.713478, 26.578343],
        description: '中转站'
    },
    {
        name: '黄果树瀑布',
        position: [105.691627, 25.998224],
        description: '中国最大的瀑布，世界著名大瀑布之一'
    },
    {
        name: '西江千户苗寨',
        position: [108.077261, 26.480138],
        description: '中国最大的苗族聚居村寨'
    },
    {
        name: '镇远古城',
        position: [108.489593, 27.030342],
        description: '中国历史文化名城'
    }
];

// 添加标记
locations.forEach(location => {
    const marker = new AMap.Marker({
        position: location.position,
        title: location.name,
        map: map
    });

    // 添加信息窗口
    const infoWindow = new AMap.InfoWindow({
        content: `
            <div style="padding: 10px;">
                <h3>${location.name}</h3>
                <p>${location.description}</p>
            </div>
        `,
        offset: new AMap.Pixel(0, -30)
    });

    marker.on('click', function() {
        infoWindow.open(map, location.position);
    });
});

// 定义路线坐标
const routePath = [
    [113.74626, 23.03848], // 东莞
    [106.713478, 26.578343], // 贵阳
    [105.691627, 25.998224], // 黄果树瀑布
    [108.077261, 26.480138], // 西江千户苗寨
    [108.489593, 27.030342], // 镇远古城
    [106.713478, 26.578343]  // 贵阳（返回）
];

// 绘制路线
const polyline = new AMap.Polyline({
    path: routePath,
    strokeColor: '#2a5298',
    strokeWeight: 5,
    strokeOpacity: 0.8,
    strokeStyle: 'solid',
    lineJoin: 'round',
    lineCap: 'round'
});

polyline.setMap(map);

// 路线动画功能暂时禁用
// const animation = new AMap.MoveAnimation({ 
//     path: routePath, 
//     map: map, 
//     speed: 100 
// });

// 调整地图视野以显示所有标记
map.setFitView();

// 添加路线说明
const routeInfo = document.createElement('div');
routeInfo.style.position = 'absolute';
routeInfo.style.top = '20px';
routeInfo.style.left = '20px';
routeInfo.style.background = 'white';
routeInfo.style.padding = '10px';
routeInfo.style.borderRadius = '5px';
routeInfo.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
routeInfo.style.zIndex = '1000';
routeInfo.innerHTML = `
    <h4>旅游路线</h4>
    <p>东莞 → 贵阳 → 黄果树瀑布 → 西江千户苗寨 → 镇远古城 → 贵阳 → 东莞</p>
`;
document.getElementById('map').appendChild(routeInfo);

// 响应式地图
window.addEventListener('resize', function() {
    map.resize();
});

// 全局变量
let remindersEnabled = false;
let reminderOffset = 5; // 默认提前5分钟提醒
let checkinMarkers = [];

// 行程数据
const itinerary = [
    {
        day: 1,
        date: '2026-04-27',
        activities: [
            { time: '08:00', location: '东莞', activity: '乘坐高铁前往贵阳' },
            { time: '12:30', location: '贵阳北站', activity: '午餐' },
            { time: '14:00', location: '贵阳', activity: '乘坐大巴前往黄果树瀑布' },
            { time: '16:30', location: '黄果树瀑布', activity: '办理住宿' },
            { time: '18:00', location: '黄果树附近', activity: '晚餐' }
        ]
    },
    {
        day: 2,
        date: '2026-04-28',
        activities: [
            { time: '08:00', location: '酒店', activity: '早餐' },
            { time: '09:00', location: '黄果树瀑布景区', activity: '游览黄果树瀑布' },
            { time: '14:30', location: '景区内', activity: '午餐' },
            { time: '16:00', location: '黄果树', activity: '乘坐大巴前往西江千户苗寨' },
            { time: '19:30', location: '西江千户苗寨', activity: '办理住宿，晚餐' }
        ]
    },
    {
        day: 3,
        date: '2026-04-29',
        activities: [
            { time: '08:30', location: '酒店', activity: '早餐' },
            { time: '09:30', location: '西江千户苗寨', activity: '游览苗寨' },
            { time: '12:30', location: '苗寨内', activity: '午餐' },
            { time: '14:30', location: '西江', activity: '乘坐大巴前往镇远古城' },
            { time: '17:30', location: '镇远古城', activity: '办理住宿，晚餐' }
        ]
    },
    {
        day: 4,
        date: '2026-04-30',
        activities: [
            { time: '08:30', location: '酒店', activity: '早餐' },
            { time: '09:30', location: '镇远古城', activity: '游览古城' },
            { time: '12:30', location: '古城内', activity: '午餐' },
            { time: '14:00', location: '镇远', activity: '乘坐大巴前往贵阳' },
            { time: '18:00', location: '贵阳北站', activity: '乘坐高铁返回东莞' }
        ]
    }
];

// 初始化页面
function initPage() {
    // 模态框控制
    const modal = document.getElementById('modal');
    const closeModal = document.getElementById('close-modal');
    const reminderBtn = document.getElementById('reminder-btn');
    const checkinBtn = document.getElementById('checkin-btn');
    const shareBtn = document.getElementById('share-btn');
    const reminderContent = document.getElementById('reminder-content');
    const checkinContent = document.getElementById('checkin-content');
    const shareContent = document.getElementById('share-content');
    const modalTitle = document.getElementById('modal-title');
    
    // 打开行程提醒模态框
    reminderBtn.addEventListener('click', function() {
        modalTitle.textContent = '行程提醒设置';
        reminderContent.style.display = 'block';
        checkinContent.style.display = 'none';
        shareContent.style.display = 'none';
        modal.style.display = 'block';
    });
    
    // 打开景点打卡模态框
    checkinBtn.addEventListener('click', function() {
        modalTitle.textContent = '景点打卡';
        reminderContent.style.display = 'none';
        checkinContent.style.display = 'block';
        shareContent.style.display = 'none';
        modal.style.display = 'block';
        updateCheckinStatus('点击开始打卡按钮进行打卡');
    });
    
    // 打开分享行程模态框
    shareBtn.addEventListener('click', function() {
        modalTitle.textContent = '分享行程';
        reminderContent.style.display = 'none';
        checkinContent.style.display = 'none';
        shareContent.style.display = 'block';
        modal.style.display = 'block';
        generateShareLink();
    });
    
    // 关闭模态框
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
    
    // 提醒设置保存
    const saveReminderBtn = document.getElementById('save-reminder');
    const enableReminders = document.getElementById('enable-reminders');
    const reminderOffsetSelect = document.getElementById('reminder-offset');
    
    saveReminderBtn.addEventListener('click', function() {
        remindersEnabled = enableReminders.checked;
        reminderOffset = parseInt(reminderOffsetSelect.value);
        localStorage.setItem('remindersEnabled', remindersEnabled);
        localStorage.setItem('reminderOffset', reminderOffset);
        alert('提醒设置已保存');
        modal.style.display = 'none';
        
        if (remindersEnabled) {
            startReminderCheck();
        }
    });
    
    // 加载保存的设置
    loadSavedSettings();
    
    // 景点打卡按钮
    const checkinButtons = document.querySelectorAll('.checkin-btn');
    checkinButtons.forEach(button => {
        button.addEventListener('click', function() {
            const attraction = this.dataset.attraction;
            const lat = parseFloat(this.dataset.lat);
            const lng = parseFloat(this.dataset.lng);
            checkinAtAttraction(attraction, lat, lng);
        });
    });
    
    // 开始打卡按钮
    const startCheckinBtn = document.getElementById('start-checkin');
    startCheckinBtn.addEventListener('click', function() {
        startCheckinProcess();
    });
    
    // 分享按钮
    const shareButtons = document.querySelectorAll('.share-btn');
    shareButtons.forEach(button => {
        button.addEventListener('click', function() {
            const platform = this.dataset.platform;
            shareToPlatform(platform);
        });
    });
    
    // 复制链接按钮
    const copyLinkBtn = document.getElementById('copy-link');
    copyLinkBtn.addEventListener('click', function() {
        copyShareLink();
    });
}

// 加载保存的设置
function loadSavedSettings() {
    const savedEnabled = localStorage.getItem('remindersEnabled');
    const savedOffset = localStorage.getItem('reminderOffset');
    
    if (savedEnabled !== null) {
        remindersEnabled = savedEnabled === 'true';
        document.getElementById('enable-reminders').checked = remindersEnabled;
    }
    
    if (savedOffset !== null) {
        reminderOffset = parseInt(savedOffset);
        document.getElementById('reminder-offset').value = reminderOffset;
    }
    
    if (remindersEnabled) {
        startReminderCheck();
    }
}

// 开始提醒检查
function startReminderCheck() {
    setInterval(checkReminders, 60000); // 每分钟检查一次
    checkReminders(); // 立即检查一次
}

// 检查提醒
function checkReminders() {
    if (!remindersEnabled) return;
    
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    itinerary.forEach(day => {
        if (day.date === currentDate) {
            day.activities.forEach(activity => {
                const [hours, minutes] = activity.time.split(':');
                const activityTime = new Date();
                activityTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                
                // 计算提前提醒时间
                const reminderTime = new Date(activityTime.getTime() - reminderOffset * 60000);
                
                // 检查是否到了提醒时间
                if (now >= reminderTime && now < activityTime) {
                    showNotification(`行程提醒: ${activity.time} ${activity.location} - ${activity.activity}`);
                }
            });
        }
    });
}

// 显示通知
function showNotification(message) {
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification('贵州旅行攻略', {
                body: message,
                icon: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=travel%20icon%2C%20simple%2C%20minimal%2C%20blue%20color&image_size=square'
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('贵州旅行攻略', {
                        body: message,
                        icon: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=travel%20icon%2C%20simple%2C%20minimal%2C%20blue%20color&image_size=square'
                    });
                }
            });
        }
    }
    
    // 同时显示浏览器提醒
    alert(message);
}

// 开始打卡过程
function startCheckinProcess() {
    if (!navigator.geolocation) {
        updateCheckinStatus('您的浏览器不支持地理定位功能');
        return;
    }
    
    updateCheckinStatus('正在获取您的位置...');
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            checkNearbyAttractions(lat, lng);
        },
        function(error) {
            updateCheckinStatus(`获取位置失败: ${error.message}`);
        }
    );
}

// 检查附近的景点
function checkNearbyAttractions(lat, lng) {
    const attractions = [
        { name: '黄果树瀑布', lat: 25.998224, lng: 105.691627, radius: 1000 }, // 1公里半径
        { name: '西江千户苗寨', lat: 26.480138, lng: 108.077261, radius: 1000 },
        { name: '镇远古城', lat: 27.030342, lng: 108.489593, radius: 1000 }
    ];
    
    let foundAttraction = null;
    
    for (const attraction of attractions) {
        const distance = getDistance(lat, lng, attraction.lat, attraction.lng);
        if (distance <= attraction.radius) {
            foundAttraction = attraction;
            break;
        }
    }
    
    if (foundAttraction) {
        updateCheckinStatus(`您正在 ${foundAttraction.name} 附近，距离约 ${Math.round(getDistance(lat, lng, foundAttraction.lat, foundAttraction.lng))} 米`);
        confirmCheckin(foundAttraction);
    } else {
        updateCheckinStatus('您当前不在任何景点附近');
    }
}

// 计算两点之间的距离（米）
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
}

// 确认打卡
function confirmCheckin(attraction) {
    if (confirm(`是否在 ${attraction.name} 打卡？`)) {
        updateCheckinStatus(`打卡成功！您已在 ${attraction.name} 打卡`);
        addCheckinMarker(attraction);
        
        // 保存打卡记录
        const checkins = JSON.parse(localStorage.getItem('checkins') || '[]');
        checkins.push({
            attraction: attraction.name,
            time: new Date().toISOString(),
            lat: attraction.lat,
            lng: attraction.lng
        });
        localStorage.setItem('checkins', JSON.stringify(checkins));
    }
}

// 在地图上添加打卡标记
function addCheckinMarker(attraction) {
    const marker = new AMap.Marker({
        position: [attraction.lng, attraction.lat],
        title: `${attraction.name} (已打卡)`,
        icon: new AMap.Icon({
            size: new AMap.Size(32, 32),
            image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
            imageSize: new AMap.Size(32, 32)
        }),
        map: map
    });
    
    checkinMarkers.push(marker);
    
    // 添加打卡信息窗口
    const infoWindow = new AMap.InfoWindow({
        content: `
            <div style="padding: 10px;">
                <h3>${attraction.name}</h3>
                <p>打卡时间：${new Date().toLocaleString()}</p>
            </div>
        `,
        offset: new AMap.Pixel(0, -30)
    });
    
    marker.on('click', function() {
        infoWindow.open(map, [attraction.lng, attraction.lat]);
    });
}

// 景点打卡
function checkinAtAttraction(attraction, lat, lng) {
    if (!navigator.geolocation) {
        alert('您的浏览器不支持地理定位功能');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            const distance = getDistance(userLat, userLng, lat, lng);
            
            if (distance <= 1000) { // 1公里半径内
                if (confirm(`是否在 ${attraction} 打卡？`)) {
                    alert(`打卡成功！您已在 ${attraction} 打卡`);
                    addCheckinMarker({ name: attraction, lat: lat, lng: lng });
                    
                    // 保存打卡记录
                    const checkins = JSON.parse(localStorage.getItem('checkins') || '[]');
                    checkins.push({
                        attraction: attraction,
                        time: new Date().toISOString(),
                        lat: lat,
                        lng: lng
                    });
                    localStorage.setItem('checkins', JSON.stringify(checkins));
                }
            } else {
                alert(`您距离 ${attraction} 还有 ${Math.round(distance)} 米，无法打卡`);
            }
        },
        function(error) {
            alert(`获取位置失败: ${error.message}`);
        }
    );
}

// 更新打卡状态
function updateCheckinStatus(message) {
    document.getElementById('checkin-status').innerHTML = `<p>${message}</p>`;
}

// 生成分享链接
function generateShareLink() {
    const shareUrl = window.location.href;
    document.getElementById('link-input').value = shareUrl;
}

// 分享到不同平台
function shareToPlatform(platform) {
    const shareUrl = window.location.href;
    const title = '贵州4天旅行攻略';
    const text = '我正在使用贵州4天旅行攻略，快来看看吧！';
    
    switch (platform) {
        case 'wechat':
            alert('请使用微信扫描二维码分享');
            // 这里可以生成二维码
            break;
        case 'weibo':
            const weiboUrl = `http://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}&content=${encodeURIComponent(text)}`;
            window.open(weiboUrl, '_blank');
            break;
        case 'copy':
            copyShareLink();
            break;
    }
}

// 复制分享链接
function copyShareLink() {
    const linkInput = document.getElementById('link-input');
    linkInput.select();
    document.execCommand('copy');
    alert('链接已复制到剪贴板');
}

// 初始化页面
window.addEventListener('DOMContentLoaded', initPage);