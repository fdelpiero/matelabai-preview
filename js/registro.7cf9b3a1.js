/* registro.js — the short "Get in touch" form of /register and /es/register.
 *
 * It sends to the SAME Google Form the old site used (negocio.json → registro.formulario_google), so the answers
 * keep landing in the same Google Sheet. The entry numbers below are the questions of that Google Form: if a
 * question is added or changed there, change them here. Google does not say whether it accepted the answer
 * (the old site could not tell either), so the thank-you appears once the request has gone out.
 */
(function () {
  'use strict';
  var form = document.querySelector('form[data-registro]');
  if (!form) return;

  var es = (document.documentElement.lang || '').slice(0, 2) === 'es';
  var DESTINO = form.getAttribute('data-destino') || '';
  var ENTRADAS = { firstName: 'entry.1145376415', lastName: 'entry.700943531', email: 'entry.355061805',
    type: 'entry.700825334', phone: 'entry.1329920861', assist: 'entry.829308819' };
  var MAX_AYUDA = 400;
  var T = es
    ? { falta: 'Este dato hace falta.', correo: 'Eso no parece un correo válido.', telefono: 'Revisa el número (de 6 a 15 dígitos).',
        enviando: 'Enviando...', fallo: 'No pudimos enviarlo. Revisa tu conexión e inténtalo de nuevo.' }
    : { falta: 'This one is needed.', correo: 'That doesn’t look like a valid email address.', telefono: 'Check the number (6 to 15 digits).',
        enviando: 'Sending...', fallo: 'We couldn’t send it. Check your connection and try again.' };

  var enviar = form.querySelector('[data-enviar]');
  var estado = form.querySelector('.estado-formulario');
  var contador = form.querySelector('[data-contador]');
  var ayuda = form.elements.assist;
  var abierto = Date.now(), enVuelo = false;

  // The language switch in the bar goes to the same page in the other language.
  var idioma = document.querySelector('a.idioma');
  // It already points to the home page in the other language ("/es/" or "/"); the same page sits right under it.
  // Built from that link rather than written out, so it also works when the site lives in a sub-folder.
  if (idioma) { var base = idioma.getAttribute('href') || (es ? '/' : '/es/'); idioma.setAttribute('href', base.replace(/\/?$/, '/') + 'register'); }

  function pinta() { if (contador) contador.textContent = ayuda.value.length + '/' + MAX_AYUDA; }
  ayuda.addEventListener('input', pinta);
  pinta();

  function marca(campo, mensaje) {
    var caja = campo.closest('[data-campo]'), error = caja && caja.querySelector('.error');
    if (mensaje) campo.setAttribute('aria-invalid', 'true'); else campo.removeAttribute('aria-invalid');
    if (error) error.textContent = mensaje || '';
  }
  function revisa(campo) {
    var v = String(campo.value || '').trim(), d = v.replace(/\D/g, '');
    if (campo.required && !v) return T.falta;
    if (v && campo.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return T.correo;
    if (v && campo.type === 'tel' && (!/^\+?[\d\s().\-]+$/.test(v) || d.length < 6 || d.length > 15)) return T.telefono;
    return '';
  }
  var CAMPOS = ['firstName', 'lastName', 'email', 'phone', 'type'];
  form.addEventListener('focusout', function (e) {
    if (e.target && CAMPOS.indexOf(e.target.name) > -1) marca(e.target, revisa(e.target));
  });

  function exito() {
    var cabecera = document.querySelector('[data-registro-cabecera]');
    var panel = document.querySelector('[data-registro-gracias]');
    if (cabecera) cabecera.hidden = true;
    form.hidden = true;
    panel.hidden = false;
    var h = panel.querySelector('.gracias-titulo');
    if (h) h.focus();
    window.scrollTo(0, 0);
  }

  form.setAttribute('novalidate', '');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (enVuelo) return;

    var primero = null;
    CAMPOS.forEach(function (n) {
      var c = form.elements[n], m = revisa(c);
      marca(c, m);
      if (m && !primero) primero = c;
    });
    if (primero) { primero.focus(); return; }

    // A robot fills the hidden field or sends in under 3 seconds: it is told "thanks" and nothing is sent.
    var trampa = form.querySelector('[data-trampa] input');
    if ((trampa && trampa.value) || Date.now() - abierto < 3000 || !DESTINO) { exito(); return; }

    var v = function (n) { return String(form.elements[n].value || '').trim(); };
    var datos = new URLSearchParams();
    datos.append(ENTRADAS.firstName, v('firstName'));
    datos.append(ENTRADAS.lastName, v('lastName'));
    datos.append(ENTRADAS.email, v('email'));
    datos.append(ENTRADAS.type, v('type'));
    if (v('phone')) datos.append(ENTRADAS.phone, form.elements.countryCode.value + ' ' + v('phone'));
    if (v('assist')) datos.append(ENTRADAS.assist, v('assist').slice(0, MAX_AYUDA));

    enVuelo = true;
    enviar.disabled = true;
    enviar.textContent = T.enviando;
    if (estado) { estado.classList.add('solo-lectores'); estado.textContent = T.enviando; }

    // "no-cors": Google Forms takes the answer but does not let the page read its reply.
    fetch(DESTINO, { method: 'POST', mode: 'no-cors', body: datos }).then(exito).catch(function () {
      enVuelo = false;
      enviar.disabled = false;
      enviar.textContent = enviar.getAttribute('data-texto');
      if (estado) { estado.classList.remove('solo-lectores'); estado.dataset.tipo = 'error'; estado.textContent = T.fallo; }
    });
  });
})();
