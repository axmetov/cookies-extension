chrome.devtools.panels.create(
    'Cookies',
    'icons/cookie.png',
    'panel.html',
    panel => {
        panel.onShown.addListener(() => {
            chrome.runtime.sendMessage({panelShown: true});
        });
    }
);