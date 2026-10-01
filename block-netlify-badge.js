
  (function blockNetlifyBadge() {
    // --- 消したい要素の条件 ---
    const SELECTORS = [
      '#nl-badge-frame',
      'iframe[title="Powered by Netlify"]',
      'iframe[title*="Netlify"]',
      'iframe[srcdoc*="Powered by"]',
      'iframe[srcdoc*="nl-badge"]',
      'iframe[srcdoc*="netlify"]',
      'iframe[src*="netlify"]'
    ];

    // --- id が nl-badge-frame 以外でも、srcdoc に特徴的な文字列があれば消す ---
    const SRCDOC_HINTS = [
      'nl-badge',
      'Powered by Netlify',
      'app.netlify.com/start',
      'netlify_badge'
    ];

    function isBadge(el) {
      if (!(el instanceof HTMLIFrameElement)) return false;

      // id / title / src で判定
      for (const sel of SELECTORS) {
        try {
          if (el.matches(sel)) return true;
        } catch (_) { /* 無効セレクタは無視 */ }
      }

      // srcdoc の中身で判定（大文字小文字を無視）
      const srcdoc = el.getAttribute('srcdoc') || '';
      const lower = srcdoc.toLowerCase();
      for (const hint of SRCDOC_HINTS) {
        if (lower.includes(hint.toLowerCase())) return true;
      }

      return false;
    }

    function removeBadges(root = document) {
      // 直接マッチする iframe を削除
      root.querySelectorAll('iframe').forEach(el => {
        if (isBadge(el)) {
          console.warn('[blockNetlifyBadge] removed:', el);
          el.remove();
        }
      });

      // iframe を内包するラッパー要素もついでに削除（任意）
      root.querySelectorAll('#nl-badge-frame').forEach(el => el.remove());
    }

    // --- 初回実行 ---
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => removeBadges(), { once: true });
    } else {
      removeBadges();
    }

    // --- 動的追加を監視 ---
    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        m.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return; // element 以外は無視

          // 追加ノード自身がバッジか？
          if (isBadge(node)) {
            console.warn('[blockNetlifyBadge] removed (added):', node);
            node.remove();
            return;
          }

          // 追加ノードの子孫にバッジがいるか？
          if (node.querySelectorAll) {
            node.querySelectorAll('iframe').forEach(el => {
              if (isBadge(el)) {
                console.warn('[blockNetlifyBadge] removed (descendant):', el);
                el.remove();
              }
            });
          }
        });
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    // --- 念のため定期チェック（保険） ---
    setInterval(() => removeBadges(), 1500);
  })();

