/* contacto.js — the two-step contact form of /contact and /es/contact.
 *
 * It sends to the SAME server the old site uses (negocio.json → contacto.servidor), which keeps the CRM key, checks
 * everything a second time and passes the enquiry to the CRM. Nothing secret lives in this file.
 *
 * The field names and the option values are the CRM contract. Do not rename or translate them:
 *   interest, problem, first_name, last_name, company_name, work_email, phone_country, phone_national   (step 1)
 *   job_title, company_website, industry, location, company_size, timeline, preferred_contact           (step 2, optional)
 *   website  = the trap against robots (NOT the company website, that one is company_website)
 * The rules here copy lib/contact/schema.ts of the Next.js site. If they change there, change them here.
 */
(function () {
  'use strict';
  var form = document.querySelector('form[data-contacto]');
  if (!form) return;

  var locale = (document.documentElement.lang || '').slice(0, 2) === 'es' ? 'es' : 'en';
  var SERVIDOR = form.getAttribute('data-servidor') || '';
  var PAISES = [["AU","+61","Australia","Australia"],["NZ","+64","New Zealand","Nueva Zelanda"],["GB","+44","United Kingdom","Reino Unido"],["US","+1","United States","Estados Unidos"],["AF","+93","Afghanistan","Afganistán"],["AX","+358","Åland Islands","Islas Åland"],["AL","+355","Albania","Albania"],["DZ","+213","Algeria","Argelia"],["AS","+1684","American Samoa","Samoa Americana"],["AD","+376","Andorra","Andorra"],["AO","+244","Angola","Angola"],["AI","+1264","Anguilla","Anguila"],["AG","+1268","Antigua and Barbuda","Antigua y Barbuda"],["AR","+54","Argentina","Argentina"],["AM","+374","Armenia","Armenia"],["AW","+297","Aruba","Aruba"],["AT","+43","Austria","Austria"],["AZ","+994","Azerbaijan","Azerbaiyán"],["BS","+1242","Bahamas","Bahamas"],["BH","+973","Bahrain","Baréin"],["BD","+880","Bangladesh","Bangladés"],["BB","+1246","Barbados","Barbados"],["BY","+375","Belarus","Bielorrusia"],["BE","+32","Belgium","Bélgica"],["BZ","+501","Belize","Belice"],["BJ","+229","Benin","Benín"],["BM","+1441","Bermuda","Bermudas"],["BT","+975","Bhutan","Bután"],["BO","+591","Bolivia","Bolivia"],["BA","+387","Bosnia and Herzegovina","Bosnia-Herzegovina"],["BW","+267","Botswana","Botsuana"],["BR","+55","Brazil","Brasil"],["IO","+246","British Indian Ocean Territory","Territorio Británico del Océano Índico"],["VG","+1284","British Virgin Islands","Islas Vírgenes Británicas"],["BN","+673","Brunei","Brunéi"],["BG","+359","Bulgaria","Bulgaria"],["BF","+226","Burkina Faso","Burkina Faso"],["BI","+257","Burundi","Burundi"],["KH","+855","Cambodia","Camboya"],["CM","+237","Cameroon","Camerún"],["CA","+1","Canada","Canadá"],["CV","+238","Cape Verde","Cabo Verde"],["BQ","+599","Caribbean Netherlands","Caribe neerlandés"],["KY","+1345","Cayman Islands","Islas Caimán"],["CF","+236","Central African Republic","República Centroafricana"],["TD","+235","Chad","Chad"],["CL","+56","Chile","Chile"],["CN","+86","China","China"],["CX","+61","Christmas Island","Isla de Navidad"],["CC","+61","Cocos (Keeling) Islands","Islas Cocos"],["CO","+57","Colombia","Colombia"],["KM","+269","Comoros","Comoras"],["CG","+242","Congo - Brazzaville","República del Congo"],["CD","+243","Congo - Kinshasa","República Democrática del Congo"],["CK","+682","Cook Islands","Islas Cook"],["CR","+506","Costa Rica","Costa Rica"],["CI","+225","Côte d'Ivoire","Costa de Marfil"],["HR","+385","Croatia","Croacia"],["CU","+53","Cuba","Cuba"],["CW","+599","Curaçao","Curazao"],["CY","+357","Cyprus","Chipre"],["CZ","+420","Czechia","Chequia"],["DK","+45","Denmark","Dinamarca"],["DJ","+253","Djibouti","Yibuti"],["DM","+1767","Dominica","Dominica"],["DO","+1809","Dominican Republic","República Dominicana"],["EC","+593","Ecuador","Ecuador"],["EG","+20","Egypt","Egipto"],["SV","+503","El Salvador","El Salvador"],["GQ","+240","Equatorial Guinea","Guinea Ecuatorial"],["ER","+291","Eritrea","Eritrea"],["EE","+372","Estonia","Estonia"],["SZ","+268","Eswatini","Esuatini"],["ET","+251","Ethiopia","Etiopía"],["FK","+500","Falkland Islands","Islas Malvinas"],["FO","+298","Faroe Islands","Islas Feroe"],["FJ","+679","Fiji","Fiyi"],["FI","+358","Finland","Finlandia"],["FR","+33","France","Francia"],["GF","+594","French Guiana","Guayana Francesa"],["PF","+689","French Polynesia","Polinesia Francesa"],["GA","+241","Gabon","Gabón"],["GM","+220","Gambia","Gambia"],["GE","+995","Georgia","Georgia"],["DE","+49","Germany","Alemania"],["GH","+233","Ghana","Ghana"],["GI","+350","Gibraltar","Gibraltar"],["GR","+30","Greece","Grecia"],["GL","+299","Greenland","Groenlandia"],["GD","+1473","Grenada","Granada"],["GP","+590","Guadeloupe","Guadalupe"],["GU","+1671","Guam","Guam"],["GT","+502","Guatemala","Guatemala"],["GG","+44","Guernsey","Guernesey"],["GN","+224","Guinea","Guinea"],["GW","+245","Guinea-Bissau","Guinea-Bisáu"],["GY","+592","Guyana","Guyana"],["HT","+509","Haiti","Haití"],["HN","+504","Honduras","Honduras"],["HK","+852","Hong Kong","RAE de Hong Kong (China)"],["HU","+36","Hungary","Hungría"],["IS","+354","Iceland","Islandia"],["IN","+91","India","India"],["ID","+62","Indonesia","Indonesia"],["IR","+98","Iran","Irán"],["IQ","+964","Iraq","Irak"],["IE","+353","Ireland","Irlanda"],["IM","+44","Isle of Man","Isla de Man"],["IL","+972","Israel","Israel"],["IT","+39","Italy","Italia"],["JM","+1876","Jamaica","Jamaica"],["JP","+81","Japan","Japón"],["JE","+44","Jersey","Jersey"],["JO","+962","Jordan","Jordania"],["KZ","+7","Kazakhstan","Kazajistán"],["KE","+254","Kenya","Kenia"],["KI","+686","Kiribati","Kiribati"],["XK","+383","Kosovo","Kosovo"],["KW","+965","Kuwait","Kuwait"],["KG","+996","Kyrgyzstan","Kirguistán"],["LA","+856","Laos","Laos"],["LV","+371","Latvia","Letonia"],["LB","+961","Lebanon","Líbano"],["LS","+266","Lesotho","Lesoto"],["LR","+231","Liberia","Liberia"],["LY","+218","Libya","Libia"],["LI","+423","Liechtenstein","Liechtenstein"],["LT","+370","Lithuania","Lituania"],["LU","+352","Luxembourg","Luxemburgo"],["MO","+853","Macao","RAE de Macao (China)"],["MG","+261","Madagascar","Madagascar"],["MW","+265","Malawi","Malaui"],["MY","+60","Malaysia","Malasia"],["MV","+960","Maldives","Maldivas"],["ML","+223","Mali","Mali"],["MT","+356","Malta","Malta"],["MH","+692","Marshall Islands","Islas Marshall"],["MQ","+596","Martinique","Martinica"],["MR","+222","Mauritania","Mauritania"],["MU","+230","Mauritius","Mauricio"],["YT","+262","Mayotte","Mayotte"],["MX","+52","Mexico","México"],["FM","+691","Micronesia","Micronesia"],["MD","+373","Moldova","Moldavia"],["MC","+377","Monaco","Mónaco"],["MN","+976","Mongolia","Mongolia"],["ME","+382","Montenegro","Montenegro"],["MS","+1664","Montserrat","Montserrat"],["MA","+212","Morocco","Marruecos"],["MZ","+258","Mozambique","Mozambique"],["MM","+95","Myanmar","Myanmar (Birmania)"],["NA","+264","Namibia","Namibia"],["NR","+674","Nauru","Nauru"],["NP","+977","Nepal","Nepal"],["NL","+31","Netherlands","Países Bajos"],["NC","+687","New Caledonia","Nueva Caledonia"],["NI","+505","Nicaragua","Nicaragua"],["NE","+227","Niger","Níger"],["NG","+234","Nigeria","Nigeria"],["NU","+683","Niue","Niue"],["NF","+672","Norfolk Island","Isla Norfolk"],["KP","+850","North Korea","Corea del Norte"],["MK","+389","North Macedonia","Macedonia del Norte"],["MP","+1670","Northern Mariana Islands","Islas Marianas del Norte"],["NO","+47","Norway","Noruega"],["OM","+968","Oman","Omán"],["PK","+92","Pakistan","Pakistán"],["PW","+680","Palau","Palaos"],["PS","+970","Palestine","Territorios Palestinos"],["PA","+507","Panama","Panamá"],["PG","+675","Papua New Guinea","Papúa Nueva Guinea"],["PY","+595","Paraguay","Paraguay"],["PE","+51","Peru","Perú"],["PH","+63","Philippines","Filipinas"],["PL","+48","Poland","Polonia"],["PT","+351","Portugal","Portugal"],["PR","+1787","Puerto Rico","Puerto Rico"],["QA","+974","Qatar","Catar"],["RE","+262","Réunion","Reunión"],["RO","+40","Romania","Rumania"],["RU","+7","Russia","Rusia"],["RW","+250","Rwanda","Ruanda"],["WS","+685","Samoa","Samoa"],["SM","+378","San Marino","San Marino"],["ST","+239","São Tomé and Príncipe","Santo Tomé y Príncipe"],["SA","+966","Saudi Arabia","Arabia Saudita"],["SN","+221","Senegal","Senegal"],["RS","+381","Serbia","Serbia"],["SC","+248","Seychelles","Seychelles"],["SL","+232","Sierra Leone","Sierra Leona"],["SG","+65","Singapore","Singapur"],["SX","+1721","Sint Maarten","Sint Maarten"],["SK","+421","Slovakia","Eslovaquia"],["SI","+386","Slovenia","Eslovenia"],["SB","+677","Solomon Islands","Islas Salomón"],["SO","+252","Somalia","Somalia"],["ZA","+27","South Africa","Sudáfrica"],["KR","+82","South Korea","Corea del Sur"],["SS","+211","South Sudan","Sudán del Sur"],["ES","+34","Spain","España"],["LK","+94","Sri Lanka","Sri Lanka"],["BL","+590","St Barthélemy","San Bartolomé"],["SH","+290","St Helena","Santa Elena"],["KN","+1869","St Kitts and Nevis","San Cristóbal y Nieves"],["LC","+1758","St Lucia","Santa Lucía"],["MF","+590","St Martin","San Martín"],["PM","+508","St Pierre and Miquelon","San Pedro y Miquelón"],["VC","+1784","St Vincent and the Grenadines","San Vicente y las Granadinas"],["SD","+249","Sudan","Sudán"],["SR","+597","Suriname","Surinam"],["SJ","+47","Svalbard and Jan Mayen","Svalbard y Jan Mayen"],["SE","+46","Sweden","Suecia"],["CH","+41","Switzerland","Suiza"],["SY","+963","Syria","Siria"],["TW","+886","Taiwan","Taiwán"],["TJ","+992","Tajikistan","Tayikistán"],["TZ","+255","Tanzania","Tanzania"],["TH","+66","Thailand","Tailandia"],["TL","+670","Timor-Leste","Timor Oriental"],["TG","+228","Togo","Togo"],["TK","+690","Tokelau","Tokelau"],["TO","+676","Tonga","Tonga"],["TT","+1868","Trinidad and Tobago","Trinidad y Tobago"],["TN","+216","Tunisia","Túnez"],["TR","+90","Turkey","Turquía"],["TM","+993","Turkmenistan","Turkmenistán"],["TC","+1649","Turks and Caicos Islands","Islas Turcas y Caicos"],["TV","+688","Tuvalu","Tuvalu"],["UG","+256","Uganda","Uganda"],["UA","+380","Ukraine","Ucrania"],["AE","+971","United Arab Emirates","Emiratos Árabes Unidos"],["UY","+598","Uruguay","Uruguay"],["VI","+1340","US Virgin Islands","Islas Vírgenes de EE. UU."],["UZ","+998","Uzbekistan","Uzbekistán"],["VU","+678","Vanuatu","Vanuatu"],["VA","+39","Vatican City","Ciudad del Vaticano"],["VE","+58","Venezuela","Venezuela"],["VN","+84","Vietnam","Vietnam"],["WF","+681","Wallis and Futuna","Wallis y Futuna"],["EH","+212","Western Sahara","Sáhara Occidental"],["YE","+967","Yemen","Yemen"],["ZM","+260","Zambia","Zambia"],["ZW","+263","Zimbabwe","Zimbabue"]];

  var TEXTOS = {
    en: {
      paso: function (n) { return 'Step ' + n + ' of 2'; },
      enviando: 'Sending…', enviandoSr: 'Sending your enquiry', enviado: 'Your enquiry has been sent.',
      copiado: 'Copied ✓', personas: 'people',
      gracias: function (n) { return 'Thanks, ' + n + '.'; }, graciasSinNombre: 'Thanks. We’ve got it.',
      minimo: function (t, m) { return t + '/' + m + ' minimum'; },
      copia: { name: 'Name', email: 'Email', phone: 'Phone', interest: 'Interest', company: 'Company', problem: 'Problem:' },
      pais: function (nombre, lada) { return 'Country code: ' + nombre + ' ' + lada; },
      e: {
        interest: 'Choose what you’re after so we know who to put on the call.',
        problemRequired: 'Tell us a little about the problem. Even a sentence or two helps.',
        problemMin: function (m) { return 'A sentence or two, please. At least ' + m + ' characters so we can prepare properly.'; },
        problemMax: function (m) { return 'Please keep this under ' + m + ' characters.'; },
        firstNameRequired: 'Please enter your first name.',
        lastNameRequired: 'Please enter your last name.',
        companyRequired: 'Please tell us which company you’re with.',
        tooLong: function (m) { return 'That’s longer than we can store (' + m + ' characters).'; },
        emailRequired: 'Please enter your email so we can reply.',
        emailTooLong: function (m) { return 'That email is too long (' + m + ' characters).'; },
        emailInvalid: 'That doesn’t look like a valid email address.',
        countryUnknown: 'Choose your country code from the list.',
        phoneRequired: 'Please enter a phone number.',
        phoneTooLong: function (m) { return 'That phone number is too long (' + m + ' characters).'; },
        phoneTooFewDigits: 'That doesn’t look like enough digits for a phone number.',
        phoneTooManyDigits: 'That’s more digits than a phone number has.',
        websiteLooksLikeEmail: 'That looks like an email address. We’re after the company’s website, like acme.com.au.',
        websiteInvalid: 'That doesn’t look like a web address. Try something like acme.com.au.'
      }
    },
    es: {
      paso: function (n) { return 'Paso ' + n + ' de 2'; },
      enviando: 'Enviando…', enviandoSr: 'Enviando tu consulta', enviado: 'Tu consulta ha sido enviada.',
      copiado: 'Copiado ✓', personas: 'personas',
      gracias: function (n) { return 'Gracias, ' + n + '.'; }, graciasSinNombre: 'Gracias. Ya lo recibimos.',
      minimo: function (t, m) { return t + '/' + m + ' mínimo'; },
      copia: { name: 'Nombre', email: 'Correo', phone: 'Teléfono', interest: 'Interés', company: 'Empresa', problem: 'Problema:' },
      pais: function (nombre, lada) { return 'Código de país: ' + nombre + ' ' + lada; },
      e: {
        interest: 'Elige qué estás buscando para saber quién debe estar en la llamada.',
        problemRequired: 'Cuéntanos algo sobre el problema. Con una o dos frases basta.',
        problemMin: function (m) { return 'Una o dos frases, por favor. Al menos ' + m + ' caracteres para poder prepararnos bien.'; },
        problemMax: function (m) { return 'Por favor, no superes los ' + m + ' caracteres.'; },
        firstNameRequired: 'Ingresa tu nombre.',
        lastNameRequired: 'Ingresa tu apellido.',
        companyRequired: 'Dinos en qué empresa trabajas.',
        tooLong: function (m) { return 'Es más largo de lo que podemos guardar (' + m + ' caracteres).'; },
        emailRequired: 'Ingresa tu correo para poder responderte.',
        emailTooLong: function (m) { return 'Ese correo es demasiado largo (' + m + ' caracteres).'; },
        emailInvalid: 'Eso no parece un correo válido.',
        countryUnknown: 'Elige tu código de país de la lista.',
        phoneRequired: 'Ingresa un número de teléfono.',
        phoneTooLong: function (m) { return 'Ese número es demasiado largo (' + m + ' caracteres).'; },
        phoneTooFewDigits: 'Parecen muy pocos dígitos para un número de teléfono.',
        phoneTooManyDigits: 'Son más dígitos de los que tiene un número de teléfono.',
        websiteLooksLikeEmail: 'Eso parece un correo. Buscamos el sitio web de la empresa, como acme.com.',
        websiteInvalid: 'Eso no parece una dirección web. Prueba con algo como acme.com.'
      }
    }
  };
  var T = TEXTOS[locale], E = T.e;

  /* ---------- the rules (copied from schema.ts) ---------- */
  var MAX = { problem: 5000, first_name: 100, last_name: 100, company_name: 200, job_title: 150, work_email: 320,
    phone_national: 30, company_website: 500, industry: 120, location: 200 };
  var PROBLEM_MIN = 50, TEL_MIN = 6, TEL_MAX = 15;
  var PASO_1 = ['interest', 'problem', 'first_name', 'last_name', 'company_name', 'work_email', 'phone_country', 'phone_national'];
  var PASO_2 = ['job_title', 'company_website', 'industry', 'location', 'company_size', 'timeline', 'preferred_contact'];
  var CERO_CUENTA = { IT: 1, VA: 1 };   // in Italy the leading zero is part of the number

  function digitos(t) { return String(t || '').replace(/\D/g, ''); }
  function pais(iso) { for (var i = 0; i < PAISES.length; i++) if (PAISES[i][0] === iso) return PAISES[i]; return null; }
  function bandera(iso) { try { return String.fromCodePoint(0x1F1E6 + iso.charCodeAt(0) - 65, 0x1F1E6 + iso.charCodeAt(1) - 65); } catch (x) { return ''; } }
  function miles(n) { try { return n.toLocaleString(locale === 'es' ? 'es-419' : 'en-AU'); } catch (x) { return String(n); } }

  // The phone the CRM receives: country code + national number, as one string. Same as composePhone() on the server.
  function telefonoCompleto(iso, nacional) {
    var crudo = String(nacional || '').trim();
    if (!crudo) return '';
    if (crudo.charAt(0) === '+') return '+' + digitos(crudo);
    if (crudo.slice(0, 2) === '00') return '+' + digitos(crudo).replace(/^00/, '');
    var p = pais(iso) || pais('AU');
    var d = digitos(crudo);
    if (!CERO_CUENTA[p[0]]) d = d.replace(/^0+/, '');
    return p[1] + d;
  }
  function conEsquema(crudo) { var v = String(crudo || '').trim(); return !v ? '' : /^https?:\/\//i.test(v) ? v : 'https://' + v; }
  function pareceUrl(crudo) { try { var u = new URL(conEsquema(crudo)); return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.indexOf('.') > -1; } catch (x) { return false; } }
  function pareceCorreo(crudo) { try { var u = new URL(conEsquema(crudo)); return u.username !== '' || u.password !== ''; } catch (x) { return false; } }
  function correoValido(v) { return /^[^\s@<>()[\],;:"]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/.test(v) && v.indexOf('..') === -1; }

  function valores() {
    var v = {};
    PASO_1.concat(PASO_2).forEach(function (n) {
      var c = form.elements[n];
      v[n] = n === 'interest' ? ((form.querySelector('input[name="interest"]:checked') || {}).value || '') : String((c && c.value) || '');
    });
    v.website = String((form.elements.website && form.elements.website.value) || '');
    return v;
  }

  // '' when the field is fine, or the sentence to show under it.
  function revisa(nombre, v) {
    var x = String(v[nombre] || '').trim();
    switch (nombre) {
      case 'interest': return x ? '' : E.interest;
      case 'problem':
        if (!x) return E.problemRequired;
        if (x.length < PROBLEM_MIN) return E.problemMin(PROBLEM_MIN);
        return x.length > MAX.problem ? E.problemMax(miles(MAX.problem)) : '';
      case 'first_name': return !x ? E.firstNameRequired : x.length > MAX.first_name ? E.tooLong(MAX.first_name) : '';
      case 'last_name': return !x ? E.lastNameRequired : x.length > MAX.last_name ? E.tooLong(MAX.last_name) : '';
      case 'company_name': return !x ? E.companyRequired : x.length > MAX.company_name ? E.tooLong(MAX.company_name) : '';
      case 'work_email':
        if (!x) return E.emailRequired;
        if (x.length > MAX.work_email) return E.emailTooLong(MAX.work_email);
        return correoValido(x) ? '' : E.emailInvalid;
      case 'phone_country': return pais(x) ? '' : E.countryUnknown;
      case 'phone_national':
        if (!x) return E.phoneRequired;
        if (x.length > MAX.phone_national) return E.phoneTooLong(MAX.phone_national);
        if (digitos(x).length < TEL_MIN) return E.phoneTooFewDigits;
        return digitos(x).length > TEL_MAX ? E.phoneTooManyDigits : '';
      case 'company_website':
        if (!x) return '';
        if (x.length > MAX.company_website) return E.tooLong(MAX.company_website);
        if (pareceCorreo(x)) return E.websiteLooksLikeEmail;
        return pareceUrl(x) ? '' : E.websiteInvalid;
      case 'job_title': case 'industry': case 'location':
        return x.length > MAX[nombre] ? E.tooLong(MAX[nombre]) : '';
      default: return '';
    }
  }

  // Exposed so the phone rule can be tested from outside (the kit tests 22 countries against the bar form; this
  // form splits country and number, so it has its own door).
  window.CONTACTO_FORM = { revisa: revisa, telefonoCompleto: telefonoCompleto, paises: PAISES };

  /* ---------- the page ---------- */
  var $ = function (s, r) { return (r || form).querySelector(s); };
  var paso1 = $('[data-paso="1"]'), paso2 = $('[data-paso="2"]');
  var barras = form.querySelectorAll('.pasos-barra i');
  var rotuloPaso = $('[data-paso-texto]');
  var alerta = $('[data-sin-conexion]');
  var estado = $('.estado-formulario');
  var enviar = $('[data-enviar]');
  var contador = $('[data-contador]');
  var selPais = form.elements.phone_country;
  var paso = 1, enVuelo = false, envioIniciado = false;

  var llave = '';
  function llaveUnica() {
    if (!llave) {
      var u = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
        : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) + '-' + Math.random().toString(36).slice(2);
      llave = 'web-form-' + u;
    }
    return llave;
  }
  llaveUnica();

  // The country list. The HTML carries Australia alone, so the field works even before this runs.
  if (selPais) {
    var elegido = selPais.value || 'AU', trozo = document.createDocumentFragment();
    PAISES.forEach(function (p, i) {
      var o = document.createElement('option');
      o.value = p[0];
      o.textContent = (bandera(p[0]) + ' ' + p[1] + ' ' + p[locale === 'es' ? 3 : 2]).trim();   // code first: the closed field is narrow
      trozo.appendChild(o);
      if (i === 3) { var raya = document.createElement('option'); raya.disabled = true; raya.textContent = '──────────'; trozo.appendChild(raya); }
    });
    selPais.textContent = '';
    selPais.appendChild(trozo);
    selPais.value = elegido;
  }

  // The language switch in the bar goes to the same page in the other language, not to the home page.
  var idioma = document.querySelector('a.idioma');
  // It already points to the home page in the other language ("/es/" or "/"); the same page sits right under it.
  // Built from that link rather than written out, so it also works when the site lives in a sub-folder.
  if (idioma) { var base = idioma.getAttribute('href') || (locale === 'es' ? '/' : '/es/'); idioma.setAttribute('href', base.replace(/\/?$/, '/') + 'contact'); }

  function campoDe(nombre) { return nombre === 'interest' ? form.querySelector('input[name="interest"]') : form.elements[nombre]; }
  function cajaDe(nombre) { var c = campoDe(nombre); return c && c.closest('[data-campo]'); }
  function marca(nombre, mensaje) {
    var caja = cajaDe(nombre), c = campoDe(nombre);
    if (!caja || !c) return;
    var error = caja.querySelector('.error[data-de="' + nombre + '"]') || caja.querySelector('.error');
    var objetivo = nombre === 'interest' ? caja : c;
    if (mensaje) objetivo.setAttribute('aria-invalid', 'true'); else objetivo.removeAttribute('aria-invalid');
    if (error) error.textContent = mensaje || '';
  }
  function revisaPaso(nombres) {
    var v = valores(), primero = null;
    nombres.forEach(function (n) { var m = revisa(n, v); marca(n, m); if (m && !primero) primero = n; });
    if (primero) { var c = campoDe(primero); if (c) c.focus(); }
    return !primero;
  }

  function muestraPaso(n, enfocar) {
    paso = n;
    paso1.hidden = n !== 1;
    paso2.hidden = n !== 2;
    if (barras[1]) barras[1].classList.toggle('lleno', n === 2);
    if (rotuloPaso) rotuloPaso.textContent = T.paso(n);
    if (enfocar) { var h = $('[data-paso="' + n + '"] h2'); if (h) { try { h.focus({ preventScroll: true }); } catch (x) { h.focus(); } } form.scrollIntoView({ block: 'start' }); }
  }

  function pintaContador() {
    if (!contador) return;
    var largo = String(form.elements.problem.value || '').trim().length;
    contador.textContent = largo < PROBLEM_MIN ? T.minimo(largo, PROBLEM_MIN) : largo + '/' + miles(MAX.problem);
    contador.classList.toggle('pasado', largo > MAX.problem);
  }
  form.elements.problem.addEventListener('input', pintaContador);
  pintaContador();

  // Each field is checked when you leave it, and the message goes away as soon as it is fixed.
  form.addEventListener('focusout', function (e) {
    var n = e.target && e.target.name;
    if (!n || n === 'website' || n === 'interest') return;
    if (PASO_1.indexOf(n) > -1 || PASO_2.indexOf(n) > -1) marca(n, revisa(n, valores()));
  });
  form.addEventListener('change', function (e) {
    if (e.target && e.target.name === 'interest') marca('interest', '');
  });

  function sigue() { if (revisaPaso(PASO_1)) muestraPaso(2, true); }
  $('[data-seguir]').addEventListener('click', sigue);
  $('[data-atras]').addEventListener('click', function () { muestraPaso(1, true); });

  // Enter in a field of step 1 moves to step 2, it never sends the form half-way.
  form.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || paso !== 1) return;
    var t = e.target;
    if (!t || t.tagName === 'TEXTAREA' || t.tagName === 'BUTTON') return;
    e.preventDefault();
    sigue();
  });

  function cuerpo() {
    var v = valores();
    v.idempotency_key = llaveUnica();
    v.locale = locale;
    return JSON.stringify(v);
  }
  function manda(extra) {
    var o = { method: 'POST', headers: { 'content-type': 'application/json' }, body: cuerpo() };
    if (extra) for (var k in extra) o[k] = extra[k];
    return fetch(SERVIDOR, o);
  }

  // Someone who filled step 1 and leaves at step 2 is still an enquiry: it is sent as they go, with the same key,
  // so finishing later does not create a second lead.
  window.addEventListener('pagehide', function () {
    if (paso !== 2 || envioIniciado || !SERVIDOR) return;
    var v = valores();
    for (var i = 0; i < PASO_1.length; i++) if (revisa(PASO_1[i], v)) return;
    envioIniciado = true;
    try { manda({ keepalive: true }).catch(function () {}); } catch (x) {}
  });

  function ocupado(si) {
    enVuelo = si;
    if (enviar) { enviar.disabled = si; enviar.textContent = si ? T.enviando : enviar.getAttribute('data-texto'); }
    if (estado) estado.textContent = si ? T.enviandoSr : '';
  }

  function exito(nombre) {
    var panel = document.querySelector('[data-contacto-gracias]');
    var cabecera = document.querySelector('[data-contacto-cabecera]');
    var titulo = panel.querySelector('[data-gracias-titulo]');
    titulo.textContent = nombre ? T.gracias(nombre) : T.graciasSinNombre;
    var marco = panel.querySelector('iframe[data-src]');
    if (marco && !marco.getAttribute('src')) {
      // The note above the calendar. Google fires "load" several seconds before the calendar is drawn, and the
      // page cannot see inside the frame, so the note stays 12 more seconds (and 30 at most, if "load" never comes).
      var cargando = panel.querySelector('[data-calendario-cargando]');
      var quita = function () { if (cargando) cargando.hidden = true; };
      marco.addEventListener('load', function () { setTimeout(quita, 12000); });
      setTimeout(quita, 30000);
      marco.setAttribute('src', marco.getAttribute('data-src'));
    }
    if (cabecera) cabecera.hidden = true;
    form.hidden = true;
    panel.hidden = false;
    var aviso = panel.querySelector('[role="status"]');
    if (aviso) aviso.textContent = T.enviado;
    var h = panel.querySelector('.gracias-titulo');
    if (h) h.focus();
    window.scrollTo(0, 0);
  }

  form.setAttribute('novalidate', '');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (enVuelo) return;
    if (paso === 1) { sigue(); return; }
    if (!revisaPaso(PASO_1)) { muestraPaso(1, false); revisaPaso(PASO_1); return; }
    if (!revisaPaso(PASO_2)) return;
    if (!SERVIDOR) { alerta.hidden = false; return; }

    var v = valores();
    envioIniciado = true;
    ocupado(true);
    alerta.hidden = true;

    manda().catch(function () {
      return new Promise(function (r) { setTimeout(r, 800); }).then(function () { return manda(); });
    }).then(function (r) {
      if (r.ok) { exito(v.first_name.trim()); return; }
      if (r.status === 422) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          var errores = (d && d.fieldErrors) || {}, nombres = Object.keys(errores).filter(function (n) { return campoDe(n); });
          nombres.forEach(function (n) { marca(n, String(errores[n])); });
          var enPaso1 = nombres.filter(function (n) { return PASO_1.indexOf(n) > -1; })[0];
          if (enPaso1) { muestraPaso(1, false); campoDe(enPaso1).focus(); }
          else if (nombres.length) { muestraPaso(2, false); campoDe(nombres[0]).focus(); }
          else alerta.hidden = false;
        });
      }
      alerta.hidden = false;
    }).catch(function () {
      alerta.hidden = false;
    }).then(function () {
      ocupado(false);
      envioIniciado = false;
      if (!alerta.hidden) alerta.scrollIntoView({ block: 'center' });
    });
  });

  // If the server cannot be reached, nothing typed is lost: it can be copied and sent another way.
  var copiar = $('[data-copiar]');
  if (copiar) copiar.addEventListener('click', function () {
    var v = valores(), c = T.copia;
    var elegida = form.querySelector('input[name="interest"]:checked');
    var interes = elegida ? (elegida.closest('label').querySelector('strong') || {}).textContent : v.interest;
    var lineas = [c.name + ': ' + (v.first_name + ' ' + v.last_name).trim(), c.email + ': ' + v.work_email,
      c.phone + ': ' + telefonoCompleto(v.phone_country, v.phone_national), c.interest + ': ' + (interes || '')];
    if (v.company_name) lineas.push(c.company + ': ' + v.company_name);
    lineas.push('', c.problem, v.problem);
    var texto = copiar.getAttribute('data-texto') || copiar.textContent;
    copiar.setAttribute('data-texto', texto);
    navigator.clipboard.writeText(lineas.join('\n')).then(function () {
      copiar.textContent = T.copiado;
      setTimeout(function () { copiar.textContent = texto; }, 4000);
    }).catch(function () {});
  });

  muestraPaso(1, false);
})();
