class SkyboxExplorer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cube = null;
        this.isAutoRotating = false;
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        
        this.init();
        this.setupEventListeners();
        this.setupMouseControls();
    }

    init() {
        // 初始化 Three.js 場景
        this.scene = new THREE.Scene();
        
        // 設置相機
        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 0, 0.1);
        
        // 設置渲染器
        const container = document.getElementById('skybox-container');
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(this.renderer.domElement);

        // 處理窗口大小變化
        window.addEventListener('resize', () => {
            this.camera.aspect = container.clientWidth / container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(container.clientWidth, container.clientHeight);
        });
        
        this.animate();
    }

    setupMouseControls() {
        const container = document.getElementById('skybox-container');

        container.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.previousMousePosition = {
                x: e.clientX,
                y: e.clientY
            };
        });

        container.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.cube) return;

            const deltaMove = {
                x: e.clientX - this.previousMousePosition.x,
                y: e.clientY - this.previousMousePosition.y
            };

            const rotationSpeed = 0.005;
            this.cube.rotation.y += deltaMove.x * rotationSpeed;
            this.cube.rotation.x += deltaMove.y * rotationSpeed;

            this.previousMousePosition = {
                x: e.clientX,
                y: e.clientY
            };
        });

        container.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        container.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });

        // 添加觸摸事件支持
        container.addEventListener('touchstart', (e) => {
            this.isDragging = true;
            this.previousMousePosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        });

        container.addEventListener('touchmove', (e) => {
            if (!this.isDragging || !this.cube) return;

            const deltaMove = {
                x: e.touches[0].clientX - this.previousMousePosition.x,
                y: e.touches[0].clientY - this.previousMousePosition.y
            };

            const rotationSpeed = 0.005;
            this.cube.rotation.y += deltaMove.x * rotationSpeed;
            this.cube.rotation.x += deltaMove.y * rotationSpeed;

            this.previousMousePosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };

            // 防止觸摸時頁面滾動
            e.preventDefault();
        });

        container.addEventListener('touchend', () => {
            this.isDragging = false;
        });
    }

    loadSkybox(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const image = new Image();
            image.onload = () => {
                // 檢查圖片比例是否為 2:1
                const aspectRatio = image.width / image.height;
                if (Math.abs(aspectRatio - 2) > 0.1) {
                    alert('請上傳 2:1 比例的全景圖片');
                    return;
                }

                // 創建球形幾何體
                const geometry = new THREE.SphereGeometry(50, 60, 40);
                // 翻轉幾何體內部
                geometry.scale(-1, 1, 1);

                // 創建材質
                const texture = new THREE.Texture(image);
                texture.needsUpdate = true;
                const material = new THREE.MeshBasicMaterial({
                    map: texture
                });

                // 如果已存在 cube，則從場景中移除
                if (this.cube) {
                    this.scene.remove(this.cube);
                }

                // 創建網格並添加到場景
                this.cube = new THREE.Mesh(geometry, material);
                this.scene.add(this.cube);

                // 顯示圖片信息
                this.showImageInfo(file, image);
            };
            image.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    showImageInfo(file, image) {
        const container = document.createElement('div');
        container.className = 'image-info';
        container.innerHTML = `
            <p>文件名：${file.name}</p>
            <p>尺寸：${image.width} x ${image.height}</p>
            <p>大小：${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
        `;

        const existingInfo = document.querySelector('.image-info');
        if (existingInfo) {
            existingInfo.remove();
        }

        document.querySelector('.upload-section').appendChild(container);
    }

    zoom(factor) {
        if (this.camera.position.z > 0.1 || factor > 1) {
            this.camera.position.z = Math.max(0.1, this.camera.position.z * factor);
        }
    }

    toggleAutoRotate() {
        this.isAutoRotating = !this.isAutoRotating;
        document.getElementById('auto-rotate').classList.toggle('active');
    }

    toggleFullscreen() {
        const container = document.getElementById('skybox-container');
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.error('全屏模式錯誤:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.isAutoRotating && this.cube && !this.isDragging) {
            this.cube.rotation.y += 0.001;
        }

        this.renderer.render(this.scene, this.camera);
    }

    setupEventListeners() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.loadSkybox(file);
            }
        });

        dropZone.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadSkybox(file);
            }
        });

        document.getElementById('zoom-in').addEventListener('click', () => this.zoom(0.9));
        document.getElementById('zoom-out').addEventListener('click', () => this.zoom(1.1));
        document.getElementById('auto-rotate').addEventListener('click', () => this.toggleAutoRotate());
        document.getElementById('fullscreen').addEventListener('click', () => this.toggleFullscreen());
    }
}

// 初始化應用
window.addEventListener('DOMContentLoaded', () => {
    new SkyboxExplorer();
}); 