/* @ds-bundle: {"format":4,"namespace":"TwoPlusThree","components":[{"name":"Button"},{"name":"Icon"},{"name":"TextField"},{"name":"TextArea"},{"name":"Select"},{"name":"Checkbox"},{"name":"RadioGroup"},{"name":"Tag"},{"name":"Card"},{"name":"Menu"},{"name":"Toast"},{"name":"Dialog"},{"name":"Header"},{"name":"Logo"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;

  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(' '); }
  function omit(obj, keys) {
    var out = {};
    for (var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k) && keys.indexOf(k) < 0) out[k] = obj[k]; }
    return out;
  }

  /* ---------- Icon: 24-unit grid, 1.5 stroke, square ends ---------- */
  var ICONS = {
    'arrow-right': 'M4 12h15 M13 6l6 6-6 6',
    'arrow-left': 'M20 12H5 M11 6l-6 6 6 6',
    'external': 'M7 17L17 7 M9 7h8v8',
    'chevron-down': 'M6 9l6 6 6-6',
    'chevron-right': 'M9 6l6 6-6 6',
    'plus': 'M12 5v14 M5 12h14',
    'minus': 'M5 12h14',
    'close': 'M6 6l12 12 M18 6L6 18',
    'check': 'M5 12.5l4.5 4.5L19 7.5',
    'menu': 'M4 7h16 M4 12h16 M4 17h16',
    'search': 'M16.5 10.5a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z M15 15l5 5',
    'bag': 'M5 8h14l-1 12H6Z M9 8V6a3 3 0 0 1 6 0v2',
    'user': 'M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z M4 20c0-4 3.6-6 8-6s8 2 8 6',
    'heart': 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z',
    'book': 'M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4Z M20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6Z',
    'code': 'M8 7l-5 5 5 5 M16 7l5 5-5 5',
    'gift': 'M4 11h16v9H4Z M3 7h18v4H3Z M12 7v13 M12 7C10.5 4 7 4 7 6s3 1 5 1Z M12 7c1.5-3 5-3 5-1s-3 1-5 1Z',
    'mail': 'M3 6h18v12H3Z M3 6l9 7 9-7',
    'info': 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z M12 11v6 M12 7.5v.5',
    'alert': 'M12 3l10 18H2Z M12 10v5 M12 17.5v.5',
    'download': 'M12 4v12 M6 10l6 6 6-6 M4 20h16'
  };
  function Icon(p) {
    var d = ICONS[p.name];
    if (!d) return null;
    var size = p.size || 20;
    var a11y = p.label ? { role: 'img', 'aria-label': p.label } : { 'aria-hidden': 'true' };
    return h('svg', Object.assign({ viewBox: '0 0 24 24', width: size, height: size, className: cx('tt-icon', p.className), focusable: 'false' }, a11y),
      h('path', { d: d, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'square', strokeLinejoin: 'miter' }));
  }
  Icon.names = Object.keys(ICONS);

  /* ---------- Logo: geometry from the Logos files ---------- */
  var MARK_D = 'M11.93 11.65H51.08V74.35H11.93Z M11.93 27.20H30.10V35.05H11.93Z M32.91 50.78H51.08V58.62H32.91Z M58.93 35.05H98.08V97.75H58.93Z M58.93 50.78H77.10V58.62H58.93Z M58.93 74.35H77.10V82.20H58.93Z';
  var PLUS_D = 'M32.91 50.78H77.10V58.62H32.91Z M51.08 35.05H58.93V74.35H51.08Z';
  var WORD_D = 'M140.01 7.79V15H114.21V7.79Z M122.17 10.67H131.98V51.43H122.17Z M181.39 7.79H191.13L182.76 51.43H170.96L166.09 22.89L161.29 51.43H149.49L141.05 7.79H151.21L155.33 40.31L161.09 7.79H171.04L176.8 40.31L181.4 7.79Z M204.44 16.71V30.57H194.63V15.41C194.63 13.03 195.3 11.17 196.65 9.82C198 8.47 200.23 7.8 203.34 7.8H208.55V15.01H206.29C205.6 15.01 205.12 15.14 204.85 15.39C204.58 15.64 204.44 16.09 204.44 16.73Z M204.44 28.72V42.51C204.44 43.1 204.58 43.54 204.85 43.81C205.12 44.08 205.6 44.22 206.29 44.22H208.49V51.43H203.34C200.23 51.43 198 50.76 196.65 49.41C195.3 48.06 194.63 46.2 194.63 43.82V28.72Z M211.37 42.51V28.92H221.18V43.81C221.18 46.19 220.52 48.05 219.19 49.4C217.86 50.75 215.65 51.42 212.53 51.42H207.11V44.21H209.58C210.27 44.21 210.74 44.07 210.99 43.8C211.24 43.53 211.37 43.09 211.37 42.5Z M211.37 30.57V16.71C211.37 16.07 211.24 15.62 210.99 15.37C210.74 15.12 210.27 14.99 209.58 14.99H207.25V7.78H212.53C215.64 7.78 217.86 8.46 219.19 9.8C220.52 11.15 221.18 13.01 221.18 15.39V30.55H211.37Z M140.01 62.11V69.32H114.21V62.11Z M122.17 65H131.98V105.76H122.17Z M143.37 62.11H153.11V105.75H143.37Z M163.55 80.57V87.78H151.06V80.57Z M161.9 62.11H171.57V105.75H161.9Z M177.68 62.11H187.49V105.75H177.68Z M194.56 80.85V71.04C194.56 70.4 194.43 69.95 194.18 69.7C193.93 69.45 193.46 69.32 192.77 69.32H180.49V62.11H195.72C198.83 62.11 201.05 62.79 202.38 64.13C203.71 65.48 204.37 67.34 204.37 69.72V81.86C204.37 84.19 203.71 86.03 202.38 87.38C201.05 88.73 198.83 89.4 195.72 89.4H181.31V82.47H192.77C193.46 82.47 193.92 82.34 194.18 82.09C194.44 81.84 194.56 81.42 194.56 80.82Z M187.56 85.58H197.3L206.56 105.75H196.06Z M209.86 62.11H219.74V105.75H209.86Z M233.19 62.11V69.32H213.77V62.11Z M233.74 98.55V105.76H213.77V98.55Z M231.2 79.95V87.16H214.39V79.95Z M237.93 62.11H247.81V105.75H237.93Z M261.26 62.11V69.32H241.84V62.11Z M261.81 98.55V105.76H241.84V98.55Z M259.27 79.95V87.16H242.46V79.95Z';
  var WPLUS_D = 'M237.52 26.05H267.51V33.32H237.52Z M247.88 15.54H257.14V43.81H247.88Z';
  var LOCKUP_W = 267.51;
  /* One-colour mark: the square with the digits and an inset + cut clean through. */
  var MONO_D = 'M0 0H110V110H0Z ' + MARK_D + ' M34.51 52.38 L52.68 52.38 L52.68 36.65 L57.33 36.65 L57.33 52.38 L75.50 52.38 L75.50 57.02 L57.33 57.02 L57.33 72.75 L52.68 72.75 L52.68 57.02 L34.51 57.02Z';

  function Logo(p) {
    var mark = (p.variant || 'lockup') === 'mark';
    var height = p.height || 48;
    var plus = p.mono ? 'var(--ink)' : 'var(--signal)';
    var label = p.label === undefined ? 'TWO+THREE' : p.label;
    var a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' };
    return h('svg', Object.assign({
      viewBox: mark ? '0 0 110 110' : '0 0 ' + LOCKUP_W + ' 110',
      width: mark ? height : Math.round(height * LOCKUP_W / 110),
      height: height,
      className: cx('tt-logo', p.className)
    }, a11y),
      p.mono ? h('path', { d: MONO_D, fillRule: 'evenodd', style: { fill: 'var(--ink)' } }) : null,
      p.mono ? null : h('rect', { width: 110, height: 110, style: { fill: 'var(--ink)' } }),
      p.mono ? null : h('path', { d: MARK_D, fillRule: 'evenodd', style: { fill: 'var(--paper)' } }),
      p.mono ? null : h('path', { d: PLUS_D, style: { fill: plus } }),
      mark ? null : h('path', { d: WORD_D, style: { fill: 'var(--ink)' } }),
      mark ? null : h('path', { d: WPLUS_D, style: { fill: plus } })
    );
  }

  /* ---------- Button ---------- */
  function Button(p) {
    var rest = omit(p, ['variant', 'size', 'className', 'children', 'href', 'icon', 'iconAfter']);
    var cls = cx('tt-btn', 'tt-btn-' + (p.variant || 'primary'), p.size === 'sm' && 'tt-btn-sm', p.className);
    var kids = [
      p.icon ? h(Icon, { key: 'i', name: p.icon, size: 18 }) : null,
      p.children,
      p.iconAfter ? h(Icon, { key: 'a', name: p.iconAfter, size: 18 }) : null
    ];
    if (p.href) return h.apply(null, ['a', Object.assign({}, rest, { href: p.href, className: cls })].concat(kids));
    return h.apply(null, ['button', Object.assign({ type: 'button' }, rest, { className: cls })].concat(kids));
  }

  /* ---------- Fields ---------- */
  function Field(p, control) {
    var msg = p.error || p.hint;
    return h('div', { className: cx('tt-field', p.error && 'tt-field-error', p.className) },
      h('label', { htmlFor: p.id, className: 'tt-field-label' }, p.label),
      control,
      msg ? h('div', { id: p.id + '-msg', className: cx('tt-field-msg', p.error && 'tt-field-msg-error') }, msg) : null
    );
  }
  function fieldAttrs(p, id) {
    return {
      id: id,
      'aria-invalid': p.error ? 'true' : undefined,
      'aria-describedby': (p.error || p.hint) ? id + '-msg' : undefined
    };
  }
  var FIELD_KEYS = ['label', 'hint', 'error', 'id', 'className', 'options', 'placeholder'];

  function TextField(p) {
    var auto = React.useId(); var id = p.id || auto;
    var input = h('input', Object.assign({ type: 'text', placeholder: p.placeholder }, omit(p, FIELD_KEYS), fieldAttrs(p, id), { className: 'tt-input' }));
    return Field(Object.assign({}, p, { id: id }), input);
  }

  function TextArea(p) {
    var auto = React.useId(); var id = p.id || auto;
    var input = h('textarea', Object.assign({ rows: 4, placeholder: p.placeholder }, omit(p, FIELD_KEYS), fieldAttrs(p, id), { className: 'tt-input tt-textarea' }));
    return Field(Object.assign({}, p, { id: id }), input);
  }

  function Select(p) {
    var auto = React.useId(); var id = p.id || auto;
    var opts = (p.options || []).map(function (o, i) {
      var v = typeof o === 'string' ? { value: o, label: o } : o;
      return h('option', { key: i, value: v.value, disabled: v.disabled }, v.label);
    });
    if (p.placeholder) opts.unshift(h('option', { key: 'ph', value: '', disabled: true }, p.placeholder));
    var sel = h.apply(null, ['select', Object.assign({}, omit(p, FIELD_KEYS), fieldAttrs(p, id), { className: 'tt-input tt-select' })].concat(opts));
    return Field(Object.assign({}, p, { id: id }), h('span', { className: 'tt-select-wrap' }, sel, h(Icon, { name: 'chevron-down', size: 18 })));
  }

  /* ---------- Checkbox and RadioGroup ---------- */
  function Checkbox(p) {
    var auto = React.useId(); var id = p.id || auto;
    var rest = omit(p, ['label', 'id', 'className']);
    return h('label', { htmlFor: id, className: cx('tt-check', p.className) },
      h('input', Object.assign({}, rest, { id: id, type: 'checkbox', className: 'tt-check-input' })),
      h('span', { className: 'tt-check-box', 'aria-hidden': 'true' },
        h('svg', { viewBox: '0 0 16 16', width: 14, height: 14 },
          h('path', { d: 'M3 8.5l3 3 7-7', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'square' }))),
      h('span', null, p.label)
    );
  }

  function RadioGroup(p) {
    var auto = React.useId();
    var name = p.name || auto;
    var controlled = p.value !== undefined;
    return h('fieldset', { className: cx('tt-radio-group', p.className) },
      h('legend', { className: 'tt-field-label' }, p.legend),
      (p.options || []).map(function (o, i) {
        var v = typeof o === 'string' ? { value: o, label: o } : o;
        var id = name + '-' + i;
        var checkProps = controlled ? { checked: p.value === v.value } : { defaultChecked: p.defaultValue === v.value };
        return h('label', { key: i, htmlFor: id, className: 'tt-radio' },
          h('input', Object.assign({
            id: id, type: 'radio', name: name, value: v.value, disabled: v.disabled, className: 'tt-radio-input',
            onChange: function (e) { if (p.onChange) p.onChange(e.target.value, e); }
          }, checkProps)),
          h('span', { className: 'tt-radio-dot', 'aria-hidden': 'true' }),
          h('span', null, v.label));
      })
    );
  }

  /* ---------- Tag ---------- */
  function Tag(p) {
    var tone = p.tone === 'sun' ? 'ochre' : p.tone;
    return h('span', { className: cx('tt-tag', tone && tone !== 'neutral' && 'tt-tag-' + tone, p.className) }, p.children);
  }

  /* ---------- Card ---------- */
  function Card(p) {
    var el = p.href ? 'a' : (p.as || 'article');
    var level = p.elevation == null ? 0 : p.elevation;
    var props = { className: cx('tt-card', 'tt-elev-' + level, p.interactive && !p.href && 'tt-card-interactive', p.className) };
    if (p.href) props.href = p.href;
    return h(el, props,
      p.media ? h('div', { className: 'tt-card-media' }, p.media) : null,
      h('div', { className: 'tt-card-body' },
        p.eyebrow ? h('div', { className: 'tt-eyebrow' }, p.eyebrow) : null,
        p.title ? h('h3', { className: 'tt-card-title' }, p.title) : null,
        p.children ? h('div', { className: 'tt-card-text' }, p.children) : null,
        p.footer ? h('div', { className: 'tt-card-footer' }, p.footer) : null
      )
    );
  }

  /* ---------- Menu ---------- */
  function Menu(p) {
    var st = React.useState(!!p.defaultOpen); var open = st[0], setOpen = st[1];
    var root = React.useRef(null);
    var listId = React.useId();
    React.useEffect(function () {
      if (!open) return undefined;
      function onDoc(e) { if (root.current && !root.current.contains(e.target)) setOpen(false); }
      function onKey(e) {
        if (!root.current) return;
        var items = Array.prototype.slice.call(root.current.querySelectorAll('.tt-menu-item'));
        var i = items.indexOf(document.activeElement);
        if (e.key === 'Escape') { setOpen(false); var t = root.current.querySelector('.tt-menu-trigger'); if (t) t.focus(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length) items[(i + 1) % items.length].focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length) items[(i - 1 + items.length) % items.length].focus(); }
      }
      document.addEventListener('mousedown', onDoc);
      document.addEventListener('keydown', onKey);
      return function () { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
    }, [open]);
    var items = (p.items || []).map(function (it, i) {
      if (it === '-' || it.separator) return h('li', { key: i, role: 'separator', className: 'tt-menu-sep' });
      var inner = [it.icon ? h(Icon, { key: 'i', name: it.icon, size: 18 }) : null, h('span', { key: 'l' }, it.label)];
      var common = { role: 'menuitem', className: 'tt-menu-item', tabIndex: -1, onClick: function (e) { if (it.onSelect) it.onSelect(e); setOpen(false); } };
      return h('li', { key: i, role: 'none' }, it.href
        ? h.apply(null, ['a', Object.assign({ href: it.href }, common)].concat(inner))
        : h.apply(null, ['button', Object.assign({ type: 'button' }, common)].concat(inner)));
    });
    return h('div', { ref: root, className: cx('tt-menu', p.align === 'end' && 'tt-menu-end', p.className) },
      h(Button, {
        variant: p.variant || 'secondary', size: p.size || 'sm', className: 'tt-menu-trigger', iconAfter: 'chevron-down',
        'aria-haspopup': 'menu', 'aria-expanded': open ? 'true' : 'false', 'aria-controls': listId,
        onClick: function () { setOpen(!open); }
      }, p.label),
      open ? h('ul', { id: listId, role: 'menu', className: 'tt-menu-list' }, items) : null
    );
  }

  /* ---------- Toast ---------- */
  function Toast(p) {
    if (p.open === false) return null;
    return h('div', { role: 'status', 'aria-live': 'polite', className: cx('tt-toast', !p.inline && 'tt-toast-fixed', p.className) },
      h('span', { className: 'tt-toast-msg' }, p.children),
      p.action ? h(Button, { variant: 'quiet', size: 'sm', onClick: p.action.onClick, href: p.action.href }, p.action.label) : null,
      p.onClose ? h('button', { type: 'button', className: 'tt-icon-btn', 'aria-label': 'Dismiss', onClick: p.onClose }, h(Icon, { name: 'close', size: 18 })) : null
    );
  }

  /* ---------- Dialog ---------- */
  function Dialog(p) {
    var titleId = React.useId();
    var onClose = p.onClose;
    React.useEffect(function () {
      if (!p.open || !onClose || p.inline) return undefined;
      function onKey(e) { if (e.key === 'Escape') onClose(); }
      document.addEventListener('keydown', onKey);
      return function () { document.removeEventListener('keydown', onKey); };
    }, [p.open, onClose, p.inline]);
    if (!p.open) return null;
    return h('div', {
      className: cx('tt-scrim', p.inline && 'tt-scrim-inline'),
      onClick: function (e) { if (e.target === e.currentTarget && onClose) onClose(); }
    },
      h('div', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId, className: cx('tt-dialog', p.className) },
        h('div', { className: 'tt-dialog-head' },
          h('h2', { id: titleId, className: 'tt-dialog-title' }, p.title),
          onClose ? h('button', { type: 'button', className: 'tt-icon-btn', 'aria-label': 'Close', onClick: onClose }, h(Icon, { name: 'close', size: 20 })) : null
        ),
        p.children ? h('div', { className: 'tt-dialog-body' }, p.children) : null,
        p.actions ? h('div', { className: 'tt-dialog-actions' }, p.actions) : null
      )
    );
  }

  /* ---------- Header ---------- */
  function Header(p) {
    var nav = p.nav || [];
    return h('header', { className: cx('tt-header', p.elevated ? 'tt-elev-2' : null, p.className) },
      h('a', { href: p.logoHref || '/', className: 'tt-header-logo', 'aria-label': 'TWO+THREE home' },
        h(Logo, { height: p.logoHeight || 44, label: '' })),
      nav.length ? h('nav', { 'aria-label': 'Main', className: 'tt-header-nav' },
        nav.map(function (item, i) {
          return h('a', { key: i, href: item.href, className: 'tt-header-link', 'aria-current': item.current ? 'page' : undefined }, item.label);
        })) : null,
      p.action ? h('div', { className: 'tt-header-action' }, p.action) : null
    );
  }

  var api = {
    Button: Button, Icon: Icon, TextField: TextField, TextArea: TextArea, Select: Select, Checkbox: Checkbox,
    RadioGroup: RadioGroup, Tag: Tag, Card: Card, Menu: Menu, Toast: Toast, Dialog: Dialog, Header: Header, Logo: Logo
  };
  window.TwoPlusThree = Object.assign(window.TwoPlusThree || {}, api);
})();
