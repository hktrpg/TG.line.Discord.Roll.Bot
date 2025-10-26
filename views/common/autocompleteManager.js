/**
 * 泛用自動完成管理器
 * 提供統一的自動完成功能，支持多種數據源和配置
 */
class AutocompleteManager {
    constructor() {
        this.modules = {};
        this.activeAutocomplete = null;
        this.defaultConfig = {
            limit: 8,
            minQueryLength: 1,
            placeholder: '輸入搜尋關鍵字...',
            noResultsText: '找不到相關結果',
            debounceDelay: 300
        };
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

        // 如果已經有自動完成實例，先移除
        if (this.activeAutocomplete) {
            this.activeAutocomplete.destroy();
        }

        const autocomplete = new Autocomplete(input, {
            ...this.defaultConfig,
            ...config
        });

        this.activeAutocomplete = autocomplete;
        return autocomplete;
    }

    /**
     * 獲取模組配置
     * @param {string} name - 模組名稱
     * @returns {Object|null} 模組配置
     */
    getModuleConfig(name) {
        return this.modules[name] || null;
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
        this.dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
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

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        this.data = await response.json();
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

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API search failed: ${response.status}`);
        }
        
        return await response.json();
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
        } else {
            this.dropdown.style.top = '100%';
            this.dropdown.style.bottom = 'auto';
            this.dropdown.style.borderTop = 'none';
            this.dropdown.style.borderBottom = '1px solid #ccc';
            this.dropdown.style.borderRadius = '0 0 6px 6px';
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
        element.style.cssText = `
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid #eee;
        `;

        // 創建顯示內容
        const displayText = this.createDisplayText(item);
        element.innerHTML = displayText;

        // 添加懸停效果
        element.addEventListener('mouseenter', () => {
            this.selectedIndex = index;
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
            if (item.metadata.stage) metadata.push(`<span class="badge badge-secondary">${this.escapeHtml(item.metadata.stage)}</span>`);
            if (item.metadata.attribute) metadata.push(`<span class="badge badge-info">${this.escapeHtml(item.metadata.attribute)}</span>`);
            if (item.metadata['zh-cn-name'] && item.metadata['zh-cn-name'] !== item.display) {
                metadata.push(`<span class="text-muted">${this.escapeHtml(item.metadata['zh-cn-name'])}</span>`);
            }
            
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
            if (index === this.selectedIndex) {
                item.style.backgroundColor = '#f8f9fa';
            } else {
                item.style.backgroundColor = '';
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

        // 點擊外部隱藏
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.dropdown.contains(e.target)) {
                this.hideDropdown();
            }
        });

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
