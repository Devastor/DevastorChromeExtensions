// Создаем объект для хранения состояния вкладок
const DevastorTabStates = {};

chrome.tabs.onCreated.addListener(function DevastorTabOnCreated(tab) {
    DevastorTabStates[tab.id] = { muted: !tab.active, autoDiscardable: false };
  
    if (!tab.active) {
        DevastorTabStates[tab.id] = { muted: true, autoDiscardable: true };
        chrome.tabs.update(tab.id, { "muted": true, "autoDiscardable": true });

        // Остановка выполнения JavaScript на неактивных вкладках
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                document.querySelectorAll('script').forEach(s => s.remove());
            }
        });

        // Отключение CSS на неактивных вкладках
        chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            code: 'body { display: none !important; }'
        });

        // Блокировка запросов на ресурсы на неактивных вкладках
        chrome.webRequest.onBeforeRequest.addListener(
            function DevastorBlockRequests(details) {
                if (details.tabId === tab.id && (details.type === "image" || details.type === "media")) {
                    return { cancel: true };
                }
            },
            { urls: ["<all_urls>"], tabId: tab.id },
            ["blocking"]
        );
    }
});

chrome.tabs.onUpdated.addListener(function DevastorTabOnUpdated(tabId, changeInfo, tab) {
    if (DevastorTabStates[tabId] && tab.active) {
        chrome.tabs.update(tabId, { "muted": DevastorTabStates[tabId].muted, "autoDiscardable": DevastorTabStates[tabId].autoDiscardable });

        // Восстановление выполнения JavaScript
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                // Восстановление скриптов здесь, если это необходимо
            }
        });

        // Восстановление CSS
        chrome.scripting.insertCSS({
            target: { tabId: tabId },
            code: '' // Отмена отключения CSS
        });

        // Удаление блокировки запросов
        chrome.webRequest.onBeforeRequest.removeListeners(tabId);
        
        delete DevastorTabStates[tabId];
    }
});
