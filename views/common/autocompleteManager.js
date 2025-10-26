/**
 * 泛用自動完成管理器
 * 提供統一的自動完成功能，支持多種數據源和配置
 */
class AutocompleteManager {
    constructor() {
        this.modules = {};
        this.activeAutocomplete = new Map(); // 改為 Map 支援多個實例
        this.browserCache = new Map(); // 瀏覽器端快取
        this.requestQueue = new Map(); // 請求佇列，避免重複請求
        this.defaultConfig = {
            limit: 8,
            minQueryLength: 1,
            placeholder: '輸入搜尋關鍵字...',
            noResultsText: '找不到相關結果',
            debounceDelay: 300,
            cacheTimeout: 5 * 60 * 1000, // 5分鐘快取
            maxCacheSize: 100, // 最大快取項目數
            enablePrefetch: true, // 啟用預載入
            prefetchDelay: 1000 // 預載入延遲
        };
        
        // 定期清理過期快取
        setInterval(() => this.cleanupCache(), 60000);
    }

    /**
     * 註冊自動完成模組
     * @param {string} name - 模組名稱
     * @param {Object} config - 模組配置
     */
    registerModule(name, config) {
        this.modules[name] = {
            ...this.defaultConfig,
            ...config
        };
    }

    /**
     * 為輸入框添加自動完成功能
     * @param {HTMLInputElement} input - 輸入框元素
     * @param {Object} config - 自動完成配置
     * @returns {Autocomplete} 自動完成實例
     */
    attachToInput(input, config) {
        if (!input || !config) {
            console.error('AutocompleteManager: Invalid input or config');
            return null;
        }

        // 為每個輸入框生成唯一ID
        const inputId = this.generateInputId(input);
        
        // 如果該輸入框已經有自動完成實例，先移除
        if (this.activeAutocomplete.has(inputId)) {
            this.activeAutocomplete.get(inputId).destroy();
        }

        const autocomplete = new Autocomplete(input, {
            ...this.defaultConfig,
            ...config
        });

        this.activeAutocomplete.set(inputId, autocomplete);
        return autocomplete;
    }

    /**
     * 為輸入框生成唯一ID
     * @param {HTMLInputElement} input - 輸入框元素
     * @returns {string} 唯一ID
     */
    generateInputId(input) {
        // 嘗試使用現有的ID
        if (input.id) {
            return input.id;
        }
        
        // 嘗試使用name屬性
        if (input.name) {
            return input.name;
        }
        
        // 生成基於位置和屬性的ID
        const form = input.closest('form');
        const formId = form ? form.id || 'form' : 'no-form';
        const inputIndex = Array.from(document.querySelectorAll('input')).indexOf(input);
        return `${formId}_input_${inputIndex}_${Date.now()}`;
    }

    /**
     * 獲取模組配置
     * @param {string} name - 模組名稱
     * @returns {Object|null} 模組配置
     */
    getModuleConfig(name) {
        return this.modules[name] || null;
    }
    
    /**
     * 快取管理方法
     */
    setCache(key, value, ttl = this.defaultConfig.cacheTimeout) {
        this.browserCache.set(key, {
            value,
            expires: Date.now() + ttl
        });
        
        // 限制快取大小
        if (this.browserCache.size > this.defaultConfig.maxCacheSize) {
            const firstKey = this.browserCache.keys().next().value;
            this.browserCache.delete(firstKey);
        }
    }
    
    getCache(key) {
        const item = this.browserCache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expires) {
            this.browserCache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    cleanupCache() {
        const now = Date.now();
        for (const [key, item] of this.browserCache.entries()) {
            if (now > item.expires) {
                this.browserCache.delete(key);
            }
        }
    }
    
    /**
     * 預載入數據
     * @param {string} module - 模組名稱
     * @param {Object} config - 配置
     */
    async prefetchData(module, config) {
        if (!this.defaultConfig.enablePrefetch) return;
        
        const cacheKey = `prefetch:${module}`;
        if (this.getCache(cacheKey)) return; // 已經預載入過
        
        try {
            const url = `/api/autocomplete/${module}?limit=${config.limit || 8}`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                this.setCache(cacheKey, data, this.defaultConfig.cacheTimeout);
            }
        } catch (error) {
            console.warn('Prefetch failed:', error);
        }
    }
    
    /**
     * 智能請求管理
     * @param {string} url - 請求URL
     * @param {Object} options - 請求選項
     * @returns {Promise} 請求結果
     */
    async smartRequest(url, options = {}) {
        // 檢查是否已有相同的請求在進行中
        if (this.requestQueue.has(url)) {
            return this.requestQueue.get(url);
        }
        
        const requestPromise = fetch(url, options)
            .then(response => {
                this.requestQueue.delete(url);
                return response;
            })
            .catch(error => {
                this.requestQueue.delete(url);
                throw error;
            });
        
        this.requestQueue.set(url, requestPromise);
        return requestPromise;
    }
}

/**
 * 自動完成類
 * 處理單個輸入框的自動完成邏輯
 */
class Autocomplete {
    constructor(input, config) {
        this.input = input;
        this.config = config;
        this.dropdown = null;
        this.data = [];
        this.selectedIndex = -1;
        this.debounceTimer = null;
        this.isVisible = false;
        this.clickHandler = null; // 存儲點擊事件處理器
        
        this.init();
    }

    /**
     * 初始化自動完成
     */
    async init() {
        this.createDropdown();
        await this.loadData();
        this.attachEvents();
    }

    /**
     * 創建下拉選單元素
     */
    createDropdown() {
        // 移除已存在的下拉選單
        const existing = this.input.parentNode.querySelector('.autocomplete-dropdown');
        if (existing) {
            existing.remove();
        }

        this.dropdown = document.createElement('div');
        this.dropdown.className = 'autocomplete-dropdown';
        this.dropdown.id = `autocomplete-dropdown-${this.input.name || this.input.id || Date.now()}`;
        this.dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            border: 1px solid #ccc;
            border-top: none;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1100;
            display: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-radius: 0 0 6px 6px;
        `;

        // 確保輸入框的父元素有相對定位
        if (getComputedStyle(this.input.parentNode).position === 'static') {
            this.input.parentNode.style.position = 'relative';
        }

        this.input.parentNode.appendChild(this.dropdown);
    }

    /**
     * 載入數據
     */
    async loadData() {
        try {
            switch (this.config.dataSource) {
                case 'api':
                    await this.loadFromAPI();
                    break;
                case 'static':
                    this.data = this.config.staticData || [];
                    break;
                case 'function':
                    await this.loadFromFunction();
                    break;
                default:
                    console.warn('Autocomplete: Unknown data source:', this.config.dataSource);
            }
            
            // 預載入數據（如果啟用）
            if (this.config.dataSource === 'api' && this.config.module) {
                setTimeout(() => {
                    window.autocompleteManager.prefetchData(this.config.module, this.config);
                }, this.config.prefetchDelay || 1000);
            }
        } catch (error) {
            console.error('Autocomplete: Failed to load data:', error);
            this.data = [];
        }
    }

    /**
     * 從API載入數據
     */
    async loadFromAPI() {
        const { endpoint, module } = this.config;
        let url = endpoint;
        
        if (module) {
            url = `/api/autocomplete/${module}`;
        }

        // 檢查快取
        const cacheKey = `data:${url}`;
        const cachedData = window.autocompleteManager.getCache(cacheKey);
        if (cachedData) {
            this.data = cachedData;
            return;
        }

        try {
            const response = await window.autocompleteManager.smartRequest(url);
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            
            this.data = await response.json();
            
            // 快取數據
            window.autocompleteManager.setCache(cacheKey, this.data);
        } catch (error) {
            console.error('API load error:', error);
            this.data = [];
        }
    }

    /**
     * 從函數載入數據
     */
    async loadFromFunction() {
        if (typeof this.config.searchFunction === 'function') {
            this.data = await this.config.searchFunction();
        } else if (typeof this.config.searchFunction === 'string') {
            // 假設是全局函數
            const func = window[this.config.searchFunction];
            if (typeof func === 'function') {
                this.data = await func();
            }
        }
    }

    /**
     * 搜尋數據
     * @param {string} query - 搜尋查詢
     * @returns {Array} 搜尋結果
     */
    async search(query) {
        if (!query || query.length < this.config.minQueryLength) {
            return [];
        }

        // 如果使用API，直接調用API搜尋
        if (this.config.dataSource === 'api') {
            return await this.searchFromAPI(query);
        }

        // 本地搜尋
        const filtered = this.data.filter(item => {
            return this.config.searchFields.some(field => {
                const value = this.getFieldValue(item, field);
                return value && value.toString().toLowerCase().includes(query.toLowerCase());
            });
        });

        return filtered.slice(0, this.config.limit);
    }

    /**
     * 從API搜尋
     * @param {string} query - 搜尋查詢
     * @returns {Array} 搜尋結果
     */
    async searchFromAPI(query) {
        const { endpoint, module } = this.config;
        let url = endpoint;
        
        if (module) {
            url = `/api/autocomplete/${module}?q=${encodeURIComponent(query)}&limit=${this.config.limit}`;
        } else {
            url += `?q=${encodeURIComponent(query)}&limit=${this.config.limit}`;
        }

        // 檢查搜尋快取
        const cacheKey = `search:${url}`;
        const cachedResults = window.autocompleteManager.getCache(cacheKey);
        if (cachedResults) {
            return cachedResults;
        }

        try {
            const response = await window.autocompleteManager.smartRequest(url);
            if (!response.ok) {
                throw new Error(`API search failed: ${response.status}`);
            }
            
            const results = await response.json();
            
            // 快取搜尋結果（較短時間）
            window.autocompleteManager.setCache(cacheKey, results, 2 * 60 * 1000); // 2分鐘
            
            return results;
        } catch (error) {
            console.error('API search error:', error);
            return [];
        }
    }

    /**
     * 獲取對象字段值
     * @param {Object} item - 數據項
     * @param {string} field - 字段名
     * @returns {*} 字段值
     */
    getFieldValue(item, field) {
        if (!item || !field) return '';
        
        // 支持嵌套字段，如 'metadata.stage'
        const fields = field.split('.');
        let value = item;
        
        for (const f of fields) {
            if (value && typeof value === 'object' && f in value) {
                value = value[f];
            } else {
                return '';
            }
        }
        
        return value || '';
    }

    /**
     * 顯示搜尋結果
     * @param {Array} results - 搜尋結果
     */
    showResults(results) {
        if (!this.dropdown) return;

        this.dropdown.innerHTML = '';

        if (results.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'autocomplete-item no-results';
            noResults.textContent = this.config.noResultsText;
            this.dropdown.appendChild(noResults);
        } else {
            results.forEach((item, index) => {
                const itemElement = this.createItemElement(item, index);
                this.dropdown.appendChild(itemElement);
            });
        }

        this.dropdown.style.display = 'block';
        this.isVisible = true;
        this.selectedIndex = -1;
        
        // 智能定位：檢查是否會被遮擋
        this.adjustDropdownPosition();
    }

    /**
     * 調整下拉選單位置，避免被遮擋
     */
    adjustDropdownPosition() {
        if (!this.dropdown || !this.input) return;

        const inputRect = this.input.getBoundingClientRect();
        const dropdownRect = this.dropdown.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // 檢查下拉選單是否會被快速輸入面板遮擋
        const quickInputPad = document.getElementById('quickInputPad');
        let quickInputBottom = 0;
        
        if (quickInputPad && quickInputPad.classList.contains('expanded')) {
            const quickInputRect = quickInputPad.getBoundingClientRect();
            quickInputBottom = quickInputRect.top;
        }
        
        // 檢查是否會被底部遮擋
        const dropdownBottom = inputRect.bottom + dropdownRect.height;
        const availableSpace = quickInputBottom > 0 ? 
            Math.min(viewportHeight, quickInputBottom) - inputRect.bottom :
            viewportHeight - inputRect.bottom;
        
        // 如果空間不足，嘗試向上顯示
        if (dropdownRect.height > availableSpace && inputRect.top > dropdownRect.height) {
            this.dropdown.style.top = 'auto';
            this.dropdown.style.bottom = '100%';
            this.dropdown.style.borderTop = '1px solid #ccc';
            this.dropdown.style.borderBottom = 'none';
            this.dropdown.style.borderRadius = '6px 6px 0 0';
            this.dropdown.classList.add('autocomplete-dropdown-up');
        } else {
            this.dropdown.style.top = '100%';
            this.dropdown.style.bottom = 'auto';
            this.dropdown.style.borderTop = 'none';
            this.dropdown.style.borderBottom = '1px solid #ccc';
            this.dropdown.style.borderRadius = '0 0 6px 6px';
            this.dropdown.classList.remove('autocomplete-dropdown-up');
        }
    }

    /**
     * 創建結果項元素
     * @param {Object} item - 數據項
     * @param {number} index - 索引
     * @returns {HTMLElement} 結果項元素
     */
    createItemElement(item, index) {
        const element = document.createElement('div');
        element.className = 'autocomplete-item';
        element.dataset.index = index;

        // 創建顯示內容
        const displayText = this.createDisplayText(item);
        element.innerHTML = displayText;

        // 添加懸停效果
        element.addEventListener('mouseenter', () => {
            this.selectedIndex = index;
            this.updateSelection();
        });
        
        // 添加滑鼠離開效果
        element.addEventListener('mouseleave', () => {
            this.selectedIndex = -1;
            this.updateSelection();
        });

        // 添加點擊事件
        element.addEventListener('click', () => {
            this.selectItem(item);
        });

        return element;
    }

    /**
     * 創建顯示文本
     * @param {Object} item - 數據項
     * @returns {string} HTML字符串
     */
    createDisplayText(item) {
        let html = `<div class="autocomplete-main">${this.escapeHtml(item.display || item.value)}</div>`;
        
        // 添加元數據信息
        if (item.metadata) {
            const metadata = [];
            
            // 數碼寶貝相關元數據
            if (item.metadata.stage) metadata.push(`<span class="badge badge-secondary">${this.escapeHtml(item.metadata.stage)}</span>`);
            if (item.metadata.attribute) metadata.push(`<span class="badge badge-info">${this.escapeHtml(item.metadata.attribute)}</span>`);
            if (item.metadata['zh-cn-name'] && item.metadata['zh-cn-name'] !== item.display) {
                metadata.push(`<span class="text-muted">${this.escapeHtml(item.metadata['zh-cn-name'])}</span>`);
            }
            
            // 招式相關元數據
            if (item.metadata.digimon) metadata.push(`<span class="badge badge-primary">${this.escapeHtml(item.metadata.digimon)}</span>`);
            if (item.metadata.element) metadata.push(`<span class="badge badge-warning">${this.escapeHtml(item.metadata.element)}</span>`);
            if (item.metadata.type) metadata.push(`<span class="badge badge-success">${this.escapeHtml(item.metadata.type)}</span>`);
            if (item.metadata.power) metadata.push(`<span class="text-muted">威力: ${this.escapeHtml(item.metadata.power)}</span>`);
            
            if (metadata.length > 0) {
                html += `<div class="autocomplete-meta">${metadata.join(' ')}</div>`;
            }
        }
        
        return html;
    }

    /**
     * HTML轉義
     * @param {string} text - 原始文本
     * @returns {string} 轉義後的文本
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 更新選中狀態
     */
    updateSelection() {
        if (!this.dropdown) return;

        const items = this.dropdown.querySelectorAll('.autocomplete-item');
        items.forEach((item, index) => {
            if (index === this.selectedIndex && this.selectedIndex >= 0) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    /**
     * 選擇項目
     * @param {Object} item - 選中的項目
     */
    selectItem(item) {
        this.input.value = item.value;
        this.hideDropdown();
        
        // 觸發自定義事件
        const event = new CustomEvent('autocomplete-select', {
            detail: { item, input: this.input }
        });
        this.input.dispatchEvent(event);
    }

    /**
     * 隱藏下拉選單
     */
    hideDropdown() {
        if (this.dropdown) {
            this.dropdown.style.display = 'none';
        }
        this.isVisible = false;
        this.selectedIndex = -1;
    }

    /**
     * 綁定事件
     */
    attachEvents() {
        // 輸入事件
        this.input.addEventListener('input', (e) => {
            this.handleInput(e.target.value);
        });

        // 鍵盤事件
        this.input.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });

        // 焦點事件
        this.input.addEventListener('focus', () => {
            if (this.input.value.length >= this.config.minQueryLength) {
                this.handleInput(this.input.value);
            }
        });

        // 點擊外部隱藏 - 使用實例特定的處理器
        this.clickHandler = (e) => {
            if (this.input && this.dropdown && 
                !this.input.contains(e.target) && !this.dropdown.contains(e.target)) {
                this.hideDropdown();
            }
        };
        document.addEventListener('click', this.clickHandler);

        // 監聽快速輸入面板的展開/收起
        this.observeQuickInputPad();
    }

    /**
     * 監聽快速輸入面板狀態變化
     */
    observeQuickInputPad() {
        const quickInputPad = document.getElementById('quickInputPad');
        if (!quickInputPad) return;

        // 使用 MutationObserver 監聽 class 變化
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    // 當快速輸入面板狀態改變時，重新調整下拉選單位置
                    if (this.isVisible) {
                        setTimeout(() => {
                            this.adjustDropdownPosition();
                        }, 100); // 稍微延遲以確保動畫完成
                    }
                }
            });
        });

        observer.observe(quickInputPad, {
            attributes: true,
            attributeFilter: ['class']
        });

        // 監聽窗口大小變化
        window.addEventListener('resize', () => {
            if (this.isVisible) {
                this.adjustDropdownPosition();
            }
        });
    }

    /**
     * 處理輸入
     * @param {string} value - 輸入值
     */
    handleInput(value) {
        // 清除之前的定時器
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // 設置防抖
        this.debounceTimer = setTimeout(async () => {
            if (value.length >= this.config.minQueryLength) {
                try {
                    const results = await this.search(value);
                    this.showResults(results);
                } catch (error) {
                    console.error('Autocomplete search error:', error);
                    this.hideDropdown();
                }
            } else {
                this.hideDropdown();
            }
        }, this.config.debounceDelay);
    }

    /**
     * 處理鍵盤事件
     * @param {KeyboardEvent} e - 鍵盤事件
     */
    handleKeydown(e) {
        if (!this.isVisible) return;

        const items = this.dropdown.querySelectorAll('.autocomplete-item:not(.no-results)');
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
                this.updateSelection();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection();
                break;
                
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                    const item = this.data.find((_, index) => index === this.selectedIndex);
                    if (item) {
                        this.selectItem(item);
                    }
                }
                break;
                
            case 'Escape':
                this.hideDropdown();
                break;
        }
    }

    /**
     * 銷毀自動完成實例
     */
    destroy() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        // 移除事件監聽器
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }
        
        if (this.dropdown) {
            this.dropdown.remove();
            this.dropdown = null;
        }
        
        this.input = null;
        this.data = [];
    }
}

// 創建全局實例
window.autocompleteManager = new AutocompleteManager();

// 導出類（如果使用模組系統）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AutocompleteManager, Autocomplete };
}
