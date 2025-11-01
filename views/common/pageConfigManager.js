// 統一頁面配置管理器 - 處理不同頁面的配置差異
class PageConfigManager {
    constructor() {
        this.configs = {
            private: {
                title: "Character Card 角色卡",
                bodyClass: "",
                containerClass: "container-fluid px-3 px-md-4 py-3",
                vueContainerClass: "container-fluid px-3 px-md-4 py-3",
                isPublic: false,
                socketListeners: this.getPrivateSocketListeners(),
                initialization: this.getPrivateInitialization()
            },
            public: {
                title: "Character Card 角色卡",
                bodyClass: "center container",
                containerClass: "container",
                vueContainerClass: "container",
                isPublic: true,
                socketListeners: this.getPublicSocketListeners(),
                initialization: this.getPublicInitialization()
            }
        };
    }

    // 獲取頁面配置
    getConfig(pageType) {
        return this.configs[pageType] || this.configs.private;
    }

    // 私有頁面Socket監聽器
    getPrivateSocketListeners() {
        return `
        // Private card specific socket listeners
        socket.on('cardUpdated', function(data) {
            if (data && data.success) {
                $('#warning-update').show();
                setTimeout(() => $('#warning-update').hide(), 3000);
            } else {
                $('#warning-updateError').show();
                setTimeout(() => $('#warning-updateError').hide(), 3000);
            }
        });
        `;
    }

    // 公開頁面Socket監聽器
    getPublicSocketListeners() {
        return `
        // Public card specific socket listeners
        socket.on("getPublicListInfo", function (listInfo) {
            let list = listInfo.temp;
            if (list) {
                if (cardList && cardList.list) {
                    cardList.list = list;
                    $('#cardListModal').modal("show");
                    debugLog('Public card list loaded successfully', 'info');
                } else {
                    debugLog('CardList Vue app not initialized', 'error');
                }
            } else {
                debugLog('Failed to load public card list', 'error');
            }
        });

        socket.on("getPublicCardInfo", function (cardInfo) {
            if (cardInfo && cardInfo.temp) {
                const cardData = cardInfo.temp;

                // 清除之前的原始數據，避免不同卡片的數據混合
                card.originalData = null;
                card.hasUnsavedChanges = false;

                card._id = cardData._id;
                card.id = cardData.id;
                card.name = cardData.name;
                card.state = cardData.state || [];
                card.roll = cardData.roll || [];
                card.notes = cardData.notes || [];
                card.public = cardData.public || false;
                $('#cardListModal').modal("hide");

                // 保存新卡片的原始數據
                card.$nextTick(() => {
                    card.saveOriginalData();
                });

                debugLog('Card data loaded successfully', 'info');
            } else {
                debugLog('Failed to load card data', 'error');
            }
        });

        // Public card utility functions
        function getTheSelectedOne(index) {
            if (cardList && cardList.list && cardList.list[index]) {
                const selectedCard = cardList.list[index];
                socket.emit('getPublicCardInfo', {
                    cardId: selectedCard._id
                });
            } else {
                debugLog('Invalid card selection', 'error');
            }
        }

        function newItem(form) {
            switch (form) {
                case 0:
                    card.state.push({ itemA: "" });
                    break;
                case 1:
                    card.roll.push({ itemA: "" });
                    break;
                case 2:
                    card.notes.push({ itemA: "" });
                    break;
                default:
                    break;
            }
        }

        function removeItem(form) {
            switch (form) {
                case 0:
                    card.state.pop();
                    break;
                case 1:
                    card.roll.pop();
                    break;
                case 2:
                    card.notes.pop();
                    break;
                default:
                    break;
            }
        }
        `;
    }

    // 私有頁面初始化
    getPrivateInitialization() {
        return `
        // Private card initialization
        debugLog('Body loaded, initializing private card', 'info');
        `;
    }

    // 公開頁面初始化
    getPublicInitialization() {
        return `
        // Public card initialization
        debugLog('Body loaded, initializing public card', 'info');
        socket.emit('getPublicListInfo');
        `;
    }

    // 生成完整的頁面配置對象
    generatePageConfig(pageType) {
        const config = this.getConfig(pageType);
        return {
            TITLE: config.title,
            BODY_CLASS: config.bodyClass,
            CONTAINER_CLASS: config.containerClass,
            VUE_CONTAINER_CLASS: config.vueContainerClass,
            IS_PUBLIC: config.isPublic,
            PUBLIC_SOCKET_LISTENERS: config.socketListeners,
            INITIALIZATION: config.initialization
        };
    }

    // 應用配置到頁面
    applyConfig(pageType) {
        const config = this.generatePageConfig(pageType);
        
        // 更新頁面標題
        document.title = `${config.TITLE} @ HKTRPG`;
        
        // 更新body類別
        if (config.BODY_CLASS) {
            document.body.className = `bg-color ${config.BODY_CLASS}`;
        }
        
        // 返回配置對象供其他模組使用
        return config;
    }
}

// 創建全局實例
const _pageConfigManager = new PageConfigManager();

// 導出供其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageConfigManager;
}
