// 手势识别引擎
class GestureRecognizer {
    constructor() {
        this.previousHandPositionX = null;
        this.gestureStartTime = 0;
        this.gestureThreshold = 100; // 滑动距离阈值
        this. gestureTimeThreshold = 500; // 手势时间窗口(ms)
        this.lastGestureTime = 0;
        this.gestureCooldown = 1000; // 手势冷却时间(ms)
    }
    
    // 计算手指间的平均距离（用于判断抓握/张开）
    calculateHandOpenness(landmarks) {
        if (! landmarks || landmarks.length < 21) return 0;
        
        const palm = landmarks[0]; // 手腕
        const fingers = [
            landmarks[4],  // 拇指
            landmarks[8],  // 食指
            landmarks[12], // 中指
            landmarks[16], // 无名指
            landmarks[20]  // 小指
        ];
        
        let totalDistance = 0;
        fingers.forEach(finger => {
            const dx = finger.x - palm.x;
            const dy = finger. y - palm.y;
            totalDistance += Math.sqrt(dx * dx + dy * dy);
        });
        
        return totalDistance / fingers.length;
    }
    
    // 检测左右滑动手势
    detectSwipe(landmarks) {
        if (!landmarks || landmarks.length < 21) return null;
        
        const currentTime = Date.now();
        
        // 检查冷却时间
        if (currentTime - this.lastGestureTime < this.gestureCooldown) {
            return null;
        }
        
        const handCenterX = landmarks[9]. x; // 使用中指根部作为手的中心
        
        if (this.previousHandPositionX === null) {
            this. previousHandPositionX = handCenterX;
            this.gestureStartTime = currentTime;
            return null;
        }
        
        const deltaX = handCenterX - this.previousHandPositionX;
        const deltaTime = currentTime - this.gestureStartTime;
        
        let gesture = null;
        
        // 检测左滑
        if (deltaX < -this.gestureThreshold && deltaTime < this.gestureTimeThreshold) {
            gesture = 'swipe_left';
            this.lastGestureTime = currentTime;
            this.previousHandPositionX = null;
        }
        // 检测右滑
        else if (deltaX > this. gestureThreshold && deltaTime < this.gestureTimeThreshold) {
            gesture = 'swipe_right';
            this. lastGestureTime = currentTime;
            this.previousHandPositionX = null;
        }
        // 如果时间窗口过期，重置
        else if (deltaTime > this.gestureTimeThreshold) {
            this.previousHandPositionX = handCenterX;
            this. gestureStartTime = currentTime;
        }
        
        return gesture;
    }
    
    // 综合手势识别
    recognizeGesture(landmarks) {
        if (!landmarks) return null;
        
        const openness = this.calculateHandOpenness(landmarks);
        const swipe = this.detectSwipe(landmarks);
        
        return {
            openness: openness,
            swipe: swipe,
            isGrabbing: openness < 0.15,
            isOpen: openness > 0.25
        };
    }
}