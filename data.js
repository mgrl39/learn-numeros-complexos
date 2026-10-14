/* =====================================================================
   data.js — enunciats (català), respostes exactes i solucionari
   Fitxer de dades: aquí no hi ha lògica de comprovació, només els valors
   correctes que l'app ha de validar.
   ===================================================================== */

/* --- petits ajuts per derivar les respostes dels enunciats --- */
const abs2 = (z) => Math.hypot(z[0], z[1]);
const S2 = Math.sqrt(0.5);   // 1/sqrt(2), sense dependre de Math.SQRT1_2
const inv_ = (z) => {
  const d = z[0] * z[0] + z[1] * z[1];
  return [z[0] / d, -z[1] / d];
};

/* --- constructors de caselles --- */
const W = {
  num:   (name, v, sol)   => ({ k: 'num',   name, v, sol }),
  cmp:   (name, v, sol)   => ({ k: 'cmp',   name, v, sol }),
  pol:   (name, r, th, sol, rLog) => ({ k: 'pol', name, r, th, sol, rLog }),
  root:  (name, v, sol)   => ({ k: 'sqrt',  name, v, sol }),
  roots: (name, coeffs, deg, sol) => ({ k: 'roots', name, coeffs, deg, sol }),
  fac:   (name, coeffs, sol, real, maxDeg) => ({ k: 'fac', name, coeffs, sol, real: !!real, maxDeg }),
  id:    (name, target, sol) => ({ k: 'id',  name, target, sol }),
  choice:(name, options, ans, sol) => ({ k: 'choice', name, options, ans, sol }),
  blank: (tex, any, sol)  => ({ k: 'blank', tex, any, sol }),
};

/* full estàndard de l'exercici 1 i 3 */
const info5 = (tex, z, plot, over = {}) => ({
  tex, z, plot: plot || 'info',
  w: [
    W.num('part real', z[0], over.re),
    W.num('part imaginària', z[1], over.im),
    W.num('mòdul', abs2(z), over.mod),
    W.cmp('conjugat', [z[0], -z[1]], over.conj),
    W.cmp('invers', inv_(z), over.inv),
  ],
});

/* =====================================================================
   SUBCONJUNTS DE L'EXERCICI 4 (per al test de clic)
   ===================================================================== */
const SETS = {
  A1: {
    tex: 'A_1=\\{z\\in\\mathbb{C}:|z+3|<2\\}',
    test: (x, y) => Math.hypot(x + 3, y) < 2,
    options: [
      'Un disc obert de centre \\(-3\\) i radi \\(2\\)',
      'Una circumferència de centre \\(-3\\) i radi \\(2\\)',
      'Un exterior de disc, amb el forat al voltant de \\(-3\\)',
      'Una semilluna',
    ],
    ans: 0,
    region: { type: 'disk', re: -3, im: 0, r: 2 },
    sol: 'És \\(|z-(-3)|<2\\): el disc obert de centre \\(-3\\) i radi \\(2\\). ' +
         'El mòdul \\(|z+3|\\) és la distància de \\(z\\) al punt \\(-3\\), de manera que la ' +
         'condició és exactament «distància a \\(-3\\) menor que 2».',
  },
  A2: {
    tex: 'A_2=\\{z\\in\\mathbb{C}:|\\operatorname{Re}z|+|\\operatorname{Im}z|<1\\}',
    test: (x, y) => Math.abs(x) + Math.abs(y) < 1,
    options: [
      'Un quadrat de costat \\(1\\) alineat amb els eixos',
      'Un rombe (quadrat girat 45°) amb vèrtexs \\((\\pm1,0),(0,\\pm1)\\)',
      'Una circumferència de radi \\(1\\)',
      'Un rombe amb vèrtexs \\((\\pm 1/2,0),(0,\\pm 1/2)\\)',
    ],
    ans: 1,
    region: { type: 'diamond', re: 0, im: 0, d: 1 },
    sol: 'En coordenades reals la condició és \\(|x|+|y|<1\\), que és la inequació del ' +
         'rombe de vèrtexs \\((1,0),(0,1),(-1,0),(0,-1)\\). Els eixos tallen la frontera ' +
         'a distància \\(1\\) de l\'origen.',
  },
  A3: {
    tex: 'A_3=\\{z\\in\\mathbb{C}:|z|=z\\}',
    test: (x, y) => Math.hypot(x, y) === x,
    options: [
      'Un disc de radi \\(0\\), és a dir l\'origen solament',
      'El semieix real \\(\\operatorname{Im}z>0\\)',
      'La semirrecta real positiva, \\(\\operatorname{Im}z=0\\) i \\(\\operatorname{Re}z\\ge 0\\)',
      'L\'eix real sencer',
    ],
    ans: 2,
    region: { type: 'ray', ang: 0 },
    sol: '\\(|z|\\) és sempre un nombre real \\(\\ge 0\\). Per tant \\(|z|=z\\) obliga ' +
         '\\(z\\) a ser real i no negatiu: \\(z\\in[0,+\\infty)\\). Si escrivim \\(z=x+iy\\), ' +
         'l\'equació \\(\\sqrt{x^2+y^2}=x\\) obliga \\(y=0\\) i \\(x\\ge0\\).',
  },
  A4: {
    tex: 'A_4=\\{z\\in\\mathbb{C}:|z|\\le\\operatorname{Re}z+2\\}',
    test: (x, y) => Math.hypot(x, y) <= x + 2,
    options: [
      'Un disc de centre \\(-1\\) i radi \\(1\\)',
      'L\'exterior d\'una paràbola, amb la vèrtex a \\((-1,0)\\) i eix de simetria l\'eix real',
      'L\'interior d\'una paràbola, amb la vèrtex a \\((-1,0)\\) i eix de simetria l\'eix real',
      'El semiplà \\(\\operatorname{Re}z\\ge -2\\)',
    ],
    ans: 1,
    region: { type: 'parab', vx: -1, vy: 0, p: 1 },
    sol: 'Amb \\(z=x+iy\\): \\(\\sqrt{x^2+y^2}\\le x+2\\) ⇔ \\(x^2+y^2\\le x^2+4x+4\\) ⇔ ' +
         '\\(y^2\\le 4(x+1)\\). És exactament \\(x\\ge \\frac{y^2}{4}-1\\): la part exterior ' +
         '(o dreta) d\'una paràbola de vèrtex \\((-1,0)\\). La frontera \\(A_4\\) sí que s\'inclou.',
  },
};

/* =====================================================================
   ELS 12 EXERCICIS
   ===================================================================== */
const EXERCISES = [

/* ---------------------------------------------------------------- 1 */
{
  star: true,
  title: 'Part real, imaginària, mòdul, conjugat i invers',
  st: 'Calculeu la part real, la part imaginària, el mòdul, el conjugat i l\'invers de cadascun dels nombres complexos següents:',
  items: [
    info5('(1+i)^3', [-2, 2], 'info',
      { mod: '2\\sqrt2', inv: '-\\tfrac14-\\tfrac14 i' }),
    info5('(1+i)^6', [0, -8], 'info',
      { mod: '8', inv: '\\tfrac18 i' }),
    info5('i^{17}', [0, 1], 'info'),
    info5('\\dfrac{i-1}{i+1}', [0, 1], 'info', { inv: '-i' }),
    info5('i^7+i+1', [1, 0], 'info'),
    info5('(3+3i)^4', [-324, 0], 'info',
      { inv: '-\\tfrac1{324}' }),
    info5('(-i)^{-1}', [0, 1], 'info', { inv: '-i' }),
    info5('\\dfrac{i-4}{2i-3}', [14 / 13, 5 / 13], 'info',
      { mod: '\\sqrt{\\tfrac{17}{13}}', inv: '\\tfrac{14-5i}{17}' }),
  ],
  hint: 'Normalitza primer el nombre a forma \\(a+bi\\), i després aplica ' +
        '\\(|z|=\\sqrt{a^2+b^2}\\), \\(\\bar z=a-bi\\) i \\(1/z=\\bar z/|z|^2\\).',
},

/* ---------------------------------------------------------------- 2 */
{
  star: true,
  title: 'Forma polar',
  st: 'Expresseu cadascun dels següents nombres complexos en forma polar, és a dir \\(r\\,\\mathrm{cis}\\,\\theta\\):',
  items: [
    { tex: '-5i', w: [W.pol('forma polar', 5, -Math.PI / 2, '5\\,\\mathrm{cis}\\,(-\\tfrac{\\pi}{2})')] },
    { tex: '1+\\sqrt3\\,i', w: [W.pol('forma polar', 2, Math.PI / 3, '2\\,\\mathrm{cis}\\,\\tfrac{\\pi}{3}')] },
    { tex: '3+3i', w: [W.pol('forma polar', 3 * Math.SQRT2, Math.PI / 4, '3\\sqrt2\\,\\mathrm{cis}\\,\\tfrac{\\pi}{4}')] },
    { tex: '5\\sqrt3+5i', w: [W.pol('forma polar', 10, Math.PI / 6, '10\\,\\mathrm{cis}\\,\\tfrac{\\pi}{6}')] },
    { tex: '-\\pi', w: [W.pol('forma polar', Math.PI, Math.PI, '\\pi\\,\\mathrm{cis}\\,\\pi')] },
    { tex: '-7+7i', w: [W.pol('forma polar', 7 * Math.SQRT2, 3 * Math.PI / 4, '7\\sqrt2\\,\\mathrm{cis}\\,\\tfrac{3\\pi}{4}')] },
    { tex: '\\dfrac{1-\\sqrt3\\,i}{2}', w: [W.pol('forma polar', 1, -Math.PI / 3, '\\mathrm{cis}\\,(-\\tfrac{\\pi}{3})')] },
    { tex: '\\cos\\tfrac{\\pi}{5}-i\\sin\\tfrac{\\pi}{5}', w: [W.pol('forma polar', 1, -Math.PI / 5, '\\mathrm{cis}\\,(-\\tfrac{\\pi}{5})')] },
  ],
  hint: '\\(r=|z|=\\sqrt{a^2+b^2}\\) i \\(\\theta=\\operatorname{arg}z\\), l\'angle que forma ' +
        'el vector \\(z\\) amb l\'eix real. Pots revisar l\'angle amb l\'arc tangent ' +
        '\\(\\tan\\theta=\\operatorname{Im}z/\\operatorname{Re}z\\).',
  sec2: {
    st: 'Calculeu, usant De Moivre:',
    items: [
      { tex: '(3+3i)^{829}', w: [W.pol('mòdul i argument', Infinity, 5 * Math.PI / 4,
        '(3\\sqrt2)^{829}\\,\\mathrm{cis}\\,\\tfrac{5\\pi}{4} = -(3\\sqrt2)^{829}\\,\\tfrac{\\sqrt2}{2}(1+i)', 829 * Math.log(3 * Math.SQRT2))],
        note: 'L\'argument \\(829\\pi/4\\) es redueix \\(\\bmod\\ 2\\pi\\) a \\(5\\pi/4\\).' },
      { tex: '(5\\sqrt3+5i)^{135}', w: [W.pol('mòdul i argument', Math.pow(10, 135), Math.PI / 2,
        '10^{135}\\,\\mathrm{cis}\\,\\tfrac{\\pi}{2} = 10^{135} i')],
        note: '\\(135\\pi/6 = 22{,}5\\pi \\equiv \\pi/2 \\pmod{2\\pi}\\).' },
      { tex: '(-7+7i)^{1017}', w: [W.pol('mòdul i argument', Infinity, 3 * Math.PI / 4,
        '(7\\sqrt2)^{1017}\\,\\mathrm{cis}\\,\\tfrac{3\\pi}{4} = (7\\sqrt2)^{1017}\\,\\tfrac{\\sqrt2}{2}(-1+i)', 1017 * Math.log(7 * Math.SQRT2))],
        note: '\\(1017\\cdot 3\\pi/4 = 762{,}75\\pi \\equiv 3\\pi/4\\pmod{2\\pi}\\).' },
      { tex: '\\left[\\dfrac{1-\\sqrt3\\,i}{2}\\right]^{4002}', w: [W.pol('mòdul i argument', 1, 0, '1')],
        note: 'El mòdul és \\(1\\) i \\(-4002\\pi/3\\) és multiple de \\(2\\pi\\), així que el resultat és \\(1\\).' },
    ],
    hint: 'De Moivre: \\(z^n = r^n\\,\\mathrm{cis}(n\\theta)\\). El truc és reduir ' +
          'l\'argument \\(n\\theta\\) módulo \\(2\\pi\\) i no calcular potències enormes.',
    spiral: '(1+i)',
  },
},

/* ---------------------------------------------------------------- 3 */
{
  star: true,
  title: 'Nombres en forma exponencial',
  st: 'Calculeu la part real, la part imaginària, el mòdul, el conjugat i l\'invers de cadascun dels nombres complexos següents:',
  items: [
    info5('e^{i\\pi}', [-1, 0], 'info', { inv: '-1' }),
    info5('2e^{-2\\pi i/3}', [-1, -Math.sqrt(3)], 'info',
      { mod: '2', inv: '\\tfrac{-1+\\sqrt3\\,i}{4}' }),
    info5('e^{\\cos(2)}', [Math.exp(Math.cos(2)), 0], 'info',
      { inv: 'e^{-\\cos 2}' }),
    info5('e^{\\cos(2)\\,i}', [Math.cos(Math.cos(2)), Math.sin(Math.cos(2))], 'info',
      { mod: '1', conj: '\\cos(\\cos 2)-i\\sin(\\cos 2)', inv: '\\cos(\\cos 2)-i\\sin(\\cos 2)' }),
    info5('12e^{\\pi i/6}', [6 * Math.sqrt(3), 6], 'info',
      { mod: '12', inv: '\\tfrac{\\sqrt3-i}{24}' }),
    info5('e^{2\\pi i/3}+e^{4\\pi i/3}', [-1, 0], 'info', { inv: '-1' }),
    info5('e^{-1+i\\pi/4}', [S2 / Math.E, S2 / Math.E], 'info',
      { mod: 'e^{-1}', inv: 'e\\,\\tfrac{\\sqrt2}{2}(1-i)' }),
    info5('e^{5+i\\pi/2}', [0, Math.exp(5)], 'info',
      { mod: 'e^5', conj: '-i e^5', inv: '-i e^{-5}' }),
  ],
  hint: 'Aplica \\(e^{\\alpha+i\\beta}=e^{\\alpha}\\,\\mathrm{cis}\\,\\beta\\). El ' +
        'mòdul és \\(e^{\\alpha}\\) i l\'argument és \\(\\beta\\). Fixa\'t especialment ' +
        'en \\(e^{2\\pi i/3}+e^{4\\pi i/3}\\): són dos punts de la circumferència unitària que es cancelen.',
},

/* ---------------------------------------------------------------- 4 */
{
  title: 'Subconjunts del pla complex',
  st: 'Dibuixeu en el pla complex els subconjunts següents:',
  items: [
    { set: 'A1', w: [W.choice('Quin és el subconjunt?', SETS.A1.options, SETS.A1.ans)] },
    { set: 'A2', w: [W.choice('Quin és el subconjunt?', SETS.A2.options, SETS.A2.ans)] },
    { set: 'A3', w: [W.choice('Quin és el subconjunt?', SETS.A3.options, SETS.A3.ans)] },
    { set: 'A4', w: [W.choice('Quin és el subconjunt?', SETS.A4.options, SETS.A4.ans)] },
  ],
  hint: 'Passa a coordenades reals: \\(|z|=\\sqrt{x^2+y^2}\\), \\(\\operatorname{Re}z=x\\), ' +
        '\\(\\operatorname{Im}z=y\\). Després escriu la inequació en \\(x,y\\) i identifica la figura.',
},

/* ---------------------------------------------------------------- 5 */
{
  title: 'Arrels quadrades',
  st: 'Calculeu les arrels quadrades, expressades en forma cartesiana, de tots els nombres complexos dels exercicis 2 i 3.',
  note: 'Per cada nombre escriu una arrel quadrada \\(w\\). L\'app verifica que \\(w^2=z\\), ' +
        'de manera que si escrius una de les dues arrels ja val. Si el resultat és irracional o ' +
        'no té forma radical simple, escriu el valor decimal (o la forma polar).',
  items: [
    /* de l'exercici 2 */
    { tex: '-5i', w: [W.root('arrel quadrada', [0, -5], '\\tfrac{\\sqrt{10}}{2}-\\tfrac{\\sqrt{10}}{2}i')] },
    { tex: '1+\\sqrt3 i', w: [W.root('arrel quadrada', [1, Math.sqrt(3)], '\\tfrac{\\sqrt6}{2}+\\tfrac{\\sqrt2}{2}i')] },
    { tex: '3+3i', w: [W.root('arrel quadrada', [3, 3], '\\sqrt{3\\sqrt2}\\,\\mathrm{cis}\\,\\tfrac{\\pi}{8}\\approx 1.9029767+0.7882388i')] },
    { tex: '5\\sqrt3+5i', w: [W.root('arrel quadrada', [5 * Math.sqrt(3), 5], '\\sqrt{10}\\,\\mathrm{cis}\\,\\tfrac{\\pi}{12}\\approx 3.0545257+0.8184577i')] },
    { tex: '-\\pi', w: [W.root('arrel quadrada', [-Math.PI, 0], 'i\\sqrt{\\pi}')] },
    { tex: '-7+7i', w: [W.root('arrel quadrada', [-7, 7], '\\sqrt{7\\sqrt2}\\,\\mathrm{cis}\\,\\tfrac{3\\pi}{8}\\approx 1.2040546+2.9068449i')] },
    { tex: '\\dfrac{1-\\sqrt3 i}{2}', w: [W.root('arrel quadrada', [0.5, -Math.sqrt(3) / 2], '\\tfrac{\\sqrt3}{2}-\\tfrac12 i')] },
    { tex: '\\cos\\tfrac{\\pi}{5}-i\\sin\\tfrac{\\pi}{5}', w: [W.root('arrel quadrada', [Math.cos(Math.PI / 5), -Math.sin(Math.PI / 5)], '\\mathrm{cis}\\,(-\\tfrac{\\pi}{10})\\approx 0.9510565-0.3090170i')] },
    /* de l'exercici 3 */
    { tex: 'e^{i\\pi}=-1', w: [W.root('arrel quadrada', [-1, 0], 'i')] },
    { tex: '-\\!1-\\sqrt3 i', w: [W.root('arrel quadrada', [-1, -Math.sqrt(3)], '\\tfrac{\\sqrt2}{2}-\\tfrac{\\sqrt6}{2}i')] },
    { tex: 'e^{\\cos 2}', w: [W.root('arrel quadrada', [Math.exp(Math.cos(2)), 0], 'e^{\\frac{\\cos 2}{2}}')] },
    { tex: 'e^{\\cos(2)\\,i}', w: [W.root('arrel quadrada', [Math.cos(Math.cos(2)), Math.sin(Math.cos(2))], '\\mathrm{cis}\\,\\tfrac{\\cos 2}{2}')] },
    { tex: '6\\sqrt3+6i', w: [W.root('arrel quadrada', [6 * Math.sqrt(3), 6], '2\\sqrt3\\,\\mathrm{cis}\\,\\tfrac{\\pi}{12}\\approx 3.3460652+0.8965755i')] },
    { tex: '-1', w: [W.root('arrel quadrada', [-1, 0], 'i')] },
    { tex: '\\tfrac{\\sqrt2}{2e}(1+i)', w: [W.root('arrel quadrada', [S2 / Math.E, S2 / Math.E], 'e^{-1/2}\\,\\mathrm{cis}\\,\\tfrac{\\pi}{8}')] },
    { tex: 'i e^5', w: [W.root('arrel quadrada', [0, Math.exp(5)], 'e^{5/2}\\,\\mathrm{cis}\\,\\tfrac{\\pi}{4}')] },
  ],
  hint: 'Si \\(z=r\\,\\mathrm{cis}\\,\\theta\\) aleshores \\(\\sqrt z=\\sqrt r\\,\\mathrm{cis}\\,\\theta/2\\). ' +
        'Alternativa senseArguments: si \\(z=a+bi\\), l\'arrel \\(w=p+qi\\) ha de satisfer ' +
        '\\(p^2-q^2=a\\) i \\(2pq=b\\).',
},

/* ---------------------------------------------------------------- 6 */
{
  title: 'Demostracions amb e^z',
  st: 'Proveu que per a tot nombre complex \\(z\\) es té \\(e^z\\neq 0\\). Proveu que per a tot parell \\(z,w\\) de nombres complexos, la igualtat \\(e^z=e^w\\) equival a \\(z-w\\in 2\\pi i\\mathbb{Z}\\).',
  note: 'Omple els espais amb les expressions que falten. L\'app compara el contingut amb formes equivalents.',
  items: [
    { tex: 'e^{x+iy}=e^{x}\\cdot \\_\\_\\_\\_\\ \\_\\_\\_\\_\ \\_\\_\\_\\_\\quad (z=x+iy)',
      w: [W.blank(null, ['e^iy', 'e^{iy}', 'e^(iy)', 'cis(y)', 'cos(y)+isin(y)', 'e^y'], 'e^{iy}=\\cos y+i\\sin y')],
      step: 'Parts: tots els nombres es descriuen amb \\(z=x+iy\\), i \\(e^{x+iy}=e^x e^{iy}\\).' },
    { tex: '|e^{z}|=e^{x}\\cdot\\sqrt{\\cos^2 y+\\sin^2 y}=\\_\\_\\_\\_\\ \\_\\_\\_\\_\\cdot e^{x}',
      w: [W.blank(null, ['1', 'sqrt(1)', '|cis(y)|'], '1')],
      step: 'La identitat trigonomètrica fonamental.' },
    { tex: 'e^{z}=0\\ \\Longrightarrow\\ \\_\\_\\_\\_\\cdot 1=0\\ \\Longrightarrow\\ \\_\\_\\_\\_=0',
      w: [W.blank(null, ['e^x', 'exp(x)', 'e^{x}'], 'e^{x}'),
          W.blank(null, ['e^x', 'exp(x)', 'e^{x}'], 'e^{x}')],
      step: 'Aïllant el factor \\(e^x\\).' },
    { tex: 'però \\_\\_\\_\\_ > 0\\ \\text{per a tot }x\\in\\mathbb{R}\\ \\Longrightarrow\\ e^{z}\\neq 0.',
      w: [W.blank(null, ['e^x', 'exp(x)', 'e^{x}'], 'e^{x}')],
      step: 'L\'exponencial real és sempre positiva (perquè \\(e^x=1/e^{-x}\\)).' },

    { tex: 'e^{z}=e^{w}\\ \\Longrightarrow\\ |e^{z}|=|e^{w}|\\ \\Longrightarrow\\ e^{\\operatorname{Re}z}=e^{\\operatorname{Re}w}\\ \\Longrightarrow\\ \\_\\_\\_\\_\\,\\operatorname{Re}z-\\_\\_\\_\\_\\,\\operatorname{Re}w=0',
      w: [W.blank(null, ['k', 'c', 't', 'const'], 'k'),
          W.blank(null, ['k', 'c', 't', 'const'], 'k')],
      step: 'L\'exponencial real és injectiva; igual mòdul implica igual part real.' },
    { tex: 'z-w=\\_\\_\\_\\_+i(\\operatorname{Im}z-\\operatorname{Im}w)=i\\cdot\\_\\_\\_\\_',
      w: [W.blank(null, ['0', 're(z)-re(w)'], '0'),
          W.blank(null, ['im(z)-im(w)', 'imz-imw', 'b'], '\\operatorname{Im}z-\\operatorname{Im}w')],
      step: 'Ara només queda la part imaginària.' },
    { tex: 'e^{z}=e^{w}\\ \\Longleftrightarrow\\ e^{i(\\operatorname{Im}z-\\operatorname{Im}w)}=1\\ \\Longleftrightarrow\\ \\operatorname{Im}z-\\operatorname{Im}w\\in\\_\\_\\_\\_\\cdot\\mathbb{Z}',
      w: [W.blank(null, ['2pi', '2π', '2*pi', '2pi ', '6.28'], '2\\pi')],
      step: 'Fet clau: \\(e^{it}=1\\) exactament quan \\(t\\) és multiple de \\(2\\pi\\).' },
    { tex: '\\Longleftrightarrow\\ z-w=2\\pi k\\,i\\ \\text{amb }k\\in\\mathbb{Z}\\ \\Longleftrightarrow\\ z-w\\in 2\\pi i\\mathbb{Z}',
      w: [], step: 'Combina les dues parts.' },
  ],
  hint: 'Tot es redueix a dues idees: \\(|e^z|=e^{\\operatorname{Re}z}\\) i \\(e^{it}=1\\iff t\\in2\\pi\\mathbb{Z}\\). ' +
        'La segona és perquè \\(e^{it}=\\cos t+i\\sin t\\) val \\(1\\) quan \\(\\cos t=1\\) i \\(\\sin t=0\\).',
},

/* ---------------------------------------------------------------- 7 */
{
  title: 'Fórmules trigonomètriques del triple angle',
  st: 'Trobeu \\(\\sin(3x)\\) i \\(\\cos(3x)\\) en funció de \\(\\sin x\\), \\(\\cos x\\), \\(\\sin 2x\\) i \\(\\cos 2x\\).',
  note: 'Escriu una expressió en funció de \\(x\\): l\'app la comprovarà amb 9 valors de \\(x\\) ' +
        'i la dibuixarà al costat de la funció real.',
  items: [
    { tex: '\\sin(3x) = \\_\\_\\_\\_\\_\\_\\_\\_', fn: 'sin(3*x)',
      w: [W.id('expressió', 'sin(3*x)', '\\sin(2x)\\cos x+\\cos(2x)\\sin x')] },
    { tex: '\\cos(3x) = \\_\\_\\_\\_\\_\\_\\_\\_', fn: 'cos(3*x)',
      w: [W.id('expressió', 'cos(3*x)', '\\cos(2x)\\cos x-\\sin(2x)\\sin x')] },
  ],
  hint: 'Aplica la fórmula d\'addició dos cops: \\(\\sin(2x+x)=\\sin2x\\cos x+\\cos2x\\sin x\\) i ' +
        '\\(\\cos(2x+x)=\\cos2x\\cos x-\\sin2x\\sin x\\).',
},

/* ---------------------------------------------------------------- 8 */
{
  star: true,
  title: 'Arrels cúbiques en forma polar',
  st: 'Calculeu les arrels cúbiques, en forma polar, dels nombres complexos següents:',
  items: [
    { tex: '-1', w: [W.pol('arrel 1', 1, Math.PI / 3), W.pol('arrel 2', 1, Math.PI), W.pol('arrel 3', 1, 5 * Math.PI / 3)] },
    { tex: 'i', w: [W.pol('arrel 1', 1, Math.PI / 6), W.pol('arrel 2', 1, 5 * Math.PI / 6), W.pol('arrel 3', 1, 3 * Math.PI / 2)] },
    { tex: 'e', w: [W.pol('arrel 1', Math.exp(1 / 3), 1 / 3), W.pol('arrel 2', Math.exp(1 / 3), 1 / 3 + 2 * Math.PI / 3), W.pol('arrel 3', Math.exp(1 / 3), 1 / 3 + 4 * Math.PI / 3)] },
    { tex: '8', w: [W.pol('arrel 1', 2, 0), W.pol('arrel 2', 2, 2 * Math.PI / 3), W.pol('arrel 3', 2, 4 * Math.PI / 3)] },
    { tex: '1+i', w: [W.pol('arrel 1', Math.pow(2, 1 / 6), Math.PI / 12), W.pol('arrel 2', Math.pow(2, 1 / 6), 3 * Math.PI / 4), W.pol('arrel 3', Math.pow(2, 1 / 6), 17 * Math.PI / 12)] },
  ],
  hint: 'Si \\(z=r\\,\\mathrm{cis}\\,\\theta\\), les tres arrels cúbiques són ' +
        '\\(\\sqrt[3]{r}\\,\\mathrm{cis}\\big(\\tfrac{\\theta+2\\pi k}{3}\\big)\\), \\(k=0,1,2\\). ' +
        'Fixeu-vos que els tres arguments queden separats \\(120^\\circ\\).',
},

/* ---------------------------------------------------------------- 9 */
{
  star: true,
  title: 'Arrels de polinomis',
  st: 'Trobeu les arrels dels polinomis quadràtics i biquadràtics següents. Escriu-les separades per comes, en forma \\(a+bi\\).',
  items: [
    { tex: 'x^2+3x+4', w: [W.roots('arrels', [4, 3, 1], 2, '\\tfrac{-3+i\\sqrt7}{2}\\ ;\\ \\tfrac{-3-i\\sqrt7}{2}')] },
    { tex: 'x^2+4i', w: [W.roots('arrels', [[0, 4], 0, 1], 2, '\\sqrt2(1-i)\\ ;\\ -\\sqrt2(1-i)')] },
    { tex: 'x^2+\\sqrt5', w: [W.roots('arrels', [Math.sqrt(5), 0, 1], 2, 'i\\sqrt[4]{5}\\ ;\\ -i\\sqrt[4]{5}')] },
    { tex: 'x^2+2ix+i-1', w: [W.roots('arrels', [[-1, 1], [0, 2], 1], 2, '\\tfrac{\\sqrt2}{2}-\\big(1+\\tfrac{\\sqrt2}{2}\\big)i\\ ;\\ -\\tfrac{\\sqrt2}{2}+\\big(\\tfrac{\\sqrt2}{2}-1\\big)i')] },
    { tex: 'x^2+2ix+\\sqrt3 i', w: [W.roots('arrels', [[0, Math.sqrt(3)], [0, 2], 1], 2, '\\tfrac{\\sqrt2}{2}-\\big(1+\\tfrac{\\sqrt6}{2}\\big)i\\ ;\\ -\\tfrac{\\sqrt2}{2}+\\big(\\tfrac{\\sqrt6}{2}-1\\big)i')] },
    { tex: 'x^2+2ix-\\sqrt3 i', w: [W.roots('arrels', [[0, -Math.sqrt(3)], [0, 2], 1], 2, '\\tfrac{\\sqrt2}{2}+\\big(\\tfrac{\\sqrt6}{2}-1\\big)i\\ ;\\ -\\tfrac{\\sqrt2}{2}-\\big(1+\\tfrac{\\sqrt6}{2}\\big)i')] },
    { tex: 'x^4+4x^2+3', w: [W.roots('arrels', [3, 0, 4, 0, 1], 4, 'i\\ ;\\ -i\\ ;\\ i\\sqrt3\\ ;\\ -i\\sqrt3')],
      note: 'Posant \\(t=x^2\\): \\(t^2+4t+3=0\\)' },
    { tex: 'x^4+x^2+1', w: [W.roots('arrels', [1, 0, 1, 0, 1], 4, '\\tfrac{1+\\sqrt3 i}{2}\\ ;\\ -\\tfrac{1+\\sqrt3 i}{2}\\ ;\\ \\tfrac{1-\\sqrt3 i}{2}\\ ;\\ -\\tfrac{1-\\sqrt3 i}{2}')],
      note: 'Posant \\(t=x^2\\): \\(t^2+t+1=0\\)' },
    { tex: 'x^4-(1-i)x^2-i', w: [W.roots('arrels', [[0, -1], 0, [-1, 1], 0, 1], 4, '1\\ ;\\ -1\\ ;\\ \\tfrac{\\sqrt2}{2}-\\tfrac{\\sqrt2}{2}i\\ ;\\ -\\tfrac{\\sqrt2}{2}+\\tfrac{\\sqrt2}{2}i')],
      note: 'Posant \\(t=x^2\\): \\(t^2-(1-i)t-i=0\\)' },
  ],
  hint: 'Als quadràtics aplica la fórmula de les arrels. Als biquadràtics, ' +
        'fes la substitució \\(t=x^2\\), resol el quadràtic en \\(t\\) i després pren ' +
        'les arrels quadrades de cada valor de \\(t\\).',
},

/* ---------------------------------------------------------------- 10 */
{
  star: true,
  title: 'Factorització a ℂ[x] i a ℝ[x]',
  st: 'Factoritzeu, a \\(\\mathbb{C}[x]\\) i a \\(\\mathbb{R}[x]\\), els polinomis següents. Escriu cada factor separat per comes.',
  note: 'A \\(\\mathbb{C}[x]\\) els factors són lineals. A \\(\\mathbb{R}[x]\\) no hi ha ' +
        'arrels reals, així que els factors són quadràtics <b>amb coeficients reals</b>: agrupa ' +
        'les arrels conjugades \\(\\alpha\\) i \\(\\bar\\alpha\\) en \\((x-\\alpha)(x-\\bar\\alpha)=x^2-2\\operatorname{Re}\\alpha\\,x+|\\alpha|^2\\).',
  items: [
    { tex: 'x^4+16', w: [
        W.fac('a ℂ[x]', [16, 0, 0, 0, 1], '(x-\\sqrt2-\\sqrt2 i)(x-\\sqrt2+\\sqrt2 i)(x+\\sqrt2-\\sqrt2 i)(x+\\sqrt2+\\sqrt2 i)', false, 2),
        W.fac('a ℝ[x]', [16, 0, 0, 0, 1], '(x^2-2\\sqrt2 x+4)(x^2+2\\sqrt2 x+4)', true, 2)],
      roots: [[Math.SQRT2, Math.SQRT2], [-Math.SQRT2, -Math.SQRT2], [Math.SQRT2, -Math.SQRT2], [-Math.SQRT2, Math.SQRT2]] },
    { tex: 'x^3+27', w: [
        W.fac('a ℂ[x]', [27, 0, 0, 1], '(x+3)(x-\\tfrac32-\\tfrac{3\\sqrt3}{2}i)(x-\\tfrac32+\\tfrac{3\\sqrt3}{2}i)', false, 2),
        W.fac('a ℝ[x]', [27, 0, 0, 1], '(x+3)(x^2-3x+9)', true, 2)],
      roots: [[-3, 0], [1.5, 3 * Math.sqrt(3) / 2], [1.5, -3 * Math.sqrt(3) / 2]] },
    { tex: 'x^4-1', w: [
        W.fac('a ℂ[x]', [-1, 0, 0, 0, 1], '(x-1)(x+1)(x-i)(x+i)', false, 2),
        W.fac('a ℝ[x]', [-1, 0, 0, 0, 1], '(x-1)(x+1)(x^2+1)', true, 2)],
      roots: [[1, 0], [-1, 0], [0, 1], [0, -1]] },
    { tex: 'x^6+3x^3-4', w: [
        W.fac('a ℂ[x]', [-4, 0, 0, 3, 0, 0, 1], '(x-1)(x-\\tfrac{-1+\\sqrt3 i}{2})(x-\\tfrac{-1-\\sqrt3 i}{2})(x+\\sqrt[3]{4})(x-\\tfrac{\\sqrt[3]{4}}{2}-\\tfrac{\\sqrt[3]{4}\\sqrt3}{2}i)(x-\\tfrac{\\sqrt[3]{4}}{2}+\\tfrac{\\sqrt[3]{4}\\sqrt3}{2}i)', false, 2),
        W.fac('a ℝ[x]', [-4, 0, 0, 3, 0, 0, 1], '(x-1)(x^2+x+1)(x+\\sqrt[3]{4})(x^2-\\sqrt[3]{4}\\,x+\\sqrt[3]{16})', true, 2)],
      roots: [[1, 0], [-0.5, Math.sqrt(3) / 2], [-0.5, -Math.sqrt(3) / 2],
              [-Math.cbrt(4), 0], [Math.cbrt(4) / 2, Math.cbrt(4) * Math.sqrt(3) / 2], [Math.cbrt(4) / 2, -Math.cbrt(4) * Math.sqrt(3) / 2]] },
  ],
  hint: 'Comença per trobar les arrels i després agrupa-les. Recorda que ' +
        '\\((x-\\alpha)(x-\\bar\\alpha)=x^2-2\\operatorname{Re}(\\alpha)x+|\\alpha|^2\\).',
},

/* ---------------------------------------------------------------- 11 */
{
  title: 'Factorització de x⁴+x³+x²+x+1',
  st: 'Factoritzeu a \\(\\mathbb{C}[x]\\) i a \\(\\mathbb{R}[x]\\) el polinomi \\(x^4+x^3+x^2+x+1\\).',
  note: '<b>Indicació:</b> Calculeu el producte \\((x^4+x^3+x^2+x+1)(x-1)\\).',
  items: [
    { tex: 'x^4+x^3+x^2+x+1', w: [
        W.fac('a ℂ[x]', [1, 1, 1, 1, 1], '(x-\\mathrm{cis}\\,\\tfrac{2\\pi}{5})(x-\\mathrm{cis}\\,\\tfrac{4\\pi}{5})(x-\\mathrm{cis}\\,\\tfrac{6\\pi}{5})(x-\\mathrm{cis}\\,\\tfrac{8\\pi}{5})', false, 2),
        W.fac('a ℝ[x]', [1, 1, 1, 1, 1], '(x^2-\\tfrac{\\sqrt5-1}{2}x+1)(x^2+\\tfrac{\\sqrt5+1}{2}x+1)', true, 2)],
      roots: [[Math.cos(2 * Math.PI / 5), Math.sin(2 * Math.PI / 5)],
              [Math.cos(4 * Math.PI / 5), Math.sin(4 * Math.PI / 5)],
              [Math.cos(6 * Math.PI / 5), Math.sin(6 * Math.PI / 5)],
              [Math.cos(8 * Math.PI / 5), Math.sin(8 * Math.PI / 5)]] },
  ],
  hint: 'El producte amb \\(x-1\\) dona \\(x^5-1\\). Per tant el polinomi és ' +
        '\\(\\frac{x^5-1}{x-1}\\): les seves arrels són les-raons de cinquena de la unitat ' +
        'diferents de \\(1\\). A ℝ[x] agrupa \\(\\mathrm{cis}(\\pm 2\\pi/5)\\) amb ' +
        '\\(\\mathrm{cis}(\\pm 4\\pi/5)\\).',
},

/* ---------------------------------------------------------------- 12 */
{
  title: 'Factorització a ℂ[x]',
  st: 'Factoritzeu a \\(\\mathbb{C}[x]\\) els polinomis següents. Escriu cada factor separat per comes.',
  items: [
    { tex: 'x^3+(i-1)x^2+(1-i)x-1', w: [
        W.fac('a ℂ[x]', [[-1, 0], [1, -1], [-1, 1], 1], '(x-1)(x-\\tfrac{-1+\\sqrt5}{2}i)(x+\\tfrac{1+\\sqrt5}{2}i)', false, 1)],
      note: 'Prova \\(x=1\\): \\(1+(i-1)+(1-i)-1=0\\), i després divideix per \\(x-1\\).',
      roots: [[1, 0], [(Math.sqrt(5) - 1) / 2 * 0 + 0, (Math.sqrt(5) - 1) / 2], [0, -(Math.sqrt(5) + 1) / 2]] },
    { tex: 'x^3+i', w: [
        W.fac('a ℂ[x]', [[0, 1], 0, 0, 1], '(x-i)(x-\\tfrac{\\sqrt3-i}{2})(x+\\tfrac{\\sqrt3}{2}+\\tfrac12 i)', false, 1)],
      note: 'Ara \\(x^3=-i\\): arrels cúbiques de \\(\\mathrm{cis}(-\\pi/2)\\).',
      roots: [[0, 1], [Math.sqrt(3) / 2, -0.5], [-Math.sqrt(3) / 2, -0.5]] },
    { tex: 'x^3-(\\sqrt3+i)', w: [
        W.fac('a ℂ[x]', [[-Math.sqrt(3), -1], 0, 0, 1], '(x-2^{1/3}\\mathrm{cis}\\,\\tfrac{\\pi}{18})(x-2^{1/3}\\mathrm{cis}\\,(\\tfrac{\\pi}{18}+\\tfrac{2\\pi}{3}))(x-2^{1/3}\\mathrm{cis}\\,(\\tfrac{\\pi}{18}+\\tfrac{4\\pi}{3}))', false, 1)],
      note: '\\(\\sqrt3+i=2\\,\\mathrm{cis}(\\pi/6)\\), així que les arrels són ' +
            '\\(2^{1/3}\\,\\mathrm{cis}(\\pi/18+2\\pi k/3)\\), \\(k=0,1,2\\). Els angles ' +
            '\\(10^\\circ,130^\\circ,250^\\circ\\) no tenen forma radical simple: escriu-les en forma polar.',
      polarRoots: { r: Math.pow(2, 1 / 3), th: [Math.PI / 18, Math.PI / 18 + 2 * Math.PI / 3, Math.PI / 18 + 4 * Math.PI / 3] } },
  ],
  hint: 'Busca arrels òbvies (nombres reals, \\(\\pm i\\), ...) i divideix successivament. ' +
        'Si el polinomi té coeficients en \\(\\mathbb{C}\\), aplica la fórmula de Cardano o ' +
        'passa a forma polar.',
},
];