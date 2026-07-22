/**
 * Shared i18n + hybrid UI bootstrap for character card test pages.
 */
(function (global) {
    'use strict';

    function cardtestT(key, options) {
        if (typeof wwwPrefixT === 'function') {
            return wwwPrefixT('cardtest_', key, options);
        }
        if (typeof wwwT !== 'function') {
            return key;
        }
        if (key.startsWith('www.') || key.startsWith('cardtest_')) {
            return wwwT(key, options);
        }
        return wwwT(`cardtest_${key}`, options);
    }

    function cardtestShowError(message) {
        const title = typeof wwwT === 'function' ? wwwT('ui_error_title') : 'Error!';
        if (typeof addElement === 'function') {
            addElement(`<i class="fas fa-exclamation-triangle me-2"></i><strong>${title}</strong> ${message}`, 'danger', 5000, true);
        }
    }

    function cardtestShowSuccess(message) {
        const title = typeof wwwT === 'function' ? wwwT('ui_success_title') : 'Success!';
        if (typeof addElement === 'function') {
            addElement(`<i class="fas fa-check-circle me-2"></i><strong>${title}</strong> ${message}`, 'success', 3000, true);
        }
    }

    async function initCardtestChrome(options) {
        const opts = options || {};
        if (global.wwwI18n && global.wwwI18n.ready) {
            await global.wwwI18n.ready;
        }
        const titleKey = opts.titleKey || 'page_title';
        const navKey = opts.navTitleKey || 'nav_title';
        document.title = cardtestT(titleKey);
        if (typeof wwwApplyDomI18n === 'function') {
            wwwApplyDomI18n(document.body);
        }
        if (typeof loadSiteChromeWithI18n === 'function') {
            loadSiteChromeWithI18n({ titleResolver: () => cardtestT(navKey) });
        }
    }

    function cardtestLoadHybridUi(isPublic) {
        if (typeof $ === 'undefined') {
            return;
        }
        $('#warning-update').hide();
        $('#warning-updateError').hide();

        $('#commonModals').load('/common/characterCardModals.html', function () {
            if (typeof wwwApplyDomI18n === 'function') {
                wwwApplyDomI18n(document.getElementById('commonModals'));
            }
            $('#array-rendering').load('/common/hybridCharacterCardUI.html', function () {
                setTimeout(function () {
                    if (typeof initializeVueApps === 'function') {
                        initializeVueApps(!!isPublic);
                    }
                }, 100);
            });
        });
    }

    function cardtestWireUpdateCard() {
        global.updateCard = function cardtestUpdateCard() {
            const userName = localStorage.getItem('userName');
            const userPassword = localStorage.getItem('userPassword');

            if (!userName || !userPassword) {
                const msg = typeof wwwT === 'function'
                    ? wwwT('login_required_update')
                    : 'Please log in to update your character card';
                cardtestShowError(msg);
                return;
            }

            const updateButton = document.querySelector('[onclick="updateCard()"]');
            if (updateButton) {
                updateButton.classList.add('btn-loading');
                updateButton.disabled = true;
            }

            const cardElement = document.querySelector('.board1');
            if (cardElement) {
                cardElement.classList.add('loading');
            }

            const cardApp = global.card;
            const data = {
                userName,
                userPassword,
                card: {
                    _id: cardApp._id,
                    id: cardApp.id,
                    state: cardApp.state,
                    roll: cardApp.roll,
                    notes: cardApp.notes,
                    characterDetails: cardApp.characterDetails,
                    public: cardApp.public,
                },
            };

            if (typeof debugLog === 'function') {
                debugLog('Attempting to update card with data:');
            }
            global.socket.emit('updateCard', data);
        };

        global.showError = cardtestShowError;
        global.showSuccess = cardtestShowSuccess;
    }

    global.cardtestT = cardtestT;
    global.cardtestShowError = cardtestShowError;
    global.cardtestShowSuccess = cardtestShowSuccess;
    global.initCardtestChrome = initCardtestChrome;
    global.cardtestLoadHybridUi = cardtestLoadHybridUi;
    global.cardtestWireUpdateCard = cardtestWireUpdateCard;
})(typeof window !== 'undefined' ? window : global);
