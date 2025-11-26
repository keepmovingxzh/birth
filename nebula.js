// 星云渲染引擎
class NebulaRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        
        this.scale = 1.0;
        this.targetScale = 1.0;
        this.currentNebulaIndex = 0;
        this. particles = [];
        
        this.nebulaTypes = [
            { name: '螺旋星云', type: 'spiral', color: '#ff00ff' },
            { name: '球状星云', type: 'spherical', color: '#00ffff' },
            { name: '环状星云', type: 'ring', color: '#ffff00' },
            { name: '椭圆星云', type: 'elliptical', color: '#ff6600' },
            { name: '不规则星云', type: 'irregular', color: '#00ff00' }
        ];
        
        this.initParticles();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas. width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this. centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }
    
    initParticles() {
        this.particles = [];
        const particleCount = 2000;
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                angle: Math.random() * Math. PI * 2,
                distance: Math.random() * 300,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.002 + 0.001,
                opacity: Math.random() * 0.8 + 0.2,
                colorOffset: Math.random() * 60 - 30
            });
        }
    }
    
    getCurrentNebula() {
        return this.nebulaTypes[this. currentNebulaIndex];
    }
    
    nextNebula() {
        this. currentNebulaIndex = (this.currentNebulaIndex + 1) % this.nebulaTypes.length;
        this.initParticles();
    }
    
    previousNebula() {
        this.currentNebulaIndex = (this.currentNebulaIndex - 1 + this.nebulaTypes.length) % this. nebulaTypes.length;
        this.initParticles();
    }
    
    setScale(scale) {
        this. targetScale = Math.max(0.3, Math.min(3.0, scale));
    }
    
    getParticlePosition(particle, nebulaType) {
        const { angle, distance } = particle;
        let x, y, radius;
        
        switch(nebulaType) {
            case 'spiral':
                radius = distance * (1 + angle / (Math.PI * 2));
                x = Math.cos(angle) * radius;
                y = Math.sin(angle) * radius;
                break;
                
            case 'spherical':
                const phi = Math.acos(2 * (distance / 300) - 1);
                radius = distance;
                x = Math.cos(angle) * Math.sin(phi) * radius;
                y = Math.sin(angle) * Math.sin(phi) * radius * 0.7;
                break;
                
            case 'ring':
                radius = 150 + distance * 0.5;
                const thickness = 50;
                const ringOffset = (Math.random() - 0.5) * thickness;
                x = Math. cos(angle) * (radius + ringOffset);
                y = Math.sin(angle) * (radius + ringOffset) * 0.3;
                break;
                
            case 'elliptical':
                x = Math.cos(angle) * distance * 1.5;
                y = Math.sin(angle) * distance * 0.6;
                break;
                
            case 'irregular':
                const noise = Math.sin(angle * 5) * 50;
                radius = distance + noise;
                x = Math. cos(angle) * radius;
                y = Math.sin(angle) * radius;
                break;
                
            default:
                x = Math.cos(angle) * distance;
                y = Math. sin(angle) * distance;
        }
        
        return { x, y };
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }
    
    render() {
        // 平滑缩放
        this.scale += (this.targetScale - this.scale) * 0.1;
        
        // 清空画布
        this.ctx. fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx. fillRect(0, 0, this.canvas.width, this. canvas.height);
        
        const nebula = this.getCurrentNebula();
        const baseColor = this.hexToRgb(nebula.color);
        
        // 绘制星云
        this.ctx.save();
        this.ctx.translate(this.centerX, this. centerY);
        this.ctx.scale(this.scale, this.scale);
        
        // 更新和绘制粒子
        this.particles.forEach(particle => {
            particle.angle += particle.speed;
            
            const pos = this.getParticlePosition(particle, nebula.type);
            
            // 颜色渐变
            const r = Math.max(0, Math.min(255, baseColor.r + particle.colorOffset));
            const g = Math.max(0, Math.min(255, baseColor. g + particle.colorOffset));
            const b = Math.max(0, Math.min(255, baseColor.b + particle.colorOffset));
            
            // 绘制粒子
            this.ctx.beginPath();
            this.ctx. arc(pos.x, pos. y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${particle. opacity})`;
            this.ctx.fill();
            
            // 添加光晕效果
            if (particle.size > 1.5) {
                const gradient = this.ctx.createRadialGradient(
                    pos.x, pos.y, 0,
                    pos.x, pos.y, particle.size * 3
                );
                gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${particle.opacity * 0.3})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                this.ctx.beginPath();
                this.ctx. arc(pos.x, pos. y, particle.size * 3, 0, Math.PI * 2);
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }
        });
        
        this.ctx.restore();
        
        // 绘制中心光源
        const centerGradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, 100 * this.scale
        );
        centerGradient.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0. 3)`);
        centerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.ctx.beginPath();
        this.ctx. arc(this.centerX, this.centerY, 100 * this.scale, 0, Math.PI * 2);
        this.ctx.fillStyle = centerGradient;
        this. ctx.fill();
    }
}