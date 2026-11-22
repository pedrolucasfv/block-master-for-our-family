'use strict';
/* chefões dos mundos (SVGs, falas, animações, vida) */
/* ===================== chefões dos mundos: Ursão, Rainha Jujuba, Lagartão Guloso, Robozão, Pandão e Gatão da Sorte =====================
   Desenho próprio em SVG, com animações de entrada, ataque, raiva e derrota. */
const BEAR_SVG=`<svg viewBox="0 0 200 236" class="bearsvg" aria-hidden="true">
<defs><radialGradient id="bFur" cx="42%" cy="32%" r="75%"><stop offset="0" stop-color="#c99060"/><stop offset=".65" stop-color="#94602f"/><stop offset="1" stop-color="#5d3a1b"/></radialGradient>
<radialGradient id="bLight" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#f1d8b4"/><stop offset="1" stop-color="#cf a273"/></radialGradient></defs>
<g class="b-legs"><ellipse cx="68" cy="214" rx="30" ry="19" fill="url(#bFur)"/><ellipse cx="132" cy="214" rx="30" ry="19" fill="url(#bFur)"/><ellipse cx="68" cy="219" rx="16" ry="10" fill="#e9cba2"/><ellipse cx="132" cy="219" rx="16" ry="10" fill="#e9cba2"/></g>
<g class="b-arm b-arm-l"><ellipse cx="40" cy="146" rx="20" ry="38" fill="url(#bFur)"/><ellipse cx="40" cy="176" rx="13" ry="10" fill="#e9cba2"/></g>
<g class="b-arm b-arm-r"><ellipse cx="160" cy="146" rx="20" ry="38" fill="url(#bFur)"/><ellipse cx="160" cy="176" rx="13" ry="10" fill="#e9cba2"/></g>
<ellipse cx="100" cy="152" rx="63" ry="64" fill="url(#bFur)"/>
<ellipse cx="100" cy="163" rx="39" ry="41" fill="#e9cba2"/>
<g transform="rotate(14 120 160)"><rect x="108" y="150" width="25" height="20" rx="3" fill="#6fa8cf"/><rect x="110.5" y="152.5" width="20" height="15" rx="2" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="3 2.4"/></g>
<g class="b-head">
<circle cx="50" cy="38" r="23" fill="url(#bFur)"/><circle cx="150" cy="38" r="23" fill="url(#bFur)"/><circle cx="50" cy="38" r="11" fill="#e9cba2"/><circle cx="150" cy="38" r="11" fill="#e9cba2"/>
<circle cx="100" cy="78" r="59" fill="url(#bFur)"/>
<path d="M138 32 l10 10 M148 32 l-10 10" stroke="#3b2413" stroke-width="3" stroke-linecap="round"/>
<ellipse cx="100" cy="100" rx="27" ry="21" fill="#e9cba2"/>
<ellipse cx="100" cy="89" rx="11" ry="7.5" fill="#2e1b0e"/><ellipse cx="97" cy="87" rx="3" ry="1.8" fill="#fff" opacity=".6"/>
<g class="b-eyes"><circle class="b-eye" cx="77" cy="70" r="7.5"/><circle class="b-eye" cx="123" cy="70" r="7.5"/><circle cx="79" cy="68" r="2.2" fill="#fff"/><circle cx="125" cy="68" r="2.2" fill="#fff"/></g>
<g class="b-x" stroke="#2e1b0e" stroke-width="4" stroke-linecap="round"><path d="M70 63 l14 14 M84 63 l-14 14"/><path d="M116 63 l14 14 M130 63 l-14 14"/></g>
<path class="b-brow" d="M62 52 L90 61 M138 52 L110 61" stroke="#2e1b0e" stroke-width="6.5" stroke-linecap="round"/>
<path class="b-mouth" d="M87 113 Q100 104 113 113" stroke="#2e1b0e" stroke-width="4" fill="none" stroke-linecap="round"/>
<g class="b-roar"><ellipse cx="100" cy="114" rx="15" ry="11" fill="#5b1414"/><path d="M89 107 l3 6 l3 -6 M105 107 l3 6 l3 -6" fill="#fff"/><ellipse cx="100" cy="119" rx="8" ry="4" fill="#d9534f"/></g>
</g>
<g class="b-steam"><circle cx="38" cy="16" r="9"/><circle cx="162" cy="16" r="9"/><circle cx="30" cy="2" r="6"/><circle cx="170" cy="2" r="6"/></g>
<g class="b-stars" fill="#f3c22f"><path d="M60 12 l4 9 10 1 -8 6 3 10 -9-6 -9 6 3-10 -8-6 10-1z"/><path d="M140 6 l3 7 8 1 -6 5 2 8 -7-5 -7 5 2-8 -6-5 8-1z"/></g>
</svg>`.replace('#cf a273','#cfa273');
/* Rainha Jujuba (chefona do Mundo 2): mesma estrutura de peças do Ursão, então as mesmas animações servem */
const QUEEN_SVG=`<svg viewBox="0 0 200 236" class="bearsvg" aria-hidden="true">
<defs><radialGradient id="qJel" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#ffc2e1"/><stop offset=".55" stop-color="#e8459a"/><stop offset="1" stop-color="#8e1052"/></radialGradient>
<linearGradient id="qGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset=".5" stop-color="#f3c22f"/><stop offset="1" stop-color="#b9820f"/></linearGradient></defs>
<g class="b-legs"><ellipse cx="72" cy="223" rx="20" ry="11" fill="#c42a78"/><ellipse cx="128" cy="223" rx="20" ry="11" fill="#c42a78"/><ellipse cx="66" cy="219" rx="7" ry="3" fill="#fff" opacity=".4"/><ellipse cx="122" cy="219" rx="7" ry="3" fill="#fff" opacity=".4"/></g>
<g class="b-arm b-arm-l"><rect x="10" y="78" width="7" height="104" rx="3.5" fill="url(#qGold)"/><circle cx="13.5" cy="70" r="17" fill="#7fd8c4" stroke="#fff" stroke-width="2"/><path d="M13.5 70 m-11 0 a11 11 0 1 1 22 0 a7.5 7.5 0 1 1 -15 0 a3.8 3.8 0 1 1 7.6 0" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round"/><ellipse cx="32" cy="148" rx="13" ry="30" fill="url(#qJel)"/><circle cx="22" cy="174" r="10" fill="#ff8cc4"/></g>
<g class="b-arm b-arm-r"><ellipse cx="168" cy="148" rx="13" ry="30" fill="url(#qJel)"/><circle cx="174" cy="174" r="10" fill="#ff8cc4"/></g>
<path d="M26 204 C24 146 44 76 100 50 C156 76 176 146 174 204 C174 222 150 228 100 228 C50 228 26 222 26 204 Z" fill="url(#qJel)"/>
<path d="M30 200 C30 214 56 220 100 220 C144 220 170 214 170 200" stroke="#8e1052" stroke-width="3" fill="none" opacity=".35"/>
<path d="M52 150 C50 110 66 82 92 64" stroke="#fff" stroke-width="11" fill="none" stroke-linecap="round" opacity=".38"/><circle cx="62" cy="176" r="5" fill="#fff" opacity=".35"/>
<g fill="#fff" opacity=".85"><rect x="70" y="80" width="3.5" height="3.5" rx="1" transform="rotate(20 70 80)"/><rect x="128" y="86" width="3.5" height="3.5" rx="1" transform="rotate(40 128 86)"/><rect x="146" y="120" width="3.5" height="3.5" rx="1"/><rect x="48" y="186" width="3.5" height="3.5" rx="1" transform="rotate(30 48 186)"/><rect x="150" y="186" width="3.5" height="3.5" rx="1"/><rect x="96" y="196" width="3.5" height="3.5" rx="1" transform="rotate(15 96 196)"/><rect x="118" y="168" width="3.5" height="3.5" rx="1" transform="rotate(50 118 168)"/><rect x="74" y="164" width="3" height="3" rx="1"/><rect x="138" y="150" width="3" height="3" rx="1" transform="rotate(25 138 150)"/><rect x="108" y="70" width="3" height="3" rx="1"/><rect x="40" y="130" width="3" height="3" rx="1"/><rect x="160" y="160" width="3" height="3" rx="1"/></g>
<g class="b-head">
<path d="M64 56 L67 24 L84 42 L100 18 L116 42 L133 24 L136 56 Q100 46 64 56Z" fill="url(#qGold)" stroke="#b9820f" stroke-width="3" stroke-linejoin="round"/>
<circle cx="67" cy="23" r="4.5" fill="#fff2a8" stroke="#b9820f" stroke-width="2"/><circle cx="100" cy="17" r="4.5" fill="#fff2a8" stroke="#b9820f" stroke-width="2"/><circle cx="133" cy="23" r="4.5" fill="#fff2a8" stroke="#b9820f" stroke-width="2"/>
<circle cx="100" cy="42" r="5.5" fill="#e5483f"/><circle cx="82" cy="49" r="3.6" fill="#2cb4d6"/><circle cx="118" cy="49" r="3.6" fill="#4cbb47"/>
<ellipse cx="62" cy="140" rx="11" ry="7" fill="#ff7ab8" opacity=".9"/><ellipse cx="138" cy="140" rx="11" ry="7" fill="#ff7ab8" opacity=".9"/>
<g class="b-eyes"><circle class="b-eye" cx="78" cy="116" r="8.5"/><circle class="b-eye" cx="122" cy="116" r="8.5"/><circle cx="80.5" cy="113.5" r="2.8" fill="#fff"/><circle cx="124.5" cy="113.5" r="2.8" fill="#fff"/><path d="M68 110 l-6 -4 M71 106 l-3 -6 M132 110 l6 -4 M129 106 l3 -6" stroke="#4a0c2c" stroke-width="2.4" stroke-linecap="round"/></g>
<g class="b-x" stroke="#4a0c2c" stroke-width="4" stroke-linecap="round"><path d="M71 109 l14 14 M85 109 l-14 14"/><path d="M115 109 l14 14 M129 109 l-14 14"/></g>
<path class="b-brow" d="M63 99 Q77 92 91 103 M137 99 Q123 92 109 103" stroke="#4a0c2c" stroke-width="5" stroke-linecap="round" fill="none"/>
<path class="b-mouth" d="M86 150 Q100 160 114 150" stroke="#4a0c2c" stroke-width="4" fill="none" stroke-linecap="round"/>
<g class="b-roar"><ellipse cx="100" cy="154" rx="14" ry="11" fill="#5b0f33"/><ellipse cx="100" cy="159" rx="8" ry="4" fill="#ff7ab8"/><path d="M88 148 Q100 142 112 148" stroke="#c2185b" stroke-width="3" fill="none"/></g>
</g>
<g class="b-steam"><circle cx="40" cy="30" r="9"/><circle cx="160" cy="30" r="9"/><circle cx="32" cy="16" r="6"/><circle cx="168" cy="16" r="6"/></g>
<g class="b-stars" fill="#f3c22f"><path d="M44 20 l4 9 10 1 -8 6 3 10 -9-6 -9 6 3-10 -8-6 10-1z"/><path d="M156 14 l3 7 8 1 -6 5 2 8 -7-5 -7 5 2-8 -6-5 8-1z"/></g>
</svg>`;
/* Lagartão Guloso (chefão do Mundo 3): um lagarto de cabeça larga, olhos saltados e rabo enrolado */
const CAT_SVG=`<svg viewBox="0 0 200 236" class="bearsvg" aria-hidden="true">
<defs><radialGradient id="lGrn" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#b9e86a"/><stop offset=".6" stop-color="#5fae3a"/><stop offset="1" stop-color="#2f6a1a"/></radialGradient>
<linearGradient id="lBel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6b8"/><stop offset="1" stop-color="#e8cf6a"/></linearGradient></defs>
<path d="M132 206 C170 214 196 196 190 166 C186 146 168 140 158 150 C150 158 158 170 168 166" stroke="#3f8a24" stroke-width="20" fill="none" stroke-linecap="round"/>
<path d="M132 206 C170 214 196 196 190 166 C186 146 168 140 158 150" stroke="#7cc84a" stroke-width="7" fill="none" stroke-linecap="round" opacity=".6"/>
<path d="M150 218 l4 -12 l6 10 M170 216 l6 -12 l4 12 M186 204 l10 -6 l-2 12 M196 182 l8 -2 l-6 10" fill="#ff8a3d" stroke="#c4561a" stroke-width="1.5" stroke-linejoin="round"/>
<g class="b-legs"><ellipse cx="64" cy="214" rx="24" ry="13" fill="url(#lGrn)" transform="rotate(-12 64 214)"/><ellipse cx="136" cy="214" rx="24" ry="13" fill="url(#lGrn)" transform="rotate(12 136 214)"/>
<circle cx="42" cy="222" r="6" fill="#4f9a2e"/><circle cx="54" cy="227" r="6" fill="#4f9a2e"/><circle cx="68" cy="228" r="6" fill="#4f9a2e"/><circle cx="132" cy="228" r="6" fill="#4f9a2e"/><circle cx="146" cy="227" r="6" fill="#4f9a2e"/><circle cx="158" cy="222" r="6" fill="#4f9a2e"/></g>
<g class="b-arm b-arm-l"><ellipse cx="40" cy="146" rx="11" ry="30" fill="url(#lGrn)"/><circle cx="32" cy="176" r="5.5" fill="#4f9a2e"/><circle cx="40" cy="179" r="5.5" fill="#4f9a2e"/><circle cx="48" cy="176" r="5.5" fill="#4f9a2e"/></g>
<g class="b-arm b-arm-r"><ellipse cx="160" cy="146" rx="11" ry="30" fill="url(#lGrn)"/>
<path d="M166 168 c10 -10 30 -4 28 14 c-2 16 -16 22 -26 16 c-12 4 -24 -6 -22 -18 c1 -8 8 -14 20 -12z" fill="#e5483f"/><circle cx="188" cy="176" r="8" fill="#fff3d6"/><path d="M170 167 q2 -8 6 -12" stroke="#5a3a1a" stroke-width="3" stroke-linecap="round"/><ellipse cx="164" cy="174" rx="4" ry="7" fill="#fff" opacity=".45"/>
<circle cx="152" cy="176" r="5.5" fill="#4f9a2e"/><circle cx="160" cy="179" r="5.5" fill="#4f9a2e"/><circle cx="168" cy="176" r="5.5" fill="#4f9a2e"/></g>
<ellipse cx="100" cy="162" rx="50" ry="56" fill="url(#lGrn)"/>
<ellipse cx="100" cy="170" rx="31" ry="42" fill="url(#lBel)"/>
<path d="M76 146 Q100 154 124 146 M72 164 Q100 172 128 164 M74 182 Q100 190 126 182 M80 199 Q100 205 120 199" stroke="#c9a94a" stroke-width="2.5" fill="none" opacity=".7"/>
<circle cx="60" cy="140" r="6" fill="#2f6a1a" opacity=".55"/><circle cx="140" cy="140" r="6" fill="#2f6a1a" opacity=".55"/><circle cx="56" cy="168" r="5" fill="#2f6a1a" opacity=".55"/><circle cx="144" cy="168" r="5" fill="#2f6a1a" opacity=".55"/><circle cx="62" cy="194" r="4" fill="#2f6a1a" opacity=".55"/><circle cx="138" cy="194" r="4" fill="#2f6a1a" opacity=".55"/>
<g class="b-head">
<path d="M70 34 l6 -22 l8 18 l8 -24 l8 22 l8 -22 l8 24 l8 -18 l6 22z" fill="#ff8a3d" stroke="#c4561a" stroke-width="2" stroke-linejoin="round"/>
<path d="M34 70 Q38 28 100 26 Q162 28 166 70 Q166 104 132 120 Q112 132 100 132 Q88 132 68 120 Q34 104 34 70Z" fill="url(#lGrn)"/>
<path d="M48 56 Q60 40 84 42" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".22"/>
<g fill="#2f6a1a" opacity=".35"><circle cx="100" cy="44" r="4"/><circle cx="88" cy="56" r="3"/><circle cx="112" cy="56" r="3"/><circle cx="100" cy="66" r="3"/><circle cx="46" cy="88" r="3"/><circle cx="154" cy="88" r="3"/><circle cx="52" cy="100" r="2.5"/><circle cx="148" cy="100" r="2.5"/></g>
<ellipse cx="64" cy="70" rx="17" ry="15" fill="#4f9a2e"/><ellipse cx="136" cy="70" rx="17" ry="15" fill="#4f9a2e"/>
<circle cx="64" cy="71" r="12.5" fill="#f6c445"/><circle cx="136" cy="71" r="12.5" fill="#f6c445"/>
<ellipse cx="92" cy="106" rx="2.6" ry="3.4" fill="#1f3a0e"/><ellipse cx="108" cy="106" rx="2.6" ry="3.4" fill="#1f3a0e"/>
<g class="b-eyes"><ellipse class="b-eye" cx="64" cy="71" rx="3.6" ry="10"/><ellipse class="b-eye" cx="136" cy="71" rx="3.6" ry="10"/><circle cx="68" cy="66" r="2.4" fill="#fff"/><circle cx="140" cy="66" r="2.4" fill="#fff"/></g>
<g class="b-x" stroke="#1f3a0e" stroke-width="4" stroke-linecap="round"><path d="M57 64 l14 14 M71 64 l-14 14"/><path d="M129 64 l14 14 M143 64 l-14 14"/></g>
<path class="b-brow" d="M44 52 Q62 46 82 58 M156 52 Q138 46 118 58" stroke="#2f6a1a" stroke-width="7" stroke-linecap="round" fill="none"/>
<path class="b-mouth" d="M62 112 Q100 128 138 112" stroke="#1f3a0e" stroke-width="4.5" fill="none" stroke-linecap="round"/>
<g class="b-roar"><path d="M60 110 Q100 150 140 110 Q100 120 60 110Z" fill="#3a1010"/><path d="M72 113 l4 7 l4 -6 M120 113 l4 7 l4 -6" fill="#fff"/><path d="M100 124 C100 142 94 150 86 154 M100 124 C100 142 106 150 114 154" stroke="#e5483f" stroke-width="5.5" fill="none" stroke-linecap="round"/></g>
</g>
<g class="b-steam"><circle cx="36" cy="22" r="9"/><circle cx="164" cy="22" r="9"/><circle cx="28" cy="8" r="6"/><circle cx="172" cy="8" r="6"/></g>
<g class="b-stars" fill="#f3c22f"><path d="M40 14 l4 9 10 1 -8 6 3 10 -9-6 -9 6 3-10 -8-6 10-1z"/><path d="M160 8 l3 7 8 1 -6 5 2 8 -7-5 -7 5 2-8 -6-5 8-1z"/></g>
</svg>`;
/* Robozão (chefão do Mundo 4): caixa de metal com esteiras, visor e garras */
const ROBOT_SVG=`<svg viewBox="0 0 200 236" class="bearsvg glow-eyes" aria-hidden="true">
<defs><linearGradient id="rMet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6edf7"/><stop offset=".5" stop-color="#9fb0c8"/><stop offset="1" stop-color="#5a6a84"/></linearGradient>
<linearGradient id="rDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a5568"/><stop offset="1" stop-color="#232a36"/></linearGradient></defs>
<g class="b-legs"><rect x="38" y="200" width="56" height="30" rx="14" fill="url(#rDark)"/><rect x="106" y="200" width="56" height="30" rx="14" fill="url(#rDark)"/>
<g fill="#9fb0c8"><circle cx="52" cy="215" r="6"/><circle cx="66" cy="215" r="6"/><circle cx="80" cy="215" r="6"/><circle cx="120" cy="215" r="6"/><circle cx="134" cy="215" r="6"/><circle cx="148" cy="215" r="6"/></g></g>
<g class="b-arm b-arm-l"><circle cx="40" cy="120" r="12" fill="url(#rDark)"/><rect x="31" y="122" width="18" height="52" rx="8" fill="url(#rMet)"/><circle cx="40" cy="150" r="5" fill="#5a6a84"/>
<path d="M30 174 l-8 18 l8 6 M50 174 l8 18 l-8 6" stroke="#4a5568" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
<g class="b-arm b-arm-r"><circle cx="160" cy="120" r="12" fill="url(#rDark)"/><rect x="151" y="122" width="18" height="52" rx="8" fill="url(#rMet)"/><circle cx="160" cy="150" r="5" fill="#5a6a84"/>
<path d="M150 174 l-8 18 l8 6 M170 174 l8 18 l-8 6" stroke="#4a5568" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
<rect x="50" y="108" width="100" height="98" rx="16" fill="url(#rMet)" stroke="#4a5568" stroke-width="3"/>
<rect x="66" y="124" width="68" height="44" rx="8" fill="#232a36"/>
<circle cx="80" cy="138" r="6" fill="#e5483f"/><circle cx="100" cy="138" r="6" fill="#f3c22f"/><circle cx="120" cy="138" r="6" fill="#4cbb47"/>
<rect x="74" y="152" width="52" height="8" rx="4" fill="#2cb4d6"/><rect x="74" y="152" width="30" height="8" rx="4" fill="#8ff4ff"/>
<g fill="#5a6a84"><circle cx="60" cy="118" r="3.5"/><circle cx="140" cy="118" r="3.5"/><circle cx="60" cy="196" r="3.5"/><circle cx="140" cy="196" r="3.5"/></g>
<path d="M66 182 h68 M66 190 h68" stroke="#5a6a84" stroke-width="3" stroke-linecap="round"/>
<g class="b-head">
<rect x="88" y="98" width="24" height="14" fill="#4a5568"/>
<path d="M100 28 V10" stroke="#4a5568" stroke-width="4"/><circle cx="100" cy="8" r="7" fill="#e5483f"/><circle cx="98" cy="6" r="2.2" fill="#fff" opacity=".8"/>
<rect x="42" y="26" width="116" height="78" rx="18" fill="url(#rMet)" stroke="#4a5568" stroke-width="3"/>
<circle cx="40" cy="64" r="9" fill="url(#rDark)"/><circle cx="160" cy="64" r="9" fill="url(#rDark)"/>
<rect x="54" y="46" width="92" height="38" rx="14" fill="#1d2430"/>
<rect x="58" y="34" width="40" height="5" rx="2.5" fill="#fff" opacity=".5"/>
<g class="b-eyes"><circle class="b-eye" cx="78" cy="65" r="9"/><circle class="b-eye" cx="122" cy="65" r="9"/><circle cx="75" cy="62" r="2.6" fill="#fff"/><circle cx="119" cy="62" r="2.6" fill="#fff"/></g>
<g class="b-x" stroke="#8ff4ff" stroke-width="4" stroke-linecap="round"><path d="M71 58 l14 14 M85 58 l-14 14"/><path d="M115 58 l14 14 M129 58 l-14 14"/></g>
<path class="b-brow" d="M58 42 L90 50 M142 42 L110 50" stroke="#232a36" stroke-width="6" stroke-linecap="round"/>
<path class="b-mouth" d="M80 94 h40" stroke="#232a36" stroke-width="5" stroke-linecap="round"/>
<g class="b-roar"><rect x="74" y="88" width="52" height="14" rx="4" fill="#232a36"/><path d="M78 95 l6 -5 l6 10 l6 -10 l6 10 l6 -10 l6 10 l6 -5" stroke="#8ff4ff" stroke-width="2.5" fill="none"/></g>
</g>
<g class="b-steam"><circle cx="34" cy="40" r="9"/><circle cx="166" cy="40" r="9"/><circle cx="26" cy="26" r="6"/><circle cx="174" cy="26" r="6"/></g>
<g class="b-stars" fill="#f3c22f"><path d="M56 4 l4 9 10 1 -8 6 3 10 -9-6 -9 6 3-10 -8-6 10-1z"/><path d="M144 2 l3 7 8 1 -6 5 2 8 -7-5 -7 5 2-8 -6-5 8-1z"/></g>
</svg>`;
/* Pandão (chefão do Mundo 5): panda sentado, barrigudo, com um bambu na pata */
const PANDA_SVG=`<svg viewBox="0 0 200 236" class="bearsvg" aria-hidden="true">
<defs><radialGradient id="pW" cx="42%" cy="32%" r="78%"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#eceef0"/><stop offset="1" stop-color="#b9bec6"/></radialGradient>
<radialGradient id="pB" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#4a4f58"/><stop offset="1" stop-color="#16181c"/></radialGradient></defs>
<g class="b-legs"><ellipse cx="60" cy="212" rx="32" ry="21" fill="url(#pB)"/><ellipse cx="140" cy="212" rx="32" ry="21" fill="url(#pB)"/><ellipse cx="60" cy="214" rx="15" ry="10" fill="#f2a7b8"/><ellipse cx="140" cy="214" rx="15" ry="10" fill="#f2a7b8"/>
<g fill="#f2a7b8"><circle cx="46" cy="202" r="4.5"/><circle cx="58" cy="199" r="4.5"/><circle cx="70" cy="201" r="4.5"/><circle cx="130" cy="201" r="4.5"/><circle cx="142" cy="199" r="4.5"/><circle cx="154" cy="202" r="4.5"/></g></g>
<g class="b-arm b-arm-l"><ellipse cx="38" cy="148" rx="21" ry="36" fill="url(#pB)"/><ellipse cx="38" cy="178" rx="13" ry="9" fill="#2a2e35"/></g>
<g class="b-arm b-arm-r"><rect x="168" y="60" width="13" height="150" rx="6" fill="#8fcf5a" stroke="#4f9a2e" stroke-width="2"/><path d="M168 100 h13 M168 140 h13 M168 180 h13" stroke="#4f9a2e" stroke-width="4"/>
<path d="M181 72 q22 -12 30 -2 q-16 8 -30 2z M168 118 q-20 -14 -30 -4 q14 10 30 4z" fill="#5fae3a"/>
<ellipse cx="162" cy="148" rx="21" ry="36" fill="url(#pB)"/><ellipse cx="168" cy="172" rx="13" ry="10" fill="#2a2e35"/></g>
<ellipse cx="100" cy="158" rx="68" ry="64" fill="url(#pW)"/>
<path d="M34 128 Q100 158 166 128 L166 112 Q100 140 34 112Z" fill="url(#pB)"/>
<ellipse cx="100" cy="172" rx="40" ry="34" fill="#fff" opacity=".7"/>
<g class="b-head">
<circle cx="46" cy="34" r="24" fill="url(#pB)"/><circle cx="154" cy="34" r="24" fill="url(#pB)"/>
<circle cx="100" cy="80" r="60" fill="url(#pW)"/>
<ellipse cx="72" cy="76" rx="18" ry="24" fill="url(#pB)" transform="rotate(-28 72 76)"/><ellipse cx="128" cy="76" rx="18" ry="24" fill="url(#pB)" transform="rotate(28 128 76)"/>
<circle cx="74" cy="74" r="10" fill="#fff"/><circle cx="126" cy="74" r="10" fill="#fff"/>
<ellipse cx="62" cy="104" rx="10" ry="6" fill="#f5a3b5" opacity=".8"/><ellipse cx="138" cy="104" rx="10" ry="6" fill="#f5a3b5" opacity=".8"/>
<ellipse cx="100" cy="98" rx="11" ry="8" fill="#16181c"/><ellipse cx="97" cy="96" rx="3" ry="1.8" fill="#fff" opacity=".6"/>
<g class="b-eyes"><circle class="b-eye" cx="75" cy="75" r="6.5"/><circle class="b-eye" cx="125" cy="75" r="6.5"/><circle cx="77" cy="73" r="2.2" fill="#fff"/><circle cx="127" cy="73" r="2.2" fill="#fff"/></g>
<g class="b-x" stroke="#16181c" stroke-width="4" stroke-linecap="round"><path d="M68 68 l13 13 M81 68 l-13 13"/><path d="M119 68 l13 13 M132 68 l-13 13"/></g>
<path class="b-brow" d="M56 46 L84 54 M144 46 L116 54" stroke="#16181c" stroke-width="6.5" stroke-linecap="round"/>
<path class="b-mouth" d="M88 112 Q100 104 112 112" stroke="#16181c" stroke-width="4" fill="none" stroke-linecap="round"/>
<g class="b-roar"><ellipse cx="100" cy="116" rx="14" ry="11" fill="#5b1414"/><path d="M89 109 l3 6 l3 -6 M105 109 l3 6 l3 -6" fill="#fff"/><ellipse cx="100" cy="121" rx="8" ry="4" fill="#d9534f"/></g>
</g>
<g class="b-steam"><circle cx="30" cy="16" r="9"/><circle cx="170" cy="16" r="9"/><circle cx="22" cy="2" r="6"/><circle cx="178" cy="2" r="6"/></g>
<g class="b-stars" fill="#f3c22f"><path d="M70 6 l4 9 10 1 -8 6 3 10 -9-6 -9 6 3-10 -8-6 10-1z"/><path d="M128 2 l3 7 8 1 -6 5 2 8 -7-5 -7 5 2-8 -6-5 8-1z"/></g>
</svg>`;
/* Gatão da Sorte (chefão do Mundo 6): gato maneki-neko acenando, com coleira, sininho e uma moeda koban */
const NEKO_SVG=`<svg viewBox="0 0 200 236" class="bearsvg" aria-hidden="true">
<defs><radialGradient id="nW" cx="42%" cy="30%" r="80%"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#fbf4ea"/><stop offset="1" stop-color="#dccfbd"/></radialGradient>
<radialGradient id="nG" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#fff3b8"/><stop offset=".55" stop-color="#e8b923"/><stop offset="1" stop-color="#a87a10"/></radialGradient></defs>
<g class="b-legs"><ellipse cx="68" cy="214" rx="26" ry="16" fill="url(#nW)" stroke="#d6c6b0" stroke-width="2"/><ellipse cx="132" cy="214" rx="26" ry="16" fill="url(#nW)" stroke="#d6c6b0" stroke-width="2"/>
<g fill="#f5a3b5"><ellipse cx="68" cy="218" rx="8" ry="5"/><ellipse cx="132" cy="218" rx="8" ry="5"/><circle cx="58" cy="208" r="3.5"/><circle cx="68" cy="205" r="3.5"/><circle cx="78" cy="208" r="3.5"/><circle cx="122" cy="208" r="3.5"/><circle cx="132" cy="205" r="3.5"/><circle cx="142" cy="208" r="3.5"/></g></g>
<g class="b-arm b-arm-l"><ellipse cx="32" cy="92" rx="17" ry="34" fill="url(#nW)" stroke="#d6c6b0" stroke-width="2"/><circle cx="30" cy="62" r="17" fill="url(#nW)" stroke="#d6c6b0" stroke-width="2"/>
<g fill="#f5a3b5"><ellipse cx="30" cy="66" rx="7" ry="5"/><circle cx="21" cy="56" r="3.2"/><circle cx="30" cy="52" r="3.2"/><circle cx="39" cy="56" r="3.2"/></g></g>
<g class="b-arm b-arm-r"><ellipse cx="160" cy="146" rx="18" ry="34" fill="url(#nW)" stroke="#d6c6b0" stroke-width="2"/>
<ellipse cx="180" cy="168" rx="17" ry="25" fill="url(#nG)" stroke="#8a6206" stroke-width="2.5"/><path d="M168 156 h24 M166 166 h28 M166 176 h28 M168 186 h24" stroke="#a87a10" stroke-width="2"/><rect x="175" y="146" width="10" height="8" fill="#a87a10"/>
<ellipse cx="160" cy="176" rx="12" ry="9" fill="url(#nW)" stroke="#d6c6b0" stroke-width="2"/></g>
<ellipse cx="100" cy="158" rx="64" ry="62" fill="url(#nW)" stroke="#d6c6b0" stroke-width="2"/>
<ellipse cx="134" cy="182" rx="18" ry="14" fill="#f0a050" opacity=".85"/><ellipse cx="66" cy="196" rx="12" ry="9" fill="#3a3a3a" opacity=".8"/>
<path d="M44 118 Q100 140 156 118" stroke="#d6334a" stroke-width="12" fill="none" stroke-linecap="round"/>
<circle cx="100" cy="138" r="13" fill="url(#nG)" stroke="#8a6206" stroke-width="2.5"/><path d="M90 138 h20" stroke="#8a6206" stroke-width="2.5"/><circle cx="100" cy="144" r="2.5" fill="#8a6206"/>
<g class="b-head">
<path d="M44 52 L50 6 L86 30Z" fill="url(#nW)" stroke="#d6c6b0" stroke-width="2" stroke-linejoin="round"/><path d="M156 52 L150 6 L114 30Z" fill="url(#nW)" stroke="#d6c6b0" stroke-width="2" stroke-linejoin="round"/>
<path d="M52 42 L55 18 L74 31Z" fill="#f5a3b5"/><path d="M148 42 L145 18 L126 31Z" fill="#f0a050"/>
<circle cx="100" cy="78" r="58" fill="url(#nW)" stroke="#d6c6b0" stroke-width="2"/>
<path d="M118 24 Q146 24 152 52 Q138 40 120 42Z" fill="#f0a050" opacity=".85"/><path d="M58 40 Q68 28 82 26 Q74 38 72 48Z" fill="#3a3a3a" opacity=".75"/>
<ellipse cx="64" cy="98" rx="11" ry="7" fill="#f5a3b5" opacity=".8"/><ellipse cx="136" cy="98" rx="11" ry="7" fill="#f5a3b5" opacity=".8"/>
<path d="M96 90 h8 l-4 5z" fill="#e57a92"/>
<path d="M44 90 h24 M44 98 l24 -3 M156 90 h-24 M156 98 l-24 -3" stroke="#b9a68e" stroke-width="2" stroke-linecap="round"/>
<g class="b-eyes"><circle class="b-eye" cx="78" cy="72" r="7.5"/><circle class="b-eye" cx="122" cy="72" r="7.5"/><circle cx="80.5" cy="69.5" r="2.4" fill="#fff"/><circle cx="124.5" cy="69.5" r="2.4" fill="#fff"/></g>
<g class="b-x" stroke="#3a2a1a" stroke-width="4" stroke-linecap="round"><path d="M71 65 l14 14 M85 65 l-14 14"/><path d="M115 65 l14 14 M129 65 l-14 14"/></g>
<path class="b-brow" d="M62 54 L90 62 M138 54 L110 62" stroke="#3a2a1a" stroke-width="5.5" stroke-linecap="round"/>
<path class="b-mouth" d="M88 100 Q94 108 100 100 Q106 108 112 100" stroke="#3a2a1a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<g class="b-roar"><ellipse cx="100" cy="108" rx="13" ry="11" fill="#5b1414"/><path d="M90 101 l3 6 l3 -6 M104 101 l3 6 l3 -6" fill="#fff"/><ellipse cx="100" cy="113" rx="7" ry="4" fill="#e57a92"/></g>
</g>
<g class="b-steam"><circle cx="30" cy="22" r="9"/><circle cx="170" cy="22" r="9"/><circle cx="22" cy="8" r="6"/><circle cx="178" cy="8" r="6"/></g>
<g class="b-stars" fill="#f3c22f"><path d="M64 2 l4 9 10 1 -8 6 3 10 -9-6 -9 6 3-10 -8-6 10-1z"/><path d="M136 2 l3 7 8 1 -6 5 2 8 -7-5 -7 5 2-8 -6-5 8-1z"/></g>
</svg>`;
/* cada chefão: desenho, bloco que ele joga, falas e o efeito quando está bravo */
const BOSSES={
  bear:{name:'Ursão',art:'o',svg:BEAR_SVG,min:'bear',minC:BEARC,cell:[-5,'ice'],pitch:1,frzI:'❄️',frzT:'peça congelada',angry:'O Ursão está BRAVO!',goal:'Limpe linhas para atacar o Ursão',
    say:{enter:'Ninguém derruba o Ursão! Grrr!',hurt:['Aiii! Isso doeu!','Grr… sorte de vocês!','Meu pelo!','Vocês vão ver só!'],atk:'Grrr! Tomem ursinhos blindados!',atkRage:'Agora fiquei BRAVO! Tomem ursinhos!',atkFrz:'Grrr! Ursinhos blindados… e congelei uma peça por 4 segundos!',rage:'Vocês me deixaram BRAVO!',defeat:'Ai ai… vocês venceram…'}},
  queen:{name:'Rainha Jujuba',art:'a',svg:QUEEN_SVG,min:'gum',minC:GUMC,cell:[-6,null],pitch:1.45,frzI:'🍬',frzT:'peça grudada',angry:'A Rainha Jujuba está BRAVA!',goal:'Limpe linhas para atacar a Rainha Jujuba',
    say:{enter:'Ajoelhem-se diante da Rainha Jujuba!',hurt:['Ai! Minha coroa!','Que falta de educação!','Vou derreter de raiva!','Guardas!!'],atk:'Tomem chiclete! Hihihi!',atkRage:'Chiclete em dobro, plebeus!',atkFrz:'Chiclete… e grudei uma peça por 4 segundos!',rage:'Agora a Rainha ficou BRAVA!',defeat:'Nãão… meu reino de açúcar…'}},
  cat:{name:'Lagartão Guloso',art:'o',svg:CAT_SVG,min:'rotten',minC:ROTC,cell:[-8,'ice'],pitch:1.1,frzI:'🦎',frzT:'peça mordida',angry:'O Lagartão está FURIOSO!',goal:'Limpe linhas para atacar o Lagartão',
    say:{enter:'Hora do lanche! Nham nham!',hurt:['Ai! Minha barriguinha!','Isso não é de comer!','Grrr… nham!','Minhas escamas!'],atk:'Tomem maçãs bichadas!',atkRage:'Maçã podre pra todo mundo!',atkFrz:'Maçãs bichadas… e mordi uma peça por 4 segundos!',rage:'Fiquei com FOME DE RAIVA!',defeat:'Ai… comi demais… vou tirar uma soneca no sol…'}},
  robot:{name:'Robozão',art:'o',svg:ROBOT_SVG,eye:'#8ff4ff',min:'nut',minC:NUTC,cell:[-12,'ice'],pitch:.75,frzI:'🔧',frzT:'peça travada',angry:'O Robozão está em MODO FÚRIA!',goal:'Limpe linhas para atacar o Robozão',
    say:{enter:'BIP BOP! Obra interditada!',hurt:['ERRO! ERRO!','Meus parafusos!','Bzzt… curto-circuito!','Recalculando…'],atk:'Tomem porcas de aço! BIP!',atkRage:'Chuva de porcas! BOP BOP!',atkFrz:'Porcas… e travei uma peça por 4 segundos!',rage:'MODO FÚRIA ATIVADO!',defeat:'Bateria… fraca… desligando…'}},
  panda:{name:'Pandão',art:'o',svg:PANDA_SVG,min:'stalk',minC:STALKC,cell:[-9,null],pitch:.9,frzI:'🐼',frzT:'peça abraçada',angry:'O Pandão acordou BRAVO!',goal:'Limpe linhas para atacar o Pandão',
    say:{enter:'Quem acordou o Pandão?!',hurt:['Ai! Meu bambu!','Isso não é carinho!','Grumpf!','Vou contar até dez…'],atk:'Plantei bambu! Cresce, cresce!',atkRage:'Bambuzal inteiro pra vocês!',atkFrz:'Bambu… e abracei uma peça por 4 segundos!',rage:'Agora eu fiquei BRAVO de verdade!',defeat:'Zzz… vou voltar a dormir…'}},
  neko:{name:'Gatão da Sorte',art:'o',svg:NEKO_SVG,min:'koban',minC:COINC,cell:[-11,'ice'],pitch:1.3,frzI:'🐾',frzT:'peça presa na pata',angry:'O Gatão da Sorte está BRAVO!',goal:'Limpe linhas para atacar o Gatão da Sorte',
    say:{enter:'Miau! A sorte está do MEU lado!',hurt:['Miaaau!','Meu sininho!','Que azar!','Isso foi sorte de vocês!'],atk:'Moedas da sorte… pra mim! Miau!',atkRage:'Chuva de moedas! MIAU!',atkFrz:'Moedas… e prendi uma peça na pata por 4 segundos!',rage:'Acabou a sorte de vocês! MIAAAU!',defeat:'Miau… vocês tiveram mais sorte…'}}
};
const bossArt=B=>B.art+' '+B.name;
let BOSS_ID='bear';
const BOSS=()=>BOSSES[BOSS_ID]||BOSSES.bear;
/* o chefão vira peças prontas (corpo, braços, olhos, boca, fumaça…), desenhadas uma vez na resolução da tela.
   As animações continuam as mesmas: só giram, movem e mostram/escondem essas peças (trabalho do chip gráfico). */
const BOSS_LAY={}, BOSS_PR={};
const BEAR_SH=[40,117.1], BEAR_SH_R=[160,117.1], BEAR_VB=[200,236];
const BEAR_PARTS=[
  ['sh-body',{shadow:'body'}],['sh-arm-l b-arm-l',{shadow:'.b-arm-l',org:BEAR_SH}],['sh-arm-r b-arm-r',{shadow:'.b-arm-r',org:BEAR_SH_R}],
  ['b-arm-l',{keep:'.b-arm-l',org:BEAR_SH}],['b-arm-r',{keep:'.b-arm-r',org:BEAR_SH_R}],['b-body',{body:1}],
  ['b-eyes',{keep:'.b-eyes'}],['b-eyes b-eyes-red',{keep:'.b-eyes',red:1}],['b-x',{keep:'.b-x'}],['b-mouth',{keep:'.b-mouth'}],['b-roar',{keep:'.b-roar'}],
  ['b-steam',{keep:'.b-steam'}],['b-stars',{keep:'.b-stars'}],['b-glow',{glow:1}]];
const BEAR_DYN='.b-arm,.b-eyes,.b-x,.b-mouth,.b-roar,.b-steam,.b-stars';
function bearLayerSVG(svg,o){
  const doc=new DOMParser().parseFromString(svg.replace('class="bearsvg"','xmlns="http://www.w3.org/2000/svg"'),'image/svg+xml'), root=doc.documentElement;
  root.querySelectorAll('.b-steam').forEach(e=>e.setAttribute('fill','#fff'));
  root.querySelectorAll('.b-eye').forEach(e=>e.setAttribute('fill',o.red?'#e5483f':(BOSS().eye||'#241509')));
  const sel=o.keep||o.shadow;
  if(o.body||o.shadow==='body'||o.glow){ root.querySelectorAll(o.glow?'.b-eyes,.b-x,.b-mouth,.b-roar,.b-steam,.b-stars':BEAR_DYN).forEach(e=>e.remove()); }
  else { const kept=[...root.querySelectorAll(sel)], keepSet=new Set(); kept.forEach(k=>{ let p=k; while(p&&p!==root){ keepSet.add(p); p=p.parentNode; } k.querySelectorAll('*').forEach(c=>keepSet.add(c)); });
    [...root.querySelectorAll('*')].forEach(e=>{ if(e.closest('defs')||keepSet.has(e)) return; e.remove(); }); }
  return new XMLSerializer().serializeToString(root);
}
function loadSVG(src,w,h){ return new Promise((res,rej)=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=rej; im.width=w; im.height=h; im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(src); }); }
function bossPrep(id){
  if(id) BOSS_ID=id; id=BOSS_ID; const svg=BOSS().svg;
  if(BOSS_PR[id]) return BOSS_PR[id];
  prepRoars();
  BOSS_PR[id]=(async()=>{
    const dpr=Math.min(3,window.devicePixelRatio||1), sc=Math.min(3.1,290*dpr/BEAR_VB[0]), P=24, W=Math.round((BEAR_VB[0]+P*2)*sc), H=Math.round((BEAR_VB[1]+P*2)*sc);
    const canFilter='filter' in CanvasRenderingContext2D.prototype, out=[];
    for(const [cls,o] of BEAR_PARTS){
      const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d');
      const im=await loadSVG(bearLayerSVG(svg,o),BEAR_VB[0]*sc,BEAR_VB[1]*sc);
      if(o.shadow||o.glow){
        /* silhueta: sombra (para baixo, desfocada) ou brilho vermelho do dano */
        const sil=document.createElement('canvas'); sil.width=W; sil.height=H; const sx=sil.getContext('2d');
        sx.drawImage(im,P*sc,P*sc,BEAR_VB[0]*sc,BEAR_VB[1]*sc); sx.globalCompositeOperation='source-in'; sx.fillStyle=o.glow?'#ff3b30':'rgba(0,0,0,.32)'; sx.fillRect(0,0,W,H);
        if(canFilter) x.filter=`blur(${(o.glow?9:12)*sc}px)`;
        x.drawImage(sil,0,o.glow?0:7*sc); if(o.glow){ x.drawImage(sil,0,0); }
        x.filter='none';
        if(o.glow){ const t=document.createElement('canvas'); t.width=W; t.height=H; const tx=t.getContext('2d'); tx.drawImage(im,P*sc,P*sc,BEAR_VB[0]*sc,BEAR_VB[1]*sc);
          tx.globalCompositeOperation='source-atop'; tx.fillStyle='rgba(255,120,60,.55)'; tx.fillRect(0,0,W,H); x.drawImage(t,0,0); }
      } else x.drawImage(im,P*sc,P*sc,BEAR_VB[0]*sc,BEAR_VB[1]*sc);
      /* recorta só a parte desenhada (economiza memória do celular) */
      const d=x.getImageData(0,0,W,H).data; let x0=W,y0=H,x1=-1,y1=-1;
      for(let yy=0;yy<H;yy+=2) for(let xx=0;xx<W;xx+=2){ if(d[(yy*W+xx)*4+3]>2){ if(xx<x0)x0=xx; if(xx>x1)x1=xx; if(yy<y0)y0=yy; if(yy>y1)y1=yy; } }
      if(x1<0){ continue; } x0=Math.max(0,x0-3); y0=Math.max(0,y0-3); x1=Math.min(W-1,x1+3); y1=Math.min(H-1,y1+3);
      const cw=x1-x0+1, ch=y1-y0+1, c2=document.createElement('canvas'); c2.width=cw; c2.height=ch; c2.getContext('2d').drawImage(cv,x0,y0,cw,ch,0,0,cw,ch);
      const bx=x0/sc-P, by=y0/sc-P, bw=cw/sc, bh=ch/sc;
      out.push({cls,url:c2.toDataURL('image/png'),l:bx/BEAR_VB[0]*100,t:by/BEAR_VB[1]*100,w:bw/BEAR_VB[0]*100,h:bh/BEAR_VB[1]*100,org:o.org?`${(o.org[0]-bx)/bw*100}% ${(o.org[1]-by)/bh*100}%`:''});
    }
    BOSS_LAY[id]=out; return out;
  })().catch(()=>{ BOSS_PR[id]=null; return null; });
  return BOSS_PR[id];
}
function bearHTML(cls,noGlow){
  const L=BOSS_LAY[BOSS_ID];
  if(!L) return `<div class="bossbear svgb ${cls}" data-b="${BOSS_ID}">${BOSS().svg}</div>`;
  return `<div class="bossbear lay ${cls}" data-b="${BOSS_ID}">${L.filter(p=>!(noGlow&&p.cls==='b-glow')).map(p=>`<img class="bl ${p.cls}" alt="" draggable="false" src="${p.url}" style="left:${p.l}%;top:${p.t}%;width:${p.w}%;height:${p.h}%${p.org?';transform-origin:'+p.org:''}">`).join('')}</div>`;
}
const BOSS_URL={};
function bossBlockUrl(){ const B=BOSS(); if(BOSS_URL[BOSS_ID]!=null) return BOSS_URL[BOSS_ID]; try{ BOSS_URL[BOSS_ID]=drawBlock(B.min,B.minC,null,96,1,false).toDataURL(); }catch(e){ BOSS_URL[BOSS_ID]=''; } return BOSS_URL[BOSS_ID]; }
/* o desenho guardado é de outro chefão, ou ainda é o SVG e as peças já ficaram prontas? */
function bossStale(el){ const b=el&&el.querySelector('.bossbear'); return !b||b.dataset.b!==BOSS_ID||(!!BOSS_LAY[BOSS_ID])!==b.classList.contains('lay'); }
function bossHide(){ BOSS_Q=null; if(BELT){ BELT=null; bDirty=true; bReq(); } $$('#fxl .bosstrip,#fxl .flyb,#fxl .bossdock,#fxl .bossbubble,#fxl .bossdmg').forEach(e=>e.remove()); $('#game').classList.remove('bossmode'); $('#bossBar').hidden=true; }
/* Ursão parado ao lado dos pontos, da descrição e da vida */
/* posição do cantinho: medida uma vez e de novo só quando o layout muda */
let BOSS_Q=null;
function bossQ(){ return BOSS_Q||(BOSS_Q=bossDockRect()); }
/* a vida do chefão é a barra larga embaixo do cartão (#bossBar): o chefão fica entre o relógio e ela */
function bossDockRect(){ const r=$('#gInfo').getBoundingClientRect(), tb=$('#timebar').getBoundingClientRect(), bb=$('#bossBar'), bot=bb.hidden?r.bottom-18:bb.getBoundingClientRect().top, top=tb.bottom+6, sz=Math.max(56,Math.min(132,(bot-top-4)/1.24)); return {left:r.right-sz-10,top,w:sz}; }
function bossDock(angry){
  if(!$('#game').classList.contains('bossmode')){ $('#game').classList.add('bossmode'); $('#bossBar').hidden=false; layout(); BOSS_Q=null; }
  let d=$('#fxl .bossdock'); if(d&&bossStale(d)){ const hp=d.querySelector('.bosshp').outerHTML; d.innerHTML=bearHTML('idle')+hp; }
  if(!d){ d=document.createElement('div'); d.className='bossdock'; d.innerHTML=bearHTML('idle')+`<div class="bosshp"><i></i><b></b></div>`; $('#fxl').appendChild(d); BOSS_Q=null; }
  const q=bossQ(); if(d._q!==q){ d._q=q; d.style.left=q.left+'px'; d.style.top=q.top+'px'; d.style.width=q.w+'px'; $('#game').style.setProperty('--bossW',(q.w+14)+'px'); }
  d.querySelector('.bossbear').classList.toggle('angry',!!angry); return d;
}
function bossHP(hp,max){ const d=$('#fxl .bossdock'); if(!d) return; const r=Math.max(0,hp)/max;
  [d.querySelector('.bosshp'),$('#bossBar')].forEach(h=>{ h.querySelector('i').style.width=(r*100)+'%'; h.querySelector('b').textContent=`❤️ ${BOSS().name}: ${Math.max(0,hp)}/${max}`; h.classList.toggle('low',r<=.5); }); }
/* Ursão levou dano: encolhe, fica vermelho, fecha os olhos; número sobe ao lado dele */
function bossHurt(dmg){
  const d=$('#fxl .bossdock'); if(!d||d.style.visibility==='hidden') return; const b=d.querySelector('.bossbear'), q=bossQ();
  b.classList.remove('hurt'); void b.offsetWidth; b.classList.add('hurt'); setTimeout(()=>b.classList.remove('hurt'),700);
  const hp=$('#bossBar'); hp.classList.remove('hit'); void hp.offsetWidth; hp.classList.add('hit');
  const f=document.createElement('div'); f.className='bossdmg'; f.textContent='-'+dmg; f.style.left=(q.left+q.w/2)+'px'; f.style.top=(q.top-q.w*.18)+'px'; $('#fxl').appendChild(f); setTimeout(()=>f.remove(),1100);
  for(let k=0;k<6;k++){ const s=document.createElement('div'); s.className='bossspark'; s.textContent=['✦','✧','★'][k%3]; s.style.left=(q.left+q.w/2)+'px'; s.style.top=(q.top+q.w*.45)+'px'; s.style.setProperty('--dx',(Math.cos(k*1.05)*q.w*.7)+'px'); s.style.setProperty('--dy',(Math.sin(k*1.05)*q.w*.6-q.w*.2)+'px'); $('#fxl').appendChild(s); setTimeout(()=>s.remove(),700); }
  SFX.oof(); buzz(20);
  if(dmg>=4&&Math.random()<.7){ const hs=BOSS().say.hurt; bossSay(hs[Math.floor(Math.random()*hs.length)],1600); }
}
/* balão de fala do Ursão (no cantinho, ou em cima dele quando está no meio da tela) */
function bossSay(txt,ms=2200){
  $$('#fxl .bossbubble').forEach(e=>e.remove());
  const t0=$('#fxl .bosstrip'), trip=t0&&t0.style.visibility!=='hidden'?t0:null, dock=$('#fxl .bossdock'), el=document.createElement('div'); el.className='bossbubble'; el.textContent=txt;
  if(trip){ el.classList.add('up'); el.style.left=(parseFloat(trip.style.left)+parseFloat(trip.style.width)/2)+'px'; el.style.top=(parseFloat(trip.style.top)-8)+'px'; }
  else if(dock){ const q=bossQ(); el.classList.add('side'); el.style.left=(q.left-8)+'px'; el.style.top=(q.top+q.w*.18)+'px'; }
  else { toast(txt); return; }
  $('#fxl').appendChild(el); setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(),300); },ms);
}
window.addEventListener('resize',()=>{ BOSS_Q=null; if($('#fxl .bossdock')) setTimeout(()=>{ BOSS_Q=null; const d=$('#fxl .bossdock'); if(d){ const q=bossQ(); d._q=q; d.style.left=q.left+'px'; d.style.top=q.top+'px'; d.style.width=q.w+'px'; } },250); });
/* mode: enter | attack | rage | defeat */
function bossShow(mode,o={}){
  grC=null; const gr=GR(), w=Math.min(gr.width*.64,290), el=document.createElement('div'), dur={enter:2400,attack:2000,rage:2000,defeat:2600}[mode]||2000;
  /* sai do cantinho, faz a cena no meio da tela e volta (na derrota, cai e não volta).
     A cópia do meio é uma só, reaproveitada: as imagens já ficam prontas na memória do celular. */
  const dock=bossDock(o.rage), q=bossQ(), L=gr.left+gr.width/2-w/2, T=gr.top+gr.height*(mode==='enter'||mode==='defeat'?.12:.4);
  let trip=$('#fxl .bosstrip'); if(trip&&bossStale(trip)){ trip.remove(); trip=null; }
  if(!trip){ trip=el; trip.className='bosstrip'; trip.innerHTML=bearHTML('',true); $('#fxl').appendChild(trip); }
  clearTimeout(trip._t); if(trip._a) trip._a.cancel();
  dock.style.visibility='hidden'; trip.style.visibility='visible';
  trip.style.left=L+'px'; trip.style.top=T+'px'; trip.style.width=w+'px';
  const bb=trip.querySelector('.bossbear'); bb.className=bb.className.replace(/\b(enter|attack|rage|defeat|angry)\b/g,'').trim(); void bb.offsetWidth; bb.classList.add(mode); if(o.rage) bb.classList.add('angry');
  const from=`translate(${q.left-L}px,${q.top-T}px) scale(${q.w/w})`, mid='translate(0,0) scale(1)';
  trip._a=trip.animate(mode==='defeat'?[{transform:from},{offset:.14,transform:mid},{transform:mid}]:[{transform:from},{offset:.15,transform:mid},{offset:.82,transform:mid},{transform:from}],{duration:dur,easing:'cubic-bezier(.4,.1,.3,1)',fill:'both'});
  trip._t=setTimeout(()=>{ trip.style.visibility='hidden'; if(trip._a){ trip._a.cancel(); trip._a=null; } if(mode==='defeat') dock.remove(); else dock.style.visibility=''; },dur);
  if(mode==='attack'&&o.cells&&o.cells.length){
    /* blocos de ursinho saem das patas e caem nas casas certas */
    const url=bossBlockUrl(), top=T, paws=[[gr.left+gr.width/2-w*.36,top+w*.12],[gr.left+gr.width/2+w*.36,top+w*.12]];
    o.cells.forEach((i,k)=>{ const [x0,y0]=paws[k%2], x1=gr.left+(i%N)*CS, y1=gr.top+((i/N)|0)*CS, mx=(x0+x1)/2, my=Math.min(y0,y1)-CS*2.4;
      const b=document.createElement('div'); b.className='flyb'; b.style.width=b.style.height=CS+'px'; b.style.backgroundColor=BOSS().minC; if(url) b.style.backgroundImage=`url("${url}")`; $('#fxl').appendChild(b);
      const a=b.animate([{transform:`translate(${x0-CS/2}px,${y0-CS/2}px) scale(.5) rotate(0deg)`,opacity:0},{offset:.12,opacity:1},{offset:.5,transform:`translate(${mx-CS/2}px,${my}px) scale(1.15) rotate(200deg)`},{transform:`translate(${x1}px,${y1}px) scale(1) rotate(360deg)`,opacity:1}],{duration:650,delay:640+k*120,easing:'cubic-bezier(.3,.1,.5,1)',fill:'both'});
      a.onfinish=()=>b.remove(); });
  }
  if(mode==='attack'||mode==='rage'||mode==='enter') setTimeout(()=>{ SFX.roar((mode==='rage'?.85:1)*BOSS().pitch); buzz([40,60,40]); },mode==='attack'?380:250);
  if(mode==='attack'&&o.cells&&o.cells.length) setTimeout(()=>SFX.thud(),1300);
  if(mode==='defeat') setTimeout(()=>{ SFX.roar(1.6*BOSS().pitch); },300);
}
