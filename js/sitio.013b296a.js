/* sitio.js — el movimiento, el menú y el formulario. Sin librerías.
 *
 * Los datos (WhatsApp, a dónde va el formulario, si hay píxel) llegan en window.SITIO, que el constructor arma desde
 * negocio.json. Aquí no se escribe ningún teléfono ni ninguna dirección: una sola fuente.
 *
 * Reglas que vienen de errores reales:
 *   - El teléfono se valida con manga ancha: un formulario rechazó durante dos meses a 13 de 22 países por una
 *     validación demasiado estricta. Aquí basta con 8 a 15 dígitos (el verificador lo prueba con 22 países).
 *   - Si alguien pidió "menos movimiento", nada se anima.
 *   - Nada se anima de lado: en el celular se sale la página por la derecha.
 *   - El 3D (data-3d) solo inclina, gira y sube: nunca mueve algo de lado, y con "menos movimiento" no corre.
 */
(function () {
  'use strict';
  var S = window.SITIO || {};
  var raiz = document.documentElement;
  window.SITIO_LISTO = true;
  raiz.classList.add('js');
  var quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // La página en español (lang="es-…") usa los textos en español de las demos.
  var ES = /^es/i.test(raiz.getAttribute('lang') || '');
  var tr = function (en, es) { return ES ? es : en; };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };

  function evento(nombre, datos) {
    try { if (S.pixel && window.fbq) window.fbq('track', nombre, datos || {}); } catch (e) { /* la medición nunca rompe la página */ }
  }

  /* ---------- menú del celular ---------- */
  var boton = document.querySelector('[data-menu-boton]');
  var menu = document.getElementById('menu');
  function cierraMenu() {
    if (!boton || !menu) return;
    boton.setAttribute('aria-expanded', 'false');
    boton.setAttribute('aria-label', tr('Open menu', 'Abrir menú'));
    menu.classList.remove('abierto');
    document.body.classList.remove('menu-abierto');
  }
  if (boton && menu) {
    boton.addEventListener('click', function () {
      var abrir = boton.getAttribute('aria-expanded') !== 'true';
      boton.setAttribute('aria-expanded', String(abrir));
      boton.setAttribute('aria-label', abrir ? tr('Close menu', 'Cerrar menú') : tr('Open menu', 'Abrir menú'));
      menu.classList.toggle('abierto', abrir);
      document.body.classList.toggle('menu-abierto', abrir);
      if (abrir) { var primero = menu.querySelector('a'); if (primero) primero.focus(); }
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) cierraMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('abierto')) { cierraMenu(); boton.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth >= 900) cierraMenu(); });
  }

  /* ---------- títulos que entran palabra por palabra ---------- */
  $$('[data-palabras]').forEach(function (el) {
    if (quieto) return;
    var i = 0;
    var envuelve = function (nodo) {
      Array.prototype.slice.call(nodo.childNodes).forEach(function (hijo) {
        if (hijo.nodeType === 3) {
          var frag = document.createDocumentFragment();
          hijo.textContent.split(/(\s+)/).forEach(function (pedazo) {
            if (!pedazo) return;
            if (/^\s+$/.test(pedazo)) { frag.appendChild(document.createTextNode(pedazo)); return; }
            var s = document.createElement('span');
            s.className = 'palabra';
            s.style.setProperty('--i', i++);
            s.textContent = pedazo;
            frag.appendChild(s);
          });
          hijo.parentNode.replaceChild(frag, hijo);
        } else if (hijo.nodeType === 1) {
          // Un pedazo con degradado (.resaltado) se anima ENTERO: partirlo en palabras rompe el degradado del texto.
          if (hijo.matches('.resaltado, [data-entero]')) { hijo.classList.add('palabra'); hijo.style.setProperty('--i', i++); }
          else envuelve(hijo);
        }
      });
    };
    envuelve(el);
  });

  /* ---------- aparecer al bajar ---------- */
  var aparecen = $$('[data-aparece], [data-palabras]');
  if (quieto || !('IntersectionObserver' in window)) {
    aparecen.forEach(function (el) { el.classList.add('visible'); });
  } else {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visible'); observador.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    aparecen.forEach(function (el) { observador.observe(el); });
  }

  /* ---------- números que cuentan (el número real ya está en el HTML: sin JS se ve igual) ---------- */
  if (!quieto && 'IntersectionObserver' in window) {
    var cuenta = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        cuenta.unobserve(en.target);
        var el = en.target;
        var final = parseFloat(el.getAttribute('data-cuenta'));
        var texto = el.textContent;
        if (!isFinite(final)) return;
        var inicio = null;
        var paso = function (t) {
          if (inicio === null) inicio = t;
          var p = Math.min(1, (t - inicio) / 1400);
          var v = Math.round(final * (1 - Math.pow(1 - p, 3)));
          el.textContent = texto.replace(String(final), v.toLocaleString('en-AU'));
          if (p < 1) requestAnimationFrame(paso); else el.textContent = texto;
        };
        requestAnimationFrame(paso);
      });
    }, { threshold: 0.4 });
    $$('[data-cuenta]').forEach(function (el) { cuenta.observe(el); });
  }

  /* ---------- 3D con medida (data-3d): ver la sección 21 de sitio.css ---------- */
  if (!quieto) {
    var giran = $$('[data-3d="girar"]');
    var capas = $$('[data-3d="capas"]');
    var vueltas = $$('[data-3d="vuelta"]').map(function (el) {
      // Todo lo que tenga data-desde (y los textos de la vuelta) se enciende en su momento: "actual" mientras le toca
      // y "pasado" cuando ya pasó. Se agrupan por su papá: cada grupo lleva su propia cuenta.
      var papas = [], grupos = [];
      $$('.vuelta-textos > *, [data-desde]', el).forEach(function (t) {
        var i = papas.indexOf(t.parentNode);
        if (i < 0) { papas.push(t.parentNode); grupos.push([]); i = grupos.length - 1; }
        grupos[i].push(t);
      });
      // data-hasta="0.6" en .vuelta-fotos: la vuelta de las fotos termina ahí (lo demás de la sección sigue después).
      var caja = el.querySelector('.vuelta-fotos');
      var fin = caja ? parseFloat(caja.getAttribute('data-hasta')) : NaN;
      return { el: el, fotos: $$('.vuelta-fotos img', el), grupos: grupos, fin: fin > 0 && fin <= 1 ? fin : 1, va: -1 };
    });
    if (giran.length || capas.length || vueltas.length) {
      var pendiente = false;
      var pinta = function () {
        pendiente = false;
        var alto = window.innerHeight || 1;
        giran.forEach(function (el) {
          var r = el.getBoundingClientRect();
          // 1 = todavía abajo de la pantalla, 0 = ya a la mitad: se endereza mientras sube.
          var k = Math.max(0, Math.min(1, (r.top + r.height / 2 - alto / 2) / (alto / 2 + r.height / 2)));
          el.style.setProperty('--rx', (k * 18).toFixed(2) + 'deg');
          el.style.setProperty('--ry', (k * -12).toFixed(2) + 'deg');
          el.style.setProperty('--esc', (1 - k * 0.1).toFixed(3));
        });
        vueltas.forEach(function (v) {
          var r = v.el.getBoundingClientRect();
          var recorrido = Math.max(1, r.height - alto);
          var p = Math.max(0, Math.min(1, -r.top / recorrido));      // 0 al llegar, 1 al terminar la sección
          v.el.style.setProperty('--avance', p.toFixed(3));           // para que el diseño acompañe la vuelta
          var i = Math.round(Math.min(1, p / v.fin) * (v.fotos.length - 1));
          if (i !== v.va && v.fotos.length) {
            if (v.va >= 0 && v.fotos[v.va]) v.fotos[v.va].classList.remove('actual');
            v.fotos[i].classList.add('actual');
            v.va = i;
          }
          v.grupos.forEach(function (g) {
            g.forEach(function (t, k) {
              var desde = parseFloat(t.getAttribute('data-desde'));
              if (!isFinite(desde)) desde = k / g.length;
              var hasta = k + 1 < g.length ? parseFloat(g[k + 1].getAttribute('data-desde')) : 1.01;
              if (!isFinite(hasta)) hasta = (k + 1) / g.length;
              t.classList.toggle('actual', p >= desde && p < hasta);
              t.classList.toggle('pasado', p >= hasta);
            });
          });
        });
        capas.forEach(function (bloque) {
          var r = bloque.getBoundingClientRect();
          var p = (r.top + r.height / 2 - alto / 2) / alto;
          Array.prototype.forEach.call(bloque.children, function (hijo, i) {
            var v = parseFloat(hijo.getAttribute('data-profundidad')) || (i + 1) * 0.06;
            hijo.style.setProperty('--py', (p * v * 100).toFixed(1) + 'px');
          });
        });
      };
      // Las fotos de la vuelta se piden antes de llegar (perezosas, una vuelta llegaría con huecos).
      if ('IntersectionObserver' in window && vueltas.length) {
        var antes = new IntersectionObserver(function (entradas) {
          entradas.forEach(function (en) {
            if (!en.isIntersecting) return;
            $$('img[loading="lazy"]', en.target).forEach(function (img) { img.loading = 'eager'; });
            antes.unobserve(en.target);
          });
        }, { rootMargin: '150% 0px' });
        vueltas.forEach(function (v) { antes.observe(v.el); });
      }
      var pide = function () { if (!pendiente) { pendiente = true; requestAnimationFrame(pinta); } };
      window.addEventListener('scroll', pide, { passive: true });
      window.addEventListener('resize', pide);
      pinta();
    }
    if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      $$('[data-3d="inclinar"], [data-3d="profundidad"]').forEach(function (el) {
        var foto = el.getAttribute('data-3d') === 'profundidad';
        var max = foto ? 14 : 10;
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          el.style.setProperty('--iy', ((x - 0.5) * max).toFixed(2) + 'deg');
          el.style.setProperty('--ix', ((y - 0.5) * -max).toFixed(2) + 'deg');
          if (foto) {
            el.style.setProperty('--lx', (x * 100).toFixed(1) + '%');
            el.style.setProperty('--ly', (y * 100).toFixed(1) + '%');
            el.style.setProperty('--brillo', '1');
            el.style.setProperty('--zoom', '1.03');
          }
        });
        el.addEventListener('pointerleave', function () {
          el.style.setProperty('--iy', '0deg'); el.style.setProperty('--ix', '0deg');
          if (foto) { el.style.setProperty('--brillo', '0'); el.style.setProperty('--zoom', '1'); }
        });
      });
    }
  }

  /* ---------- pestañas (data-pestanas): se usan con clic y con flechas; sin JS se ven todos los paneles ---------- */
  $$('[data-pestanas]').forEach(function (lista) {
    var tabs = $$('[role="tab"]', lista);
    var paneles = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    var elige = function (i, foco) {
      tabs.forEach(function (t, k) {
        var si = k === i;
        t.setAttribute('aria-selected', String(si));
        t.tabIndex = si ? 0 : -1;
        if (paneles[k]) paneles[k].hidden = !si;
      });
      if (foco) tabs[i].focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { elige(i, false); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, j = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + n) % n;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = n - 1;
        if (j >= 0) { e.preventDefault(); elige(j, true); }
      });
    });
    var inicio = 0;
    tabs.forEach(function (t, k) { if (t.getAttribute('aria-selected') === 'true') inicio = k; });
    elige(inicio, false);
  });

  /* ---------- el tablero de la portada (data-tablero): cada servicio enciende el camino entre sus herramientas ---------- */
  $$('[data-tablero]').forEach(function (caja) {
    var chips = $$('[data-ruta]', caja), teclas = $$('[data-tecla]', caja), trazos = $$('[data-trazo]', caja);
    var nota = caja.querySelector('[data-tablero-nota]');
    var titulo = caja.querySelector('[data-tablero-titulo]'), texto = caja.querySelector('[data-tablero-texto]');
    var placa = caja.querySelector('.placa');
    var actual = -1, reloj = null, tocado = false;
    if (!chips.length) return;
    /* the plate turns only when someone clicks a service: each one further along turns it 2.5 degrees more to the left.
       It never turns on its own (the auto-play only lights the paths). */
    var gira = function (i) {
      if (placa) placa.style.setProperty('--giro', (-2.5 * i).toFixed(1) + 'deg');
    };
    var enciende = function (i) {
      actual = i;
      var ruta = chips[i].getAttribute('data-ruta').split(' ');
      chips.forEach(function (c, k) { c.setAttribute('aria-pressed', String(k === i)); });
      teclas.forEach(function (t) { t.classList.toggle('encendida', ruta.indexOf(t.getAttribute('data-tecla')) >= 0); });
      trazos.forEach(function (p) { p.classList.toggle('encendido', ruta.indexOf(p.getAttribute('data-trazo')) >= 0); });
      caja.classList.add('con-ruta');
      if (titulo) titulo.textContent = chips[i].getAttribute('data-titulo');
      if (texto) texto.textContent = chips[i].getAttribute('data-texto');
    };
    var para = function () { if (reloj) { clearInterval(reloj); reloj = null; } };
    chips.forEach(function (c, i) {
      c.addEventListener('click', function () {
        tocado = true; para();
        if (nota) nota.setAttribute('aria-live', 'polite');
        enciende(i);
        gira(i);
      });
    });
    enciende(0);
    if (!quieto && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (en.isIntersecting && !tocado && !reloj) reloj = setInterval(function () { enciende((actual + 1) % chips.length); }, 4200);
          else if (!en.isIntersecting) para();
        });
      }, { threshold: 0.25 }).observe(caja);
    }
  });

  /* ---------- el flujo de n8n (data-flujo): pasos con su antes y su después, y dos escenarios ----------
     Corre solo mientras se ve (y se detiene si el puntero está encima); al primer clic, manda quien lo usa. */
  $$('[data-flujo]').forEach(function (f) {
    var pasos = $$('.paso', f), nodos = $$('.nodo', f), tramos = $$('[data-tramo]', f);
    var barra = f.querySelector('[data-pasos-barra]'), vivo = f.querySelector('[data-vivo]');
    var atras = f.querySelector('[data-atras]'), sig = f.querySelector('[data-siguiente]');
    var sigTexto = sig;
    var botonesEsc = $$('[data-escenario-boton]', f);
    var esc = 'bien', lista = [], i = 0, tocado = false, reloj = null, encima = false;
    if (!pasos.length || !barra || !atras || !sig) return;
    var arma = function () {
      lista = pasos.filter(function (p) { return (' ' + p.getAttribute('data-escenario') + ' ').indexOf(' ' + esc + ' ') >= 0; });
      barra.innerHTML = '';
      lista.forEach(function (p, k) {
        var li = document.createElement('li'), b = document.createElement('button');
        b.type = 'button'; b.className = 'paso-boton';
        b.setAttribute('data-n', k + 1);
        b.textContent = p.getAttribute('data-corto');
        b.addEventListener('click', function () { toca(); ve(k); });
        li.appendChild(b); barra.appendChild(li);
      });
      f.setAttribute('data-escenario', esc);
      botonesEsc.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-escenario-boton') === esc)); });
    };
    var ve = function (k) {
      i = Math.max(0, Math.min(lista.length - 1, k));
      pasos.forEach(function (p) { p.hidden = p !== lista[i]; });
      var n = lista[i].querySelector('[data-n]'), t = lista[i].querySelector('[data-total]');
      if (n) n.textContent = i + 1;
      if (t) t.textContent = lista.length;
      $$('.paso-boton', barra).forEach(function (b, m) {
        b.classList.toggle('hecho', m < i);
        if (m === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      var ruta = lista.map(function (p) { return p.getAttribute('data-nodo'); });
      nodos.forEach(function (el) {
        var m = ruta.indexOf(el.getAttribute('data-nodo'));
        el.classList.toggle('fuera', m < 0);
        el.classList.toggle('hecho', m >= 0 && m < i);
        el.classList.toggle('activo', m === i);
      });
      tramos.forEach(function (p) {
        var par = p.getAttribute('data-tramo').split('-');
        var a = ruta.indexOf(par[0]), b = ruta.indexOf(par[1]);
        var en = a >= 0 && b === a + 1;
        p.classList.toggle('en-ruta', en);
        p.classList.toggle('recorrido', en && b <= i);
      });
      atras.disabled = i === 0;
      if (sigTexto) sigTexto.textContent = i === lista.length - 1 ? tr('Start again', 'Empezar de nuevo') : tr('Next', 'Siguiente');
    };
    var toca = function () {
      tocado = true;
      if (reloj) { clearInterval(reloj); reloj = null; }
      if (vivo) vivo.setAttribute('aria-live', 'polite');
    };
    atras.addEventListener('click', function () { toca(); ve(i - 1); });
    sig.addEventListener('click', function () { toca(); ve(i === lista.length - 1 ? 0 : i + 1); });
    botonesEsc.forEach(function (b) {
      b.addEventListener('click', function () { toca(); esc = b.getAttribute('data-escenario-boton'); arma(); ve(0); });
    });
    f.addEventListener('pointerenter', function () { encima = true; });
    f.addEventListener('pointerleave', function () { encima = false; });
    f.addEventListener('focusin', function () { if (!tocado) toca(); });
    arma(); ve(0);
    if (!quieto && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (en.isIntersecting && !tocado && !reloj) {
            reloj = setInterval(function () {
              if (encima) return;
              if (i < lista.length - 1) ve(i + 1);
              else { esc = esc === 'bien' ? 'revisar' : 'bien'; arma(); ve(0); }
            }, 4200);
          } else if (!en.isIntersecting && reloj) { clearInterval(reloj); reloj = null; }
        });
      }, { threshold: 0.3 }).observe(f);
    }
  });

  /* ---------- el agente (data-agente): escoges una petición y lo avanzas paso a paso ---------- */
  $$('[data-agente]').forEach(function (ag) {
    var peticiones = $$('[data-peticion]', ag), trazas = $$('[data-traza]', ag);
    var piezas = $$('[data-pieza]', ag), radios = $$('[data-radio]', ag);
    var estado = ag.querySelector('[data-estado]'), cuenta = ag.querySelector('[data-traza-cuenta]'), progreso = ag.querySelector('[data-progreso]');
    var sig = ag.querySelector('[data-agente-siguiente]'), reinicio = ag.querySelector('[data-agente-reinicio]');
    var sigTexto = sig;
    var actual = 0, paso = 0, tocado = false, reloj = null, encima = false;
    if (!trazas.length || !sig || !reinicio) return;
    var pinta = function () {
      var items = $$('li', trazas[actual]);
      items.forEach(function (li, n) { li.hidden = n > paso; li.classList.toggle('ahora', n === paso); });
      var ahora = (items[paso].getAttribute('data-usa') || '').split(' '), antes = {};
      items.slice(0, paso).forEach(function (li) { (li.getAttribute('data-usa') || '').split(' ').forEach(function (u) { antes[u] = 1; }); });
      var marca = function (el, clave) {
        var en = ahora.indexOf(clave) >= 0;
        el.classList.toggle('en-uso', en);
        el.classList.toggle('usado', !en && !!antes[clave]);
      };
      piezas.forEach(function (p) { marca(p, p.getAttribute('data-pieza')); });
      radios.forEach(function (r) { marca(r, r.getAttribute('data-radio')); });
      if (estado) estado.textContent = items[paso].getAttribute('data-estado') || tr('Working', 'Trabajando');
      if (cuenta) cuenta.textContent = tr('Step ', 'Paso ') + (paso + 1) + tr(' of ', ' de ') + items.length;
      if (progreso) {
        progreso.innerHTML = '';
        items.forEach(function (li, n) { var p = document.createElement('li'); if (n <= paso) p.className = 'hecho'; progreso.appendChild(p); });
      }
      reinicio.disabled = paso === 0;
      if (sigTexto) sigTexto.textContent = paso >= items.length - 1 ? tr('Run it again', 'Repetir') : tr('Next step', 'Siguiente paso');
    };
    var avanza = function () {
      var total = $$('li', trazas[actual]).length;
      paso = paso >= total - 1 ? 0 : paso + 1;
      pinta();
    };
    var elige = function (k) {
      actual = k; paso = 0;
      peticiones.forEach(function (p, n) {
        p.setAttribute('aria-pressed', String(n === k));
        var tarjeta = p.closest('.peticion');
        if (tarjeta) tarjeta.classList.toggle('elegida', n === k);
      });
      trazas.forEach(function (t, n) { t.hidden = n !== k; });
      pinta();
    };
    var toca = function () {
      tocado = true;
      if (reloj) { clearInterval(reloj); reloj = null; }
      trazas.forEach(function (t) { t.setAttribute('aria-live', 'polite'); });
    };
    peticiones.forEach(function (p, k) { p.addEventListener('click', function () { toca(); elige(k); }); });
    sig.addEventListener('click', function () { toca(); avanza(); });
    reinicio.addEventListener('click', function () { toca(); paso = 0; pinta(); });
    ag.addEventListener('pointerenter', function () { encima = true; });
    ag.addEventListener('pointerleave', function () { encima = false; });
    ag.addEventListener('focusin', function () { if (!tocado) toca(); });
    elige(0);
    if (!quieto && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (en.isIntersecting && !tocado && !reloj) {
            reloj = setInterval(function () {
              if (encima) return;
              var total = $$('li', trazas[actual]).length;
              if (paso < total - 1) { paso++; pinta(); } else elige((actual + 1) % trazas.length);
            }, 3600);
          } else if (!en.isIntersecting && reloj) { clearInterval(reloj); reloj = null; }
        });
      }, { threshold: 0.3 }).observe(ag);
    }
  });

  /* ---------- el chatbot de ejemplo (data-charla): preguntas sugeridas y la ficha que se llena ---------- */
  $$('[data-charla]').forEach(function (c) {
    var log = c.querySelector('[data-charla-log]');
    if (!log) return;
    var pares = {};
    $$('[data-par]', log).forEach(function (m) {
      var k = m.getAttribute('data-par');
      (pares[k] = pares[k] || []).push(m);
      m.parentNode.removeChild(m);
    });
    var botones = $$('[data-pregunta]', c), campos = $$('dd[data-campo]', c);
    var estado = c.querySelector('[data-ficha-estado]'), reinicio = c.querySelector('[data-charla-reinicio]');
    var vacios = campos.map(function (d) { return d.textContent; });
    var ocupado = false, tiempos = [];
    var baja = function () { log.scrollTop = log.scrollHeight; };
    var agrega = function (nodo) {
      var n = nodo.cloneNode(true);
      n.removeAttribute('data-par'); n.classList.add('nuevo');
      log.appendChild(n); baja();
    };
    botones.forEach(function (b) {
      b.addEventListener('click', function () {
        var par = pares[b.getAttribute('data-pregunta')];
        if (ocupado || !par || par.length < 2) return;
        ocupado = true; b.disabled = true;
        agrega(par[0]);
        var escribe = document.createElement('p');
        escribe.className = 'msj msj-bot escribiendo';
        escribe.setAttribute('aria-hidden', 'true');
        escribe.innerHTML = '<i></i><i></i><i></i>';
        tiempos.push(setTimeout(function () {
          log.appendChild(escribe); baja();
          tiempos.push(setTimeout(function () {
            if (escribe.parentNode) escribe.parentNode.removeChild(escribe);
            agrega(par[1]);
            var d = c.querySelector('dd[data-campo="' + b.getAttribute('data-campo') + '"]');
            if (d) { d.textContent = b.getAttribute('data-valor'); d.parentNode.classList.add('lleno'); }
            var llenos = campos.filter(function (x) { return x.parentNode.classList.contains('lleno'); }).length;
            if (estado) estado.classList.toggle('listo', llenos >= 2);
            ocupado = false;
          }, quieto ? 0 : 1000));
        }, quieto ? 0 : 300));
      });
    });
    if (reinicio) reinicio.addEventListener('click', function () {
      tiempos.forEach(clearTimeout); tiempos = [];
      $$('.msj', log).slice(1).forEach(function (m) { m.parentNode.removeChild(m); });
      botones.forEach(function (b) { b.disabled = false; });
      campos.forEach(function (d, k) { d.textContent = vacios[k]; d.parentNode.classList.remove('lleno'); });
      if (estado) estado.classList.remove('listo');
      ocupado = false;
    });
  });

  /* ---------- la auditoría (data-auditoria): con los números de quien la usa, ordena qué conviene primero ---------- */
  $$('[data-auditoria]').forEach(function (a) {
    var tareas = $$('[data-tarea]', a), lista = a.querySelector('[data-ruta-lista]'), total = a.querySelector('[data-total-horas]');
    if (!tareas.length || !lista) return;
    var uno = function (x) { return (Math.round(x * 10) / 10).toFixed(1); };
    var calcula = function () {
      var datos = tareas.map(function (t) {
        var v = parseFloat(t.querySelector('[data-veces]').value), m = parseFloat(t.querySelector('[data-minutos]').value);
        v = isFinite(v) && v > 0 ? v : 0;
        m = isFinite(m) && m > 0 ? m : 0;
        return { nombre: t.getAttribute('data-tarea'), arreglo: t.getAttribute('data-arreglo'), horas: v * m * 52 / 12 / 60 };
      }).sort(function (x, y) { return y.horas - x.horas; });
      var max = datos[0].horas || 1, suma = 0;
      lista.innerHTML = '';
      datos.forEach(function (d, k) {
        suma += d.horas;
        var li = document.createElement('li');
        li.className = 'ruta-item ' + (k === 0 ? 'primero' : k < 3 ? 'despues' : 'luego');
        li.style.setProperty('--parte', (d.horas / max).toFixed(3));
        var tag = document.createElement('span'), nombre = document.createElement('b'), nota = document.createElement('small'), barra = document.createElement('span');
        tag.className = 'ruta-tag'; tag.textContent = k === 0 ? tr('Start here', 'Empieza aquí') : k < 3 ? tr('Next', 'Siguiente') : tr('Later', 'Más adelante');
        nombre.textContent = d.nombre;
        nota.textContent = tr('About ', 'Unas ') + uno(d.horas) + tr(' hours a month · ', ' horas al mes · ') + d.arreglo;
        barra.className = 'ruta-barra'; barra.appendChild(document.createElement('i'));
        li.appendChild(tag); li.appendChild(nombre); li.appendChild(nota); li.appendChild(barra);
        lista.appendChild(li);
      });
      if (total) total.textContent = uno(suma);
    };
    $$('input', a).forEach(function (campo) { campo.addEventListener('input', calcula); });
    calcula();
  });

  /* ---------- el CRM (data-crm): las tarjetas pasan de una etapa a otra (arrastrando con el mouse, o con su menú)
     y cada etapa corre sus automatizaciones, que se ven pasar en el panel de la derecha ---------- */
  $$('[data-crm]').forEach(function (crm) {
    var etapas = ['nuevo', 'visita', 'cotizado', 'ganado'];
    var nombres = ES
      ? { nuevo: 'Nueva consulta', visita: 'Visita agendada', cotizado: 'Cotización enviada', ganado: 'Ganado' }
      : { nuevo: 'New enquiry', visita: 'Visit booked', cotizado: 'Quote sent', ganado: 'Won' };
    var reglas = ES ? {
      visita: [['Confirmación enviada por mensaje a', 2], ['Visita agregada al calendario para', 3]],
      cotizado: [['Cotización enviada por correo a', 6], ['Seguimiento agendado en 3 días para', 2]],
      ganado: [['Trabajo creado en la hoja de trabajos para', 4], ['Factura de anticipo enviada a', 6], ['Equipo avisado en #jobs sobre', 1]]
    } : {
      visita: [['Confirmation text sent to', 2], ['Visit added to the calendar for', 3]],
      cotizado: [['Quote emailed to', 6], ['Follow-up booked in 3 days for', 2]],
      ganado: [['Job created in the job sheet for', 4], ['Deposit invoice sent to', 6], ['Team told in #jobs about', 1]]
    };
    var cols = {};
    $$('[data-etapa]', crm).forEach(function (c) { cols[c.getAttribute('data-etapa')] = c; });
    if (!cols.nuevo || !cols.ganado) return;
    var log = crm.querySelector('[data-crm-log]'), aviso = crm.querySelector('[data-crm-aviso]');
    var pulso = crm.querySelector('[data-crm-pulso]'), quietos = crm.querySelector('[data-crm-quietos]');
    var acciones = 0, minutos = 0, menu = null, arrastre = null;
    var dinero = function (n) { return '$' + Math.round(n).toLocaleString('en-AU'); };
    var texto = function (sel, t) { var el = crm.querySelector(sel); if (el) el.textContent = t; };
    var tarjetasDe = function (e) { return $$('.crm-tarjeta', cols[e]); };
    var esQuieta = function (t) { return +t.getAttribute('data-dias') >= 7 && !t.classList.contains('seguido'); };
    var totales = function () {
      var abierto = 0, ganado = 0, abiertos = 0;
      etapas.forEach(function (e) {
        var suma = 0, lista = tarjetasDe(e);
        lista.forEach(function (t) { suma += parseFloat(t.getAttribute('data-valor')) || 0; });
        cols[e].querySelector('[data-crm-n]').textContent = lista.length;
        cols[e].querySelector('[data-crm-total]').textContent = dinero(suma);
        if (e === 'ganado') ganado = suma; else { abierto += suma; abiertos += lista.length; }
      });
      texto('[data-crm-abierto]', dinero(abierto));
      texto('[data-crm-ganado]', dinero(ganado));
      texto('[data-crm-abiertos]', abiertos);
    };
    var contadores = function () {
      texto('[data-crm-acciones]', acciones + (acciones === 1 ? tr(' action', ' acción') : tr(' actions', ' acciones')));
      texto('[data-crm-minutos]', minutos + ' min');
    };
    var anota = function (t, hecho) {
      if (!log) return;
      var li = document.createElement('li');
      if (hecho) li.className = 'hecho';
      li.textContent = t;
      log.insertBefore(li, log.firstChild);
      while (log.children.length > 5) log.removeChild(log.lastChild);
    };
    var cuentaQuietos = function () {
      if (!quietos) return;
      var n = tarjetasDe('cotizado').filter(esQuieta).length;
      quietos.setAttribute('data-n', n);
      quietos.disabled = n === 0;
    };
    var marcaRegla = function (etapa) {
      var regla = etapa ? crm.querySelector('[data-regla="' + etapa + '"]') : null;
      $$('[data-regla]', crm).forEach(function (r) { r.classList.toggle('corriendo', r === regla); });
      if (!pulso) return;
      if (regla) { pulso.style.transform = 'translateY(' + (regla.offsetTop + regla.offsetHeight / 2 - 6) + 'px)'; pulso.classList.add('activo'); }
      else pulso.classList.remove('activo');
    };
    var corre = function (etapa, cliente) {
      var lista = reglas[etapa];
      marcaRegla(etapa);
      if (!lista) { anota(cliente + tr(' is in ', ' está en ') + nombres[etapa] + tr('. Nothing runs at this stage.', '. En esta etapa no corre nada.'), false); return; }
      lista.forEach(function (accion, k) {
        setTimeout(function () {
          anota(accion[0] + ' ' + cliente, true);
          acciones++; minutos += accion[1]; contadores();
        }, quieto ? 0 : 520 * (k + 1));
      });
    };
    var mueve = function (tarjeta, etapa) {
      var desde = tarjeta.closest('[data-etapa]').getAttribute('data-etapa');
      if (desde === etapa) return;
      var lista = cols[etapa].querySelector('.crm-tarjetas');
      lista.insertBefore(tarjeta, lista.firstChild);
      tarjeta.setAttribute('data-dias', '0');
      var d = tarjeta.querySelector('[data-dias-texto]');
      if (d) d.textContent = tr('now', 'ahora');
      tarjeta.classList.remove('seguido', 'llega');
      void tarjeta.offsetWidth;
      tarjeta.classList.add('llega');
      if (aviso) aviso.hidden = true;
      totales(); cuentaQuietos();
      var cliente = tarjeta.getAttribute('data-cliente');
      if (etapas.indexOf(etapa) > etapas.indexOf(desde)) corre(etapa, cliente);
      else { marcaRegla(''); anota(cliente + tr(' moved back to ', ' volvió a ') + nombres[etapa] + tr('. Nothing runs.', '. No corre nada.'), false); }
    };
    var cierra = function () {
      if (!menu) return;
      if (menu.el.parentNode) menu.el.parentNode.removeChild(menu.el);
      menu.boton.setAttribute('aria-expanded', 'false');
      menu = null;
    };
    var abre = function (boton) {
      var tarjeta = boton.closest('.crm-tarjeta'), actual = tarjeta.closest('[data-etapa]').getAttribute('data-etapa');
      var el = document.createElement('div'), titulo = document.createElement('p');
      el.className = 'crm-menu'; el.setAttribute('role', 'menu'); el.setAttribute('aria-label', tr('Move to', 'Mover a'));
      titulo.className = 'crm-menu-titulo'; titulo.textContent = tr('Move to', 'Mover a');
      el.appendChild(titulo);
      etapas.forEach(function (et) {
        if (et === actual) return;
        var o = document.createElement('button');
        o.type = 'button'; o.className = 'crm-opcion'; o.setAttribute('role', 'menuitem');
        o.textContent = nombres[et];
        o.setAttribute('data-extra', etapas.indexOf(et) < etapas.indexOf(actual) ? tr('Move back', 'Regresar') : (reglas[et] ? reglas[et].length + tr(' automations', ' automatizaciones') : ''));
        o.addEventListener('click', function () { cierra(); mueve(tarjeta, et); boton.focus(); });
        el.appendChild(o);
      });
      el.addEventListener('keydown', function (e) {
        var ops = $$('.crm-opcion', el), i = ops.indexOf(document.activeElement);
        if (e.key === 'Escape') { e.preventDefault(); cierra(); boton.focus(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); ops[(i + 1) % ops.length].focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); ops[(i - 1 + ops.length) % ops.length].focus(); }
        else if (e.key === 'Tab') cierra();
      });
      tarjeta.appendChild(el);
      boton.setAttribute('aria-expanded', 'true');
      menu = { el: el, boton: boton };
      var primero = el.querySelector('.crm-opcion');
      if (primero) primero.focus();
    };
    $$('.crm-mover', crm).forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var mismo = menu && menu.boton === b;
        cierra();
        if (!mismo) abre(b);
      });
    });
    document.addEventListener('click', function (e) { if (menu && !menu.el.contains(e.target)) cierra(); });
    // Arrastrar: solo con mouse (en una pantalla táctil el dedo sirve para bajar por la página; ahí está el menú).
    crm.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      var t = e.target.closest ? e.target.closest('.crm-tarjeta') : null;
      if (!t || e.target.closest('button') || e.target.closest('.crm-menu')) return;
      arrastre = { t: t, x: e.clientX, y: e.clientY, activo: false, fantasma: null, dx: 0, dy: 0 };
    });
    document.addEventListener('pointermove', function (e) {
      if (!arrastre) return;
      var a = arrastre;
      if (!a.activo) {
        if (Math.abs(e.clientX - a.x) + Math.abs(e.clientY - a.y) < 6) return;
        var r = a.t.getBoundingClientRect();
        a.dx = a.x - r.left; a.dy = a.y - r.top;
        a.fantasma = a.t.cloneNode(true);
        $$('button, .crm-menu', a.fantasma).forEach(function (x) { if (x.parentNode) x.parentNode.removeChild(x); });
        a.fantasma.className = 'crm-tarjeta crm-fantasma';
        a.fantasma.setAttribute('aria-hidden', 'true');
        a.fantasma.style.width = r.width + 'px';
        document.body.appendChild(a.fantasma);
        a.activo = true;
        a.t.classList.add('arrastrando');
        cierra();
      }
      a.fantasma.style.transform = 'translate(' + (e.clientX - a.dx) + 'px, ' + (e.clientY - a.dy) + 'px) rotate(2deg)';
      var bajo = document.elementFromPoint(e.clientX, e.clientY);
      var col = bajo && bajo.closest ? bajo.closest('[data-etapa]') : null;
      $$('[data-etapa]', crm).forEach(function (c) { c.classList.toggle('encima', c === col); });
    });
    var suelta = function (e) {
      if (!arrastre) return;
      var a = arrastre;
      arrastre = null;
      if (!a.activo) return;
      var bajo = e ? document.elementFromPoint(e.clientX, e.clientY) : null;
      var col = bajo && bajo.closest ? bajo.closest('[data-etapa]') : null;
      if (a.fantasma && a.fantasma.parentNode) a.fantasma.parentNode.removeChild(a.fantasma);
      a.t.classList.remove('arrastrando');
      $$('[data-etapa]', crm).forEach(function (c) { c.classList.remove('encima'); });
      if (col && crm.contains(col)) mueve(a.t, col.getAttribute('data-etapa'));
    };
    document.addEventListener('pointerup', suelta);
    document.addEventListener('pointercancel', function () { suelta(null); });
    if (quietos) quietos.addEventListener('click', function () {
      var lista = tarjetasDe('cotizado').filter(esQuieta);
      if (!lista.length) return;
      if (aviso) aviso.hidden = true;
      marcaRegla('cotizado');
      lista.forEach(function (t, k) {
        t.classList.add('seguido');
        setTimeout(function () {
          anota(ES ? 'Seguimiento redactado para ' + t.getAttribute('data-cliente') + ' tras ' + t.getAttribute('data-dias') + ' días sin respuesta' : 'Follow-up drafted for ' + t.getAttribute('data-cliente') + ' after ' + t.getAttribute('data-dias') + ' quiet days', true);
          acciones++; minutos += 4; contadores();
        }, quieto ? 0 : 520 * (k + 1));
      });
      cuentaQuietos();
    });
    totales(); contadores(); cuentaQuietos();
  });

  /* ---------- las apps (data-apps): el portal de la oficina y la app del celular comparten los mismos datos ---------- */
  $$('[data-apps]').forEach(function (app) {
    var q = function (s) { return app.querySelector(s); };
    var pon = function (sel, t) { var el = q(sel); if (el) el.textContent = t; };
    var reloj = 11 * 60 + 5;
    var hora = function () {
      reloj += 3;
      var h = Math.floor(reloj / 60), m = reloj % 60;
      return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    };
    var actividad = q('[data-apps-actividad]');
    var anota = function (t) {
      if (!actividad) return;
      var li = document.createElement('li'), tm = document.createElement('time');
      li.className = 'nuevo'; tm.textContent = hora();
      li.appendChild(tm); li.appendChild(document.createTextNode(t));
      actividad.insertBefore(li, actividad.firstChild);
      while (actividad.children.length > 5) actividad.removeChild(actividad.lastChild);
    };
    var pendientes = 2, cotizaciones = 9, valorCot = 24300, hechos = 2, deDan = 2;
    var frases = ES ? ['Nada te necesita.', 'Una cosa te necesita.', 'Dos cosas te necesitan.'] : ['Nothing needs you.', 'One thing needs you.', 'Two things need you.'];
    $$('[data-apps-aprobar]', app).forEach(function (b) {
      b.addEventListener('click', function () {
        var tipo = b.getAttribute('data-apps-aprobar'), li = b.closest('li');
        b.disabled = true;
        if (tipo === 'cotizacion') {
          cotizaciones++; valorCot += 18400;
          pon('[data-apps-cotizaciones]', cotizaciones);
          pon('[data-apps-cotizaciones-valor]', '$' + valorCot.toLocaleString('en-AU'));
          pon('[data-apps-nav-cotizaciones]', cotizaciones);
          anota(tr('Sent the bathroom quote to M. Patel and booked a follow-up.', 'Envió a M. Patel la cotización del baño y agendó un seguimiento.'));
        } else {
          pon('[data-apps-facturas]', '0');
          pon('[data-apps-nav-facturas]', '0');
          anota(tr('Filed INV-2041 with Sam’s approval and drafted the bill.', 'Archivó INV-2041 con la aprobación de Sam y creó la cuenta por pagar.'));
        }
        pendientes = Math.max(0, pendientes - 1);
        pon('[data-apps-needs]', pendientes);
        pon('[data-apps-pendientes]', frases[pendientes]);
        if (li) li.classList.add('resuelto');
        var quita = function () {
          if (li && li.parentNode) li.parentNode.removeChild(li);
          var v = q('[data-apps-vacio]');
          if (v) v.hidden = pendientes > 0;
        };
        if (quieto) quita(); else setTimeout(quita, 380);
      });
    });
    var trabajos = ES ? [
      { clave: 'willoughby', lugar: 'Willoughby', etiqueta: 'Siguiente · en 25 min', hora: '11:30 · Willoughby', que: 'Cambio de llave', quien: 'Tom R. · 14 Laurel Street', ruta: 'Cómo llegar · 12 min', nota: '“Cambié la llave mezcladora. La anterior estaba corroída.”', cliente: 'Tom', informe: 'la factura y una solicitud de reseña' },
      { clave: 'mosman', lugar: 'Mosman', etiqueta: 'Siguiente · 16:00', hora: '16:00 · Mosman', que: 'Revisión de gas', quien: 'Lena K. · 8 Raglan Street', ruta: 'Cómo llegar · 18 min', nota: '“Revisión de gas aprobada. Le dejé el certificado a Lena.”', cliente: 'Lena', informe: 'el informe de seguridad de gas y la factura' }
    ] : [
      { clave: 'willoughby', lugar: 'Willoughby', etiqueta: 'Next · in 25 min', hora: '11:30 · Willoughby', que: 'Tap replacement', quien: 'Tom R. · 14 Laurel Street', ruta: 'Directions · 12 min', nota: '“Replaced the mixer tap. The old one was corroded.”', cliente: 'Tom', informe: 'the invoice and a review request' },
      { clave: 'mosman', lugar: 'Mosman', etiqueta: 'Next · 16:00', hora: '16:00 · Mosman', que: 'Gas check', quien: 'Lena K. · 8 Raglan Street', ruta: 'Directions · 18 min', nota: '“Gas check passed. Certificate left with Lena.”', cliente: 'Lena', informe: 'the gas safety report and the invoice' }
    ];
    var actual = 0;
    var botonNota = q('[data-apps-nota]'), botonHecho = q('[data-apps-hecho]'), notaTexto = q('[data-apps-nota-texto]');
    var pinta = function () {
      var t = trabajos[actual];
      if (!t) {
        pon('[data-apps-etiqueta]', tr('All done', 'Todo listo'));
        pon('[data-apps-hora]', tr('Your jobs are finished', 'Terminaste tus trabajos'));
        pon('[data-apps-que]', tr('Nice work, Dan.', 'Buen trabajo, Dan.'));
        pon('[data-apps-quien]', tr('Reports and invoices have gone out.', 'Los informes y las facturas ya salieron.'));
        var dir = q('[data-apps-direcciones]'); if (dir) dir.hidden = true;
        var bs = q('[data-apps-botones]'); if (bs) bs.hidden = true;
        if (notaTexto) notaTexto.hidden = true;
        return;
      }
      pon('[data-apps-etiqueta]', t.etiqueta); pon('[data-apps-hora]', t.hora); pon('[data-apps-que]', t.que);
      pon('[data-apps-quien]', t.quien); pon('[data-apps-direcciones]', t.ruta);
      if (notaTexto) { notaTexto.hidden = true; notaTexto.textContent = t.nota; }
      if (botonNota) { botonNota.disabled = false; botonNota.textContent = tr('Voice note', 'Nota de voz'); }
    };
    if (botonNota) botonNota.addEventListener('click', function () {
      var t = trabajos[actual];
      if (!t) return;
      botonNota.disabled = true;
      botonNota.textContent = tr('Recording…', 'Grabando…');
      setTimeout(function () {
        if (trabajos[actual] !== t) return;
        botonNota.textContent = tr('Note added', 'Nota agregada');
        if (notaTexto) notaTexto.hidden = false;
        anota(ES ? 'Transcribió la nota de voz de Dan del trabajo en ' + t.lugar + '.' : 'Wrote up Dan’s voice note for the ' + t.lugar + ' job.');
      }, quieto ? 0 : 1200);
    });
    if (botonHecho) botonHecho.addEventListener('click', function () {
      var t = trabajos[actual];
      if (!t) return;
      var fila = q('[data-apps-trabajo="' + t.clave + '"]');
      if (fila) {
        fila.classList.remove('siguiente'); fila.classList.add('hecho');
        var e = fila.querySelector('[data-apps-estado]'); if (e) e.textContent = tr('Done', 'Listo');
      }
      hechos++; deDan++;
      pon('[data-apps-hechos]', hechos);
      pon('[data-apps-progreso-texto]', deDan + tr(' of 4 done', ' de 4 listos'));
      var barra = q('[data-apps-progreso]');
      if (barra) barra.style.setProperty('--hecho', (deDan / 4).toFixed(2));
      anota(ES ? 'Le envió a ' + t.cliente + ' ' + t.informe + '.' : 'Sent ' + t.cliente + ' ' + t.informe + '.');
      actual++;
      var sig = trabajos[actual];
      if (sig) {
        var f2 = q('[data-apps-trabajo="' + sig.clave + '"]');
        if (f2) { f2.classList.add('siguiente'); var e2 = f2.querySelector('[data-apps-estado]'); if (e2) e2.textContent = tr('Next', 'Siguiente'); }
        pon('[data-apps-dan]', tr('Heading to ', 'Va camino a ') + sig.lugar);
        var luego = q('[data-apps-luego]');
        if (luego) { luego.innerHTML = ''; var vacio = document.createElement('li'); vacio.className = 'movil-vacio'; vacio.textContent = tr('Nothing else today', 'Nada más por hoy'); luego.appendChild(vacio); }
      } else {
        pon('[data-apps-dan]', tr('Done for the day', 'Terminó por hoy'));
      }
      pinta();
    });
  });

  /* ---------- franja que se mueve: botón de pausa ---------- */
  $$('[data-pausa]').forEach(function (b) {
    var franja = b.closest('.franja');
    b.addEventListener('click', function () {
      var pausada = franja.classList.toggle('pausada');
      b.setAttribute('aria-pressed', String(pausada));
      b.textContent = pausada ? 'Resume' : 'Pause';
    });
  });

  /* ---------- clics a WhatsApp (se miden como "Contact" si hay píxel) ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="wa.me/"]');
    if (a) evento('Contact', { content_name: 'WhatsApp' });
  });

  /* ---------- el formulario ---------- */
  var SITIO_FORM = {
    // 8 a 15 dígitos (con lada o sin ella), con espacios, guiones, puntos, paréntesis y + permitidos.
    validaTelefono: function (texto) {
      var t = String(texto || '').trim();
      if (!/^\+?[\d\s().\-]+$/.test(t)) return false;
      var digitos = t.replace(/\D/g, '');
      return digitos.length >= 8 && digitos.length <= 15;
    },
    validaCorreo: function (texto) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(texto || '').trim()); },
  };
  window.SITIO_FORM = SITIO_FORM;
  var abierto = Date.now();

  function marca(campo, mensaje) {
    var caja = campo.closest('.campo');
    var error = caja && caja.querySelector('.error');
    campo.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
    if (error) error.textContent = mensaje || '';
  }

  function mensajeWhatsApp(datos, form) {
    var lineas = [form.getAttribute('data-saludo') || 'Hola, me interesa recibir información.'];
    $$('input, select, textarea', form).forEach(function (c) {
      if (!c.name || c.closest('[data-trampa]') || !datos[c.name]) return;
      var etiqueta = form.querySelector('label[for="' + c.id + '"]');
      lineas.push((etiqueta ? etiqueta.textContent.replace(/\s*\*?\s*$/, '') : c.name) + ': ' + datos[c.name]);
    });
    return lineas.join('\n');
  }

  $$('form[data-formulario]').forEach(function (form) {
    var estado = form.querySelector('.estado-formulario');
    var enviar = form.querySelector('[type="submit"]');
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var trampa = form.querySelector('[data-trampa] input');
      // Un robot llena el campo escondido o manda en menos de 3 segundos: se le dice "listo" y no se manda nada.
      if ((trampa && trampa.value) || Date.now() - abierto < 3000) { form.reset(); if (estado) estado.textContent = '¡Listo!'; return; }

      var bien = true;
      $$('input, select, textarea', form).forEach(function (c) {
        if (c.closest('[data-trampa]') || c.type === 'hidden') return;
        var valor = (c.value || '').trim();
        var msg = '';
        if (c.required && !valor) msg = 'Este dato hace falta.';
        else if (valor && c.type === 'tel' && !SITIO_FORM.validaTelefono(valor)) msg = 'Revisa el número (con lada, de 8 a 15 dígitos).';
        else if (valor && c.type === 'email' && !SITIO_FORM.validaCorreo(valor)) msg = 'Revisa el correo.';
        marca(c, msg);
        if (msg && bien) { bien = false; c.focus(); }
      });
      if (!bien) { if (estado) { estado.dataset.tipo = 'error'; estado.textContent = 'Falta corregir algo arriba.'; } return; }

      var datos = {};
      new FormData(form).forEach(function (v, k) { if (!(trampa && k === trampa.name)) datos[k] = String(v).trim(); });
      var destino = (S.formulario && S.formulario.destino) || 'whatsapp';
      if (enviar) enviar.disabled = true;
      if (estado) { estado.dataset.tipo = ''; estado.textContent = 'Enviando…'; }

      if (destino === 'webhook' && S.formulario.webhook) {
        datos.pagina = location.href;
        datos.enviado = new Date().toISOString();
        fetch(S.formulario.webhook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(datos) })
          .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            try { sessionStorage.setItem('formulario_enviado', '1'); } catch (x) {}
            location.href = '/gracias';
          })
          .catch(function () {
            if (enviar) enviar.disabled = false;
            if (estado) {
              estado.dataset.tipo = 'error';
              estado.innerHTML = 'No se pudo enviar. ' + (S.whatsapp ? '<a href="https://wa.me/' + S.whatsapp + '">Escríbenos por WhatsApp</a>.' : 'Inténtalo de nuevo en un momento.');
            }
          });
      } else if (S.whatsapp) {
        evento('Lead', { content_name: 'Formulario a WhatsApp' });
        location.href = 'https://wa.me/' + S.whatsapp + '?text=' + encodeURIComponent(mensajeWhatsApp(datos, form));
        if (enviar) setTimeout(function () { enviar.disabled = false; if (estado) estado.textContent = ''; }, 2500);
      } else {
        if (enviar) enviar.disabled = false;
        if (estado) { estado.dataset.tipo = 'error'; estado.textContent = 'Este formulario todavía no tiene a dónde llegar.'; }
      }
    });
  });

  /* ---------- página de gracias: el "Lead" se cuenta aquí, ya con la página cargada ---------- */
  if (document.body.hasAttribute('data-gracias')) {
    try {
      if (sessionStorage.getItem('formulario_enviado') === '1') {
        sessionStorage.removeItem('formulario_enviado');
        evento('Lead', { content_name: 'Formulario' });
      }
    } catch (x) {}
  }
})();
