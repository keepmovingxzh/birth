// 主应用程序 - 改进版
class NebulaApp {
    constructor() {
        this.nebulaCanvas = document.getElementById('nebulaCanvas');
        this.videoElement = document.getElementById('videoElement');
        this.canvasElement = document.getElementById('canvasElement');
        this.statusElement = document.getElementById('status');
        this.debugInfo = document.getElementById('debugInfo');
        
        this.nebulaRenderer = new NebulaRenderer(this.nebulaCanvas);
        this.gestureRecognizer = new GestureRecognizer();
        
        this.baseScale = 1.0;
        this.isInitialized = false;
        this.useGestureControl = false;
        
        // 开始动画（星云始终显示）
        this.animate();
        
        // 检查是否支持必要的API
        this.checkBrowserSupport();
    }
    
    checkBrowserSupport() {
        const issues = [];
        
        if (!navigator.mediaDevices || ! navigator.mediaDevices.getUserMedia) {
            issues.push('浏览器不支持摄像头访问');
        }
        
        if (typeof Hands === 'undefined') {
            issues.push('MediaPipe Hands 库未加载');
        }
        
        if (typeof Camera === 'undefined') {
            issues.push('Camera 工具未加载');
        }
        
        this.log('浏览器支持检查', issues. length === 0 ? '全部通过' : issues.join(', '));
        
        if (issues.length > 0) {
            this. showFallbackMode('部分功能不可用', issues. join('；'));
            return false;
        }
        
        // 显示开始按钮
        this. showStartButton();
        return true;
    }
    
    showStartButton() {
        const loading = document.getElementById('loading');
        const startButton = document.getElementById('startButton');
        
        if (loading) loading.style.display = 'none';
        if (startButton) {
            startButton.classList.add('active');
            startButton.onclick = () => this.init();
        }
        
        this.updateStatus('点击按钮开始体验', 'success');
    }
    
    async init() {
        const startButton = document.getElementById('startButton');
        if (startButton) startButton.style.display = 'none';
        
        this.updateStatus('正在请求摄像头权限... ', '');
        this.log('初始化', '开始初始化手势控制');
        
        try {
            // 首先请求摄像头权限
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 640, 
                    height: 480,
                    facingMode: 'user'
                } 
            });
            
            this.log('摄像头', '权限已获取');
            this.updateStatus('正在加载AI模型...', '');
            
            // 初始化 MediaPipe Hands
            this.hands = new Hands({
                locateFile: (file) => {
                    // 尝试多个CDN
                    const cdns = [
                        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
                        `https://unpkg.com/@mediapipe/hands/${file}`
                    ];
                    return cdns[0];
                }
            });
            
            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            
            this.hands.onResults((results) => this.onHandsResults(results));
            
            this.log('MediaPipe', '模型配置完成');
            this. updateStatus('正在启动摄像头...', '');
            
            // 启动摄像头
            this.camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    if (this.hands) {
                        await this.hands.send({ image: this.videoElement });
                    }
                },
                width: 640,
                height: 480
            });
            
            await this.camera.start();
            
            this.videoElement.classList.add('active');
            this.canvasElement.classList.add('active');
            
            this.isInitialized = true;
            this.useGestureControl = true;
            
            this.log('初始化', '完成！');
            this.updateStatus('✅ 就绪 - 开始使用手势控制', 'success');
            
            setTimeout(() => {
                this.statusElement.style.opacity = '0. 3';
            }, 3000);
            
        } catch (error) {
            console. error('初始化失败:', error);
            this.log('错误', error.message);
            
            let errorMessage = '初始化失败';
            let errorDetails = '';
            
            if (error.name === 'NotAllowedError') {
                errorMessage = '摄像头权限被拒绝';
                errorDetails = '请在浏览器设置中允许访问摄像头';
            } else if (error.name === 'NotFoundError') {
                errorMessage = '未找到摄像头';
                errorDetails = '请确保设备已连接摄像头';
            } else if (error.name === 'NotReadableError') {
                errorMessage = '摄像头正在被其他应用使用';
                errorDetails = '请关闭其他使用摄像头的应用';
            } else {
                errorDetails = error.message;
            }
            
            this.showFallbackMode(errorMessage, errorDetails);
        }
    }
    
    showFallbackMode(message, details) {
        this.updateStatus(`⚠️ ${message}`, 'error');
        this.log('降级模式', '使用键盘控制');
        
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
        
        const startButton = document.getElementById('startButton');
        if (startButton) startButton.style.display = 'none';
        
        // 显示备用控制
        document.querySelector('.fallback-controls').classList.add('active');
        
        // 启用键盘控制
        this.enableKeyboardControl();
        
        // 创建更详细的错误提示
        const statusDiv = this.statusElement;
        statusDiv.innerHTML = `
            ⚠️ ${message}<br>
            <small style="font-size: 12px;">${details}</small><br>
            <small style="font-size: 12px; color: #aaa;">已切换到键盘控制模式</small>
        `;
    }
    
    enableKeyboardControl() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case '-':
                case '_':
                    this.handleKeyControl('smaller');
                    break;
                case '=':
                case '+':
                    this.handleKeyControl('larger');
                    break;
                case 'ArrowLeft':
                    this.handleKeyControl('prev');
                    break;
                case 'ArrowRight':
                    this.handleKeyControl('next');
                    break;
            }
        });
        
        this.log('键盘控制', '已启用 (+/- 缩放, ←/→ 切换)');
    }
    
    handleKeyControl(action) {
        switch(action) {
            case 'smaller':
                this.baseScale = Math.max(0.3, this.baseScale - 0.1);
                this.nebulaRenderer.setScale(this.baseScale);
                this.updateStatus('缩小星云');
                break;
            case 'larger':
                this.baseScale = Math.min(3.0, this.baseScale + 0.1);
                this.nebulaRenderer.setScale(this.baseScale);
                this.updateStatus('放大星云');
                break;
            case 'prev':
                this.nebulaRenderer.previousNebula();
                this.updateStatus('上一个星云');
                this.updateNebulaInfo();
                break;
            case 'next':
                this. nebulaRenderer.nextNebula();
                this.updateStatus('下一个星云');
                this.updateNebulaInfo();
                break;
        }
        
        document.getElementById('scaleValue').textContent = 
            Math.round(this.baseScale * 100) + '%';
    }
    
    onHandsResults(results) {
        const canvasCtx = this.canvasElement. getContext('2d');
        canvasCtx.save();
        canvasCtx. clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        
        // 绘制视频帧
        canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            // 绘制手部关键点
            this.drawHand(canvasCtx, landmarks);
            
            // 识别手势
            const gesture = this.gestureRecognizer.recognizeGesture(landmarks);
            
            if (gesture) {
                // 处理缩放手势
                if (gesture. isGrabbing) {
                    this.baseScale = Math.max(0.3, this.baseScale - 0.02);
                    this.updateStatus('👊 抓握 - 缩小中');
                } else if (gesture.isOpen) {
                    this.baseScale = Math.min(3.0, this.baseScale + 0.02);
                    this.updateStatus('✋ 张开 - 放大中');
                }
                
                this.nebulaRenderer.setScale(this.baseScale);
                
                // 处理滑动手势
                if (gesture.swipe === 'swipe_left') {
                    this.nebulaRenderer.previousNebula();
                    this.updateStatus('👈 左滑 - 上一个星云');
                    this.updateNebulaInfo();
                } else if (gesture. swipe === 'swipe_right') {
                    this. nebulaRenderer.nextNebula();
                    this.updateStatus('👉 右滑 - 下一个星云');
                    this.updateNebulaInfo();
                }
                
                // 更新缩放信息
                document.getElementById('scaleValue').textContent = 
                    Math. round(this.baseScale * 100) + '%';
            }
        } else {
            // 没有检测到手
            canvasCtx.font = '20px Arial';
            canvasCtx.fillStyle = '#00ffff';
            canvasCtx.textAlign = 'center';
            canvasCtx.fillText('请将手掌放在摄像头前', this.canvasElement.width / 2, this.canvasElement.height / 2);
        }
        
        canvasCtx.restore();
    }
    
    drawHand(ctx, landmarks) {
        // 绘制手部连接线
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12],
            [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20],
            [5, 9], [9, 13], [13, 17]
        ];
        
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        
        connections.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];
            
            ctx.beginPath();
            ctx. moveTo(startPoint.x * this.canvasElement.width, startPoint.y * this.canvasElement.height);
            ctx. lineTo(endPoint.x * this.canvasElement.width, endPoint.y * this.canvasElement.height);
            ctx.stroke();
        });
        
        // 绘制关键点
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * this.canvasElement.width;
            const y = landmark.y * this.canvasElement.height;
            
            ctx.beginPath();
            ctx. arc(x, y, index === 0 ? 8 : 5, 0, Math.PI * 2);
            ctx.fillStyle = index === 0 ? '#ff00ff' : '#00ffff';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }
    
    updateStatus(message, type = '') {
        this.statusElement.textContent = message;
        this.statusElement. className = type;
        this.statusElement. style.opacity = '1';
        
        clearTimeout(this.statusTimeout);
        this.statusTimeout = setTimeout(() => {
            if (type !== 'error') {
                this. statusElement.style.opacity = '0.3';
            }
        }, 2000);
    }
    
    updateNebulaInfo() {
        const nebula = this. nebulaRenderer.getCurrentNebula();
        document.getElementById('nebulaType').textContent = nebula.name;
        document.getElementById('nebulaType').style.color = nebula. color;
    }
    
    log(category, message) {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${category}: ${message}`;
        console.log(logMessage);
        
        // 显示调试信息（可选）
        if (this. debugInfo) {
            this. debugInfo.classList.add('active');
            const line = document.createElement('div');
            line.textContent = logMessage;
            this.debugInfo.appendChild(line);
            
            // 只保留最后10条
            while (this.debugInfo.children.length > 10) {
                this.debugInfo.removeChild(this.debugInfo.firstChild);
            }
        }
    }
    
    animate() {
        this.nebulaRenderer.render();
        requestAnimationFrame(() => this.animate());
    }
}

// 启动应用
let app;
window.addEventListener('DOMContentLoaded', () => {
    try {
        app = new NebulaApp();
    } catch (error) {
        console. error('应用启动失败:', error);
        document.getElementById('status').innerHTML = `
            ❌ 应用启动失败<br>
            <small>${error.message}</small>
        `;
    }
});