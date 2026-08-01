// ==UserScript==
// @name         MyPrettyGradES
// @namespace    http://tampermonkey.net/
// @version      1.1
// @author       Ailcope
// @homepageURL  https://github.com/Ailcope/MyPrettyGradES
// @supportURL   https://github.com/Ailcope/MyPrettyGradES/issues
// @updateURL    https://github.com/Ailcope/MyPrettyGradES/raw/refs/heads/main/myges-marks.user.js
// @downloadURL  https://github.com/Ailcope/MyPrettyGradES/raw/refs/heads/main/myges-marks.user.js
// @license      CC-BY-NC-4.0
// @match        https://myges.fr/student/marks
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // Doit rester aligné avec @version : GM_info n'existe pas avec @grant none
    const VERSION = '1.1';

    const STYLE_ID = 'mpg-stats-styles';
    const DEBUG = !!(window.MPG_DEBUG || localStorage.getItem('mpg_debug') === '1');
    const COLORS_KEY = 'mpg_colors_enabled';
    const POS_KEY = 'mpg_panel_pos';
    const UPDATE_KEY = 'mpg_update_check';
    const BANNER_KEY = 'mpg_banner_hidden';

    const RAW_URL = 'https://raw.githubusercontent.com/Ailcope/MyPrettyGradES/main/myges-marks.user.js';
    const INSTALL_URL = 'https://github.com/Ailcope/MyPrettyGradES/raw/refs/heads/main/myges-marks.user.js';
    const UPDATE_INTERVAL = 24 * 60 * 60 * 1000;

    function addStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = `
            .mpg-stats-panel{position:fixed;right:12px;bottom:12px;z-index:99999;background:#fff;border:1px solid #ddd;padding:10px;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,0.12);font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#222;min-width:220px;max-width:400px}
            .mpg-stats-panel.mpg-minimized{min-width:auto;width:auto}
            .mpg-minimized .mpg-stats-content{display:none}
            .mpg-stats-panel.mpg-dragging{box-shadow:0 10px 28px rgba(0,0,0,0.25);opacity:0.95}
            .mpg-stats-panel h4{margin:0 0 6px 0;font-size:14px;display:flex;justify-content:space-between;align-items:center;gap:10px;cursor:move;user-select:none}
            .mpg-minimize-btn{font-size:18px;line-height:1;color:#888;cursor:pointer;user-select:none}
            .mpg-stats-row{display:flex;justify-content:space-between;gap:12px;margin:4px 0}
            .mpg-section{margin-top:8px;padding-top:6px;border-top:1px solid #eee;font-size:11px;font-weight:bold;color:#888;text-transform:uppercase;letter-spacing:0.4px}
            .mpg-mark-good{background:rgba(46,204,113,0.9) !important;color:#072a00 !important;font-weight:700 !important}
            .mpg-mark-bad{background:rgba(231,76,60,0.9) !important;color:#3b0000 !important;font-weight:700 !important}
            .mpg-mark-yellow{background:rgba(241,196,15,0.9) !important;color:#4a2b00 !important;font-weight:700 !important}
            .mpg-abs-bad{background:rgba(231,76,60,0.9) !important;color:#3b0000 !important;font-weight:700 !important}
            .mpg-small{font-size:12px;color:#666;margin-top:4px;text-align:center}

            .mpg-info-btn{display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;margin-left:6px;border-radius:50%;border:1px solid #999;color:#666;font-size:10px;font-style:italic;font-weight:bold;line-height:1;cursor:pointer;user-select:none;vertical-align:middle}
            .mpg-info-btn:hover{background:#eee;color:#222;border-color:#666}
            .mpg-info-box{margin-top:6px;padding:8px;border:1px solid #ddd;border-radius:6px;background:#fafafa;font-size:11px;line-height:1.35}
            .mpg-info-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px}
            .mpg-info-box h5{margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.3px;color:#888}
            .mpg-info-close{cursor:pointer;font-size:13px;line-height:1;color:#999;padding:0 2px;user-select:none}
            .mpg-info-close:hover{color:#222}
            .mpg-info-row{margin:5px 0;padding-left:8px;border-left:3px solid #ddd}
            .mpg-info-n{font-weight:bold;color:#c0392b}
            .mpg-info-src{font-size:10px;color:#999}

            .mpg-period{margin-top:8px}
            .mpg-period-select{width:100%;box-sizing:border-box;padding:3px 4px;border:1px solid #ccc;border-radius:6px;background:#f7f7f7;font-size:12px;cursor:pointer}

            .mpg-update{display:block;margin-top:8px;padding:5px 8px;border-radius:6px;background:#fdf3d5;border:1px solid #f1c40f;color:#7a5b00;font-size:12px;text-align:center;text-decoration:none}
            .mpg-update:hover{background:#fbe9b0}

            .mpg-toast{position:fixed;right:12px;z-index:100001;max-width:300px;background:#2c3e50;color:#fff;padding:9px 12px;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,0.25);font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.35;opacity:0;transition:opacity 0.25s}
            .mpg-toast-in{opacity:1}

            .mpg-banner{position:fixed;top:0;left:0;right:0;z-index:100000;padding:14px 18px;font-family:Arial,Helvetica,sans-serif;color:#fff;box-shadow:0 4px 16px rgba(0,0,0,0.3);max-height:60vh;overflow-y:auto}
            .mpg-banner-danger{background:#c0392b}
            .mpg-banner-warn{background:#d35400}
            .mpg-banner-notice{background:#b7950b}
            .mpg-banner-head{display:flex;justify-content:space-between;align-items:center;font-size:19px;font-weight:bold;margin-bottom:8px;letter-spacing:0.2px}
            .mpg-banner-close{cursor:pointer;font-size:18px;line-height:1;opacity:0.8;padding:0 4px}
            .mpg-banner-close:hover{opacity:1}
            .mpg-banner-item{margin:6px 0;padding:6px 10px;border-left:4px solid rgba(255,255,255,0.65);background:rgba(0,0,0,0.14);border-radius:0 4px 4px 0;font-size:14px}
            .mpg-banner-item-notice{border-left-color:rgba(255,255,255,0.35)}
            .mpg-banner-detail{font-size:13px;opacity:0.92;margin-top:2px}
            .mpg-banner-src{margin-top:8px;font-size:11px;opacity:0.75}

            .mpg-chart-container{margin-top:10px;padding:10px;background:#fff;border:1px solid #ddd;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
            .mpg-chart-title{font-size:12px;font-weight:bold;margin-bottom:6px;text-align:center}

            .mpg-chart-flex { display: flex; align-items: flex-end; height: 130px; }
            .mpg-y-axis {
                display: flex; flex-direction: column-reverse; justify-content: space-between;
                height: 100px; margin-bottom: 20px; margin-right: 6px;
                font-size: 10px; color: #888; text-align: right;
                border-right: 1px solid #ccc; padding-right: 4px;
            }
            .mpg-y-axis span { line-height: 1; }

            .mpg-scroll-area { flex: 1; overflow-x: auto; height: 100%; scrollbar-width: thin; }
            .mpg-bars-container {
                display: flex; height: 100%; position: relative;
                /* sans ça le conteneur reste large comme la zone visible et le
                   repère de moyenne s'arrête au milieu du graphe scrollé */
                min-width: max-content;
                background: linear-gradient(to top, #eee 1px, transparent 1px);
                background-size: 100% 25px;
                background-position: 0 10px;
            }

            .mpg-avg-line { position:absolute; left:0; right:0; height:0; border-top:1px dashed #34495e; pointer-events:none; z-index:5; }
            .mpg-avg-line::after {
                content: attr(data-val); position:absolute; left:2px; top:-12px;
                font-size:9px; color:#34495e; background:#fff; padding:0 2px; border-radius:2px;
            }

            .mpg-bar-wrapper {
                display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
                flex: 0 0 36px; height: 100%; position: relative;
            }
            .mpg-bar-area {
                flex: 0 0 100px; width: 100%; display: flex; align-items: flex-end; justify-content: center;
                border-bottom: 1px solid #ccc;
            }
            .mpg-bar { width: 18px; background:#3498db; position:relative; transition:height 0.3s; min-height:1px; border-radius: 2px 2px 0 0; }
            .mpg-bar:hover::after{content:attr(data-val);position:absolute;top:-22px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:2px 4px;border-radius:4px;font-size:10px;white-space:nowrap;z-index:10}
            .mpg-bar-label {
                flex: 0 0 20px; width: 100%; text-align:center; font-size:9px;
                overflow:hidden; text-overflow:ellipsis; white-space:nowrap; line-height: 20px;
                padding: 0 2px;
            }
            .mpg-switch{display:flex;align-items:center;gap:8px;margin-top:8px}
            .mpg-switch input[type="checkbox"]{width:16px;height:16px}
        `;
        document.head.appendChild(s);
    }

    function parseNumber(text) {
        if (!text) return null;
        const s = ('' + text).replace(/\u00A0/g, ' ').trim();
        const m = s.match(/-?\d+[.,]?\d*/);
        if (!m) return null;
        const numStr = m[0].replace(',', '.');
        const n = Number(numStr);
        return Number.isFinite(n) ? n : null;
    }

    function colorsEnabled() {
        const v = localStorage.getItem(COLORS_KEY);
        return v === null ? true : v === '1';
    }

    // La table n'a pas d'id, c'est le tbody qui le porte (PrimeFaces met l'id du
    // widget sur la div .ui-datatable, pas sur le <table>).
    function findTableContainer() {
        const tbody = document.getElementById('marksForm:marksWidget:coursesTable_data');
        if (tbody) return tbody.closest('table') || tbody;
        const wrapper = document.getElementById('marksForm:marksWidget:coursesTable');
        if (wrapper) return wrapper.querySelector('table') || wrapper;
        const tables = Array.from(document.querySelectorAll('table'));
        for (const t of tables) {
            const headers = t.querySelectorAll('th .ui-column-title, th');
            const titles = Array.from(headers).map(h => (h.textContent||'').trim().toLowerCase());
            if (titles.includes('matière') && titles.some(x => x.startsWith('coef'))) return t;
        }
        return null;
    }

    function findMissingsTable() {
        const tbody = document.getElementById('marksForm:missingsWidget:missingsTable_data');
        if (tbody) return tbody.closest('table') || tbody;
        const tables = Array.from(document.querySelectorAll('table'));
        for (const t of tables) {
            const titles = Array.from(t.querySelectorAll('th')).map(h => (h.textContent||'').trim().toLowerCase());
            if (titles.includes('justifié') && titles.includes('date')) return t;
        }
        return null;
    }

    function computeStats() {
        const table = findTableContainer();
        if (!table) return null;
        const tbody = table.querySelector('tbody') || table;
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const courses = [];
        let allMarks = [];
        let totalWeighted = 0, sumCoef = 0;

        function expandCells(cells) {
            const out = [];
            for (const cell of cells) {
                const colspan = Math.max(1, parseInt(cell.getAttribute('colspan') || '1', 10));
                for (let k = 0; k < colspan; k++) out.push(cell);
            }
            return out;
        }

        let coefIdx = -1, ectsIdx = -1, moyIdx = -1, subjectIdx = -1;
        let headerRow = null;
        const theadRow = table.querySelector('thead tr');
        if (theadRow) {
            headerRow = theadRow;
        } else {
            const rowsForCheck = Array.from(table.querySelectorAll('tr')).slice(0, 5);
            for (const r of rowsForCheck) {
                const cells = Array.from(r.querySelectorAll('th,td'));
                if (!cells.length) continue;
                const nonNumeric = cells.filter(c => parseNumber((c.textContent||'').trim()) === null).length;
                if (r.querySelectorAll('th').length > 0 || nonNumeric >= Math.ceil(cells.length / 2)) {
                    headerRow = r; break;
                }
            }
        }
        let headerLabels = [];
        if (headerRow) {
            const raw = Array.from(headerRow.querySelectorAll('th,td'));
            const expanded = expandCells(raw);
            headerLabels = expanded.map(h => (h.textContent||'').trim().toLowerCase());
            coefIdx = headerLabels.findIndex(t => t.includes('coef'));
            ectsIdx = headerLabels.findIndex(t => t.includes('ects'));
            moyIdx = headerLabels.findIndex(t => t.includes('moy'));
            subjectIdx = headerLabels.findIndex(t => t.includes('mati'));
        }

        const useFallback = (coefIdx === -1 && ectsIdx === -1);
        if (useFallback) { coefIdx = 2; ectsIdx = 3; subjectIdx = 0; }

        const rowsTds = rows.map(r => expandCells(Array.from(r.querySelectorAll('td'))));
        const maxCols = Math.max(headerLabels.length, rowsTds.reduce((m, tds) => Math.max(m, tds.length), 0));
        const numericCount = new Array(maxCols).fill(0);
        for (const tds of rowsTds) {
            for (let i = 0; i < tds.length; i++) {
                const txt = (tds[i] && tds[i].textContent || '').trim();
                if (parseNumber(txt) !== null) numericCount[i]++;
            }
        }
        const markCols = new Set();
        for (let i = 0; i < numericCount.length; i++) {
            if (numericCount[i] > 0 && i !== coefIdx && i !== ectsIdx && i !== moyIdx && i !== subjectIdx) markCols.add(i);
        }
        if (DEBUG) console.debug('mpg: headerIdxs', {coefIdx, ectsIdx, moyIdx, subjectIdx}, 'numericCount', numericCount, 'markCols', Array.from(markCols));

        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            try {
                const row = rows[rowIndex];
                const tds = rowsTds[rowIndex];
                if (!tds || tds.length < 1) continue;

                const coefText = (tds[coefIdx] && tds[coefIdx].textContent) ? tds[coefIdx].textContent : '';
                const ectsText = (tds[ectsIdx] && tds[ectsIdx].textContent) ? tds[ectsIdx].textContent : '';

                let subjectText = `Matière ${rowIndex+1}`;
                if (subjectIdx !== -1 && tds[subjectIdx]) {
                    subjectText = (tds[subjectIdx].textContent || '').trim();
                } else if (subjectIdx === -1 && tds[0]) {
                    const t0 = (tds[0].textContent || '').trim();
                    if (t0 && parseNumber(t0) === null) {
                        subjectText = t0;
                    }
                }

                const coef = parseNumber(coefText) || 1;
                const ects = parseNumber(ectsText) || 0;

                const marks = [];
                const ccValues = [];
                const examValues = [];

                for (let i = 0; i < tds.length; i++) {
                    if (!markCols.has(i)) continue;
                    const cell = tds[i];
                    const txt = (cell && cell.textContent) ? cell.textContent : '';
                    const n = parseNumber(txt);
                    if (n !== null) {
                        marks.push({value: n, cell: cell});
                        allMarks.push(n);

                        const label = (headerLabels[i] || '').toLowerCase();
                        if (label.includes('exam') || label.includes('partiel') || label.includes('final') || label.includes('rattrap')) {
                            examValues.push(n);
                        } else {
                            ccValues.push(n);
                        }
                    }
                }

                if (DEBUG && marks.length) console.debug('mpg: row', rowIndex, 'marks', marks.map(m=>m.value));

                let avg = null;
                if (marks.length > 0) {
                    if (ccValues.length > 0 && examValues.length > 0) {
                        const avgCC = ccValues.reduce((a, b) => a + b, 0) / ccValues.length;
                        const avgExam = examValues.reduce((a, b) => a + b, 0) / examValues.length;
                        avg = (avgCC + avgExam) / 2;
                    } else {
                        avg = marks.reduce((s, m) => s + m.value, 0) / marks.length;
                    }
                }

                if (avg !== null) {
                    totalWeighted += avg * coef;
                    sumCoef += coef;
                }
                courses.push({row, name: subjectText, coef, ects, marks, avg});
            } catch (e) {
                console.error('mpg: error processing row', rowIndex, e);
            }
        }

        if (DEBUG) console.debug('mpg: totalMarks', allMarks.length, 'simpleAvg', allMarks.length? (allMarks.reduce((s,n)=>s+n,0)/allMarks.length):null );

        const simpleAvg = allMarks.length ? (allMarks.reduce((s,n)=>s+n,0)/allMarks.length) : null;
        const weightedAvg = sumCoef ? (totalWeighted / sumCoef) : simpleAvg;
        const min = allMarks.length ? Math.min(...allMarks) : null;
        const max = allMarks.length ? Math.max(...allMarks) : null;
        const variance = allMarks.length ? (allMarks.reduce((s,v)=>s+Math.pow(v - (simpleAvg||0),2),0) / allMarks.length) : null;
        const stddev = variance !== null ? Math.sqrt(variance) : null;

        return {table, tbody, rows, courses, allMarks, simpleAvg, weightedAvg, min, max, stddev, sumCoef};
    }

    function computeMissings() {
        const table = findMissingsTable();
        if (!table) return null;
        const tbody = table.querySelector('tbody') || table;

        const headerLabels = Array.from(table.querySelectorAll('thead th')).map(h => (h.textContent||'').trim().toLowerCase());
        let typeIdx = headerLabels.findIndex(t => t.includes('type'));
        let justIdx = headerLabels.findIndex(t => t.includes('justif'));
        let subjectIdx = headerLabels.findIndex(t => t.includes('mati'));
        if (typeIdx === -1) typeIdx = 2;
        if (justIdx === -1) justIdx = 3;
        if (subjectIdx === -1) subjectIdx = 1;

        const entries = [];
        for (const row of Array.from(tbody.querySelectorAll('tr'))) {
            const tds = Array.from(row.querySelectorAll('td'));
            // la ligne "Aucune entrée" n'a qu'une cellule en colspan
            if (tds.length <= justIdx) continue;
            const type = (tds[typeIdx].textContent || '').trim();
            const justified = /^oui$/i.test((tds[justIdx].textContent || '').trim());
            const subject = tds[subjectIdx] ? (tds[subjectIdx].textContent || '').trim() : '';
            entries.push({row, cell: tds[justIdx], type, justified, subject});
        }

        const absences = entries.filter(e => /absence/i.test(e.type));
        const lates = entries.filter(e => /retard/i.test(e.type));

        return {
            table,
            entries,
            absences: absences.length,
            absencesUnjustified: absences.filter(e => !e.justified).length,
            lates: lates.length,
            latesUnjustified: lates.filter(e => !e.justified).length
        };
    }

    /* ---------- règlement : conséquences des absences ---------- */

    // Règlement intérieur, art. 4 « Conséquences des absences ».
    // Source unique : le barème affiché par le bouton « i » et les alertes
    // sortent tous les deux d'ici, ils ne peuvent donc pas diverger.
    // Seuls les seuils du semestre sont calculés, et uniquement sur les
    // absences NON justifiées. Le seuil par matière et le plafond annuel
    // restent affichés à titre d'information (voir plus bas).
    const ABS_SCALE = [
        {
            n: 5, scope: 'course', level: 'warn',
            label: '5 et + dans une matière',
            sanction: "alerte par mail et minoration d'1 point de la moyenne de contrôle continu de la matière."
        },
        {
            n: 11, scope: 'term', level: 'warn',
            label: '11 et + sur le semestre',
            sanction: "alerte par mail, avertissement au bulletin, minoration d'1 point de la moyenne de contrôle continu de toutes les matières, et convocation devant un jury (Conseiller Relations Entreprises et Responsable Pédagogique)."
        },
        {
            n: 18, scope: 'term', level: 'danger',
            label: '18 et + sur le semestre',
            sanction: "alerte par mail, avertissement au bulletin, minoration de 2 points de la moyenne de contrôle continu de toutes les matières, et convocation devant le Directeur des Études ou le Directeur des Relations Entreprises."
        },
        {
            n: 30, scope: 'term', level: 'danger',
            label: '30 et + sur le semestre',
            sanction: "avertissement par courrier avec copie à l'entreprise et au bulletin, minoration de 4 points de la moyenne de contrôle continu de toutes les matières, et convocation devant le Directeur des Études et le Directeur des Relations Entreprises."
        },
        {
            n: 50, scope: 'year', level: 'danger',
            label: "50 et + sur l'année, justifiées ou non",
            sanction: "exclusion définitive possible, minoration de 4 points de la moyenne de contrôle continu de toutes les matières, et convocation devant le Directeur des Études et le Directeur des Relations Entreprises."
        }
    ];

    // Ni le seuil par matière ni le plafond annuel ne sont comptés : les deux
    // lignes restent dans le barème pour information. Le total annuel parce
    // que myGES n'expose qu'un semestre à la fois et qu'on ne stocke rien ;
    // le seuil par matière parce qu'on ne veut pas alerter dessus.
    // du plus haut au plus bas : on veut la sanction la plus lourde déjà atteinte
    const ABS_TIERS = ABS_SCALE.filter(s => s.scope === 'term').slice().sort((a, b) => b.n - a.n);

    function buildWarnings(missings) {
        const out = [];
        if (!missings) return out;

        const u = missings.absencesUnjustified;

        const tier = ABS_TIERS.find(t => u >= t.n);
        if (tier) {
            out.push({
                level: tier.level,
                title: `${u} absences non justifiées ce semestre (seuil des ${tier.n} atteint)`,
                detail: 'Sanction prévue : ' + tier.sanction
            });
        } else {
            const next = ABS_TIERS[ABS_TIERS.length - 1];
            if (u >= next.n - 2) {
                out.push({
                    level: 'notice',
                    title: `${u} absences non justifiées ce semestre`,
                    detail: `Encore ${next.n - u} et tu passes le seuil des ${next.n} : ${next.sanction}`
                });
            }
        }

        return out;
    }

    // Combien d'absences non justifiées il reste avant la première sanction.
    // Seuls les seuils du semestre entrent dans le calcul.
    function nextSanction(missings) {
        if (!missings) return null;

        const u = missings.absencesUnjustified;
        const nextTier = ABS_TIERS.slice().sort((a, b) => a.n - b.n).find(t => u < t.n);
        if (!nextTier) return {remaining: 0, scope: null, detail: 'Tous les seuils du semestre sont déjà dépassés.'};

        return {
            remaining: nextTier.n - u,
            scope: 'semestre',
            detail: `${nextTier.n} absences non justifiées sur le semestre (tu en es à ${u}).`
        };
    }

    // Bannière plein écran : le panneau en bas à droite est trop discret pour ça.
    function buildBanner(warnings) {
        const existing = document.getElementById('mpg-warning-banner');

        let hidden = false;
        try { hidden = sessionStorage.getItem(BANNER_KEY) === '1'; } catch (e) {}

        if (!warnings.length || hidden) {
            if (existing) existing.remove();
            return;
        }

        const level = warnings.some(w => w.level === 'danger') ? 'danger'
            : warnings.some(w => w.level === 'warn') ? 'warn' : 'notice';

        const banner = existing || document.createElement('div');
        banner.id = 'mpg-warning-banner';
        banner.className = 'mpg-banner mpg-banner-' + level;
        banner.innerHTML = '';

        const head = document.createElement('div');
        head.className = 'mpg-banner-head';
        const heading = document.createElement('span');
        heading.textContent = level === 'notice' ? 'Attention aux absences' : 'Absences : tu es en risque';
        head.appendChild(heading);

        const close = document.createElement('span');
        close.className = 'mpg-banner-close';
        close.textContent = '✕';
        close.title = 'Masquer jusqu\'à la prochaine ouverture de la page';
        close.onclick = () => {
            try { sessionStorage.setItem(BANNER_KEY, '1'); } catch (e) {}
            banner.remove();
        };
        head.appendChild(close);
        banner.appendChild(head);

        for (const w of warnings) {
            const item = document.createElement('div');
            item.className = 'mpg-banner-item mpg-banner-item-' + w.level;
            const t = document.createElement('strong');
            t.textContent = w.title;
            const d = document.createElement('div');
            d.className = 'mpg-banner-detail';
            d.textContent = w.detail;
            item.appendChild(t);
            item.appendChild(d);
            banner.appendChild(item);
        }

        const src = document.createElement('div');
        src.className = 'mpg-banner-src';
        src.textContent = "Règlement intérieur, art. 4 « Conséquences des absences ». Décompte du semestre affiché uniquement — l'administration et ses documents font toujours foi.";
        banner.appendChild(src);

        if (!existing) document.body.appendChild(banner);
    }

    function formatNumber(n, digits=2) {
        if (n === null || n === undefined) return '-';
        return Number(n).toFixed(digits).replace('.', ',');
    }

    // Pour les compteurs et les coefs : pas de décimales inutiles ("27" et pas "27,00")
    function formatLoose(n) {
        if (n === null || n === undefined || !Number.isFinite(Number(n))) return '-';
        const v = Math.round(Number(n) * 100) / 100;
        if (Number.isInteger(v)) return String(v);
        return String(v).replace('.', ',');
    }

    function markClass(v) {
        if (!Number.isFinite(v)) return null;
        if (Math.abs(v - 10) < 1e-6) return 'mpg-mark-yellow';
        if (v > 10 && v <= 20) return 'mpg-mark-good';
        if (v >= 0 && v < 10) return 'mpg-mark-bad';
        return null;
    }

    function applyColoring(stats) {
        if (!stats) return;
        // Clear any previous coloring/avg column before applying
        clearColoring(stats);

        const table = stats.table;
        const thead = table.querySelector('thead');
        if (thead && !thead.querySelector('.mpg-avg-header')) {
            const th = document.createElement('th');
            th.className = 'mpg-avg-header ui-state-default';
            th.style.textAlign = 'center';
            th.textContent = 'Moy.';
            thead.querySelector('tr').appendChild(th);
        }

        for (const course of stats.courses) {
            for (const m of course.marks) {
                const cls = markClass(Number(m.value));
                if (cls) m.cell.classList.add(cls);
            }
            const avgTd = document.createElement('td');
            avgTd.className = 'mpg-course-avg-cell';
            avgTd.style.textAlign = 'center';
            avgTd.style.fontWeight = '600';
            avgTd.textContent = course.avg !== null ? formatNumber(course.avg,2) : '';
            if (course.avg !== null) {
                const cls = markClass(Number(course.avg));
                if (cls) avgTd.classList.add(cls);
            }
            course.row.appendChild(avgTd);
        }
    }

    function clearColoring(stats) {
        if (!stats) return;
        for (const course of stats.courses) {
            course.marks.forEach(m => {
                m.cell.classList.remove('mpg-mark-good','mpg-mark-bad','mpg-mark-yellow');
            });
            const existingAvgCell = course.row.querySelector('.mpg-course-avg-cell');
            if (existingAvgCell) existingAvgCell.remove();
        }
        const table = stats.table;
        const thead = table.querySelector('thead');
        if (thead) {
            const avgHeader = thead.querySelector('.mpg-avg-header');
            if (avgHeader) avgHeader.remove();
        }
    }

    // Seules les absences non justifiées sont marquées : une absence justifiée
    // n'a rien à signaler.
    function applyMissingColoring(missings) {
        if (!missings) return;
        clearMissingColoring(missings);
        for (const e of missings.entries) {
            if (!e.justified) e.cell.classList.add('mpg-abs-bad');
        }
    }

    function clearMissingColoring(missings) {
        if (!missings) return;
        for (const e of missings.entries) e.cell.classList.remove('mpg-abs-bad');
    }

    function buildChart(stats) {
        try {
            const container = document.createElement('div');
            container.className = 'mpg-chart-container';

            const title = document.createElement('div');
            title.className = 'mpg-chart-title';
            title.textContent = 'Moyennes par matière';
            container.appendChild(title);

            const flexContainer = document.createElement('div');
            flexContainer.className = 'mpg-chart-flex';

            const yAxis = document.createElement('div');
            yAxis.className = 'mpg-y-axis';
            [0, 5, 10, 15, 20].forEach(n => {
                const span = document.createElement('span');
                span.textContent = n;
                yAxis.appendChild(span);
            });
            flexContainer.appendChild(yAxis);

            const scrollArea = document.createElement('div');
            scrollArea.className = 'mpg-scroll-area';

            const barsContainer = document.createElement('div');
            barsContainer.className = 'mpg-bars-container';

            const validCourses = stats.courses.filter(c => c.avg !== null);

            if (validCourses.length === 0) {
                const msg = document.createElement('div');
                msg.className = 'mpg-small';
                msg.textContent = 'Aucune moyenne disponible';
                container.appendChild(msg);
                return container;
            }

            validCourses.forEach(c => {
                const wrapper = document.createElement('div');
                wrapper.className = 'mpg-bar-wrapper';

                const barArea = document.createElement('div');
                barArea.className = 'mpg-bar-area';

                const bar = document.createElement('div');
                bar.className = 'mpg-bar';
                const val = Math.max(0, Math.min(20, c.avg));
                const heightPx = (val / 20) * 100;
                bar.style.height = heightPx + 'px';
                bar.setAttribute('data-val', formatNumber(c.avg, 1));

                if (Math.abs(c.avg - 10) < 1e-6) {
                    bar.style.background = '#f1c40f';
                } else if (c.avg > 10) {
                    bar.style.background = '#2ecc71';
                } else {
                    bar.style.background = '#e74c3c';
                }

                barArea.appendChild(bar);

                const label = document.createElement('div');
                label.className = 'mpg-bar-label';
                let shortName = (c.name || '').replace(/^[A-Z0-9]+\s-\s/, '');
                if (shortName.length > 8) shortName = shortName.substring(0, 8) + '..';
                label.textContent = shortName;
                label.title = c.name;

                wrapper.appendChild(barArea);
                wrapper.appendChild(label);
                barsContainer.appendChild(wrapper);
            });

            // Repère de la moyenne pondérée. Le bas de la zone des barres est à
            // 20px du bas du conteneur (hauteur du label), d'où l'offset.
            if (stats.weightedAvg !== null && Number.isFinite(Number(stats.weightedAvg))) {
                const line = document.createElement('div');
                line.className = 'mpg-avg-line';
                const v = Math.max(0, Math.min(20, Number(stats.weightedAvg)));
                line.style.bottom = (20 + (v / 20) * 100) + 'px';
                line.setAttribute('data-val', 'moy. ' + formatNumber(stats.weightedAvg, 2));
                barsContainer.appendChild(line);
            }

            scrollArea.appendChild(barsContainer);
            flexContainer.appendChild(scrollArea);
            container.appendChild(flexContainer);
            return container;
        } catch (e) {
            console.error('mpg: chart error', e);
            return document.createElement('div');
        }
    }

    /* ---------- petit message éphémère ---------- */

    // Se place juste au-dessus du panneau pour ne pas le recouvrir, où qu'il
    // ait été déplacé, et disparaît tout seul au bout de 10 s.
    function showToast(text, ms) {
        const old = document.getElementById('mpg-toast');
        if (old) old.remove();

        const el = document.createElement('div');
        el.id = 'mpg-toast';
        el.className = 'mpg-toast';
        el.textContent = text;
        document.body.appendChild(el);

        const panel = document.getElementById('mpg-stats-panel');
        const above = panel ? window.innerHeight - panel.getBoundingClientRect().top + 8 : 0;
        el.style.bottom = Math.max(12, above) + 'px';

        requestAnimationFrame(() => el.classList.add('mpg-toast-in'));
        setTimeout(() => {
            el.classList.remove('mpg-toast-in');
            setTimeout(() => el.remove(), 300);
        }, ms || 10000);
    }

    /* ---------- sélection du semestre ---------- */

    // L'id du conteneur JSF (j_idt171) est généré, il change d'un déploiement à
    // l'autre : on cible par le suffixe, jamais par l'id complet.
    function findPeriodSelect() {
        return document.querySelector('select[id$=":periodSelect_input"]');
    }

    function findPeriodWidget() {
        if (typeof PrimeFaces === 'undefined' || !PrimeFaces.widgets) return null;
        for (const key of Object.keys(PrimeFaces.widgets)) {
            const w = PrimeFaces.widgets[key];
            if (w && typeof w.selectValue === 'function' && typeof w.id === 'string' && w.id.endsWith(':periodSelect')) return w;
        }
        return null;
    }

    function selectPeriod(value) {
        const w = findPeriodWidget();
        if (!w) return false;
        try {
            w.selectValue(value);
            return true;
        } catch (e) {
            console.error('mpg: selectPeriod', e);
            return false;
        }
    }

    // Changer de semestre passe par un appel AJAX de PrimeFaces : la page n'est
    // pas rechargée, ces trois variables suffisent et repartent de zéro à
    // chaque vraie ouverture de page. En sessionStorage elles survivraient au
    // rechargement et la recherche ne se relancerait plus jamais.
    let periodTried = [];
    let periodLock = false;
    let periodSwitchLabel = null;

    function lockPeriod() {
        periodLock = true;
    }

    function markTried(value) {
        if (periodTried.indexOf(value) === -1) periodTried.push(value);
    }

    // myGES liste déjà les semestres du plus récent au plus ancien, mais on ne
    // s'y fie pas : on trie sur l'année et le numéro lus dans le libellé, et
    // l'ordre du <select> ne sert que de départage.
    function periodsNewestFirst(sel) {
        return Array.from(sel.options).map((o, i) => {
            const label = (o.textContent || '').trim();
            return {
                value: o.value,
                label,
                year: parseInt((label.match(/(\d{4})-\d{4}/) || [])[1], 10) || 0,
                sem: parseInt((label.match(/semestre\s*(\d+)/i) || [])[1], 10) || 0,
                index: i
            };
        }).sort((a, b) => (b.year - a.year) || (b.sem - a.sem) || (a.index - b.index));
    }

    // myGES ouvre souvent sur un semestre vide (celui à venir). On redescend
    // alors la liste du plus récent au plus ancien — S2, puis S1, etc. — jusqu'à
    // en trouver un qui a des notes. Chaque semestre visité est marqué, donc si
    // le suivant est vide lui aussi on continue au lieu de faire des allers-retours.
    function maybeAutoSwitch(stats) {
        if (!stats || stats.allMarks.length > 0) return false;
        if (periodLock) return false;

        const sel = findPeriodSelect();
        if (!sel || sel.options.length < 2) return false;

        const current = sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex] : null;
        if (current) markTried(current.value);

        const next = periodsNewestFirst(sel).find(p => periodTried.indexOf(p.value) === -1);
        if (!next) {
            // aucun semestre n'a de notes : on arrête de chercher
            lockPeriod();
            return false;
        }

        markTried(next.value);
        periodSwitchLabel = next.label;
        if (DEBUG) console.debug('mpg: semestre vide, on essaie', next.label);
        return selectPeriod(next.value);
    }

    // Affiché une fois arrivé sur un semestre qui a des notes, pour que le
    // changement de semestre ne passe pas pour un bug de myGES.
    function consumeSwitchMessage() {
        const label = periodSwitchLabel;
        periodSwitchLabel = null;
        if (!label) return;

        const sel = findPeriodSelect();
        const current = sel && sel.selectedIndex >= 0 ? (sel.options[sel.selectedIndex].textContent || '').trim() : '';
        // si l'utilisateur a changé de semestre entre-temps, le message n'a plus lieu d'être
        if (current !== label) return;

        showToast(`Ce semestre était vide : affichage de ${shortPeriodLabel(label)}.`);
    }

    function shortPeriodLabel(label) {
        const year = (label.match(/\d{4}-\d{4}/) || [''])[0];
        const sem = (label.match(/semestre\s*\d+/i) || [''])[0];
        const short = [year, sem].filter(Boolean).join(' · ');
        return short || label;
    }

    // Le sélecteur natif est tout en haut de page : on en remet un dans le panneau.
    function buildPeriodRow() {
        const sel = findPeriodSelect();
        if (!sel || sel.options.length < 2) return null;

        const wrap = document.createElement('div');
        wrap.className = 'mpg-period';

        const mine = document.createElement('select');
        mine.className = 'mpg-period-select';
        Array.from(sel.options).forEach(o => {
            const opt = document.createElement('option');
            opt.value = o.value;
            opt.textContent = shortPeriodLabel((o.textContent||'').trim());
            opt.title = (o.textContent||'').trim();
            opt.selected = o.selected;
            mine.appendChild(opt);
        });

        mine.addEventListener('change', () => {
            // choix explicite : on n'écrase plus la sélection de l'utilisateur
            lockPeriod();
            selectPeriod(mine.value);
        });

        wrap.appendChild(mine);
        return wrap;
    }

    /* ---------- vérification de mise à jour ---------- */

    function compareVersions(a, b) {
        const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
        const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
        const len = Math.max(pa.length, pb.length);
        for (let i = 0; i < len; i++) {
            const da = pa[i] || 0, db = pb[i] || 0;
            if (da !== db) return da > db ? 1 : -1;
        }
        return 0;
    }

    function readUpdateState() {
        try { return JSON.parse(localStorage.getItem(UPDATE_KEY) || 'null'); } catch (e) { return null; }
    }

    // Une requête par jour maximum, le résultat est mis en cache entre-temps.
    function checkForUpdate() {
        const state = readUpdateState();
        const now = Date.now();
        if (state && state.checkedAt && (now - state.checkedAt) < UPDATE_INTERVAL) return;

        fetch(RAW_URL, {cache: 'no-store'})
            .then(r => r.ok ? r.text() : Promise.reject(new Error('HTTP ' + r.status)))
            .then(text => {
                const m = text.match(/@version\s+([\w.-]+)/);
                if (!m) return;
                try {
                    localStorage.setItem(UPDATE_KEY, JSON.stringify({checkedAt: Date.now(), latest: m[1]}));
                } catch (e) {}
                if (compareVersions(m[1], VERSION) > 0) scheduleRun(0, true);
            })
            .catch(e => {
                if (DEBUG) console.debug('mpg: update check failed', e);
                // on note quand même le passage pour ne pas réessayer à chaque rendu
                try {
                    localStorage.setItem(UPDATE_KEY, JSON.stringify({checkedAt: Date.now(), latest: null}));
                } catch (err) {}
            });
    }

    function buildUpdateRow() {
        const state = readUpdateState();
        if (!state || !state.latest) return null;
        if (compareVersions(state.latest, VERSION) <= 0) return null;

        const a = document.createElement('a');
        a.className = 'mpg-update';
        a.href = INSTALL_URL;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = `Version ${state.latest} dispo (tu es en ${VERSION}) — mettre à jour`;
        return a;
    }

    /* ---------- panneau ---------- */

    function toggleMinimize(panel, btn) {
        panel.classList.toggle('mpg-minimized');
        if (btn) btn.textContent = panel.classList.contains('mpg-minimized') ? '+' : '−';
    }

    function clampPos(panel, pos) {
        const w = panel.offsetWidth || 220;
        const h = panel.offsetHeight || 100;
        return {
            left: Math.min(Math.max(0, pos.left), Math.max(0, window.innerWidth - w)),
            top: Math.min(Math.max(0, pos.top), Math.max(0, window.innerHeight - h))
        };
    }

    function movePanel(panel, pos) {
        const c = clampPos(panel, pos);
        panel.style.left = c.left + 'px';
        panel.style.top = c.top + 'px';
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        return c;
    }

    function applyStoredPos(panel) {
        let pos = null;
        try { pos = JSON.parse(localStorage.getItem(POS_KEY) || 'null'); } catch (e) {}
        if (!pos || typeof pos.left !== 'number' || typeof pos.top !== 'number') return;
        movePanel(panel, pos);
    }

    // Le panneau se posait sur la colonne Moy. : on peut le déplacer, la
    // position est retenue. Un clic sans déplacement réduit toujours le panneau.
    function makeDraggable(panel, handle, btn) {
        let startX = 0, startY = 0, baseLeft = 0, baseTop = 0;
        let dragging = false, moved = false;

        const onMove = (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (!moved && (Math.abs(dx) + Math.abs(dy)) < 4) return;
            moved = true;
            movePanel(panel, {left: baseLeft + dx, top: baseTop + dy});
            e.preventDefault();
        };

        const onUp = () => {
            if (!dragging) return;
            dragging = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            panel.classList.remove('mpg-dragging');
            if (moved) {
                try {
                    localStorage.setItem(POS_KEY, JSON.stringify({
                        left: parseInt(panel.style.left, 10) || 0,
                        top: parseInt(panel.style.top, 10) || 0
                    }));
                } catch (e) {}
            }
        };

        handle.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            const rect = panel.getBoundingClientRect();
            startX = e.clientX; startY = e.clientY;
            baseLeft = rect.left; baseTop = rect.top;
            dragging = true; moved = false;
            panel.classList.add('mpg-dragging');
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });

        handle.addEventListener('click', (e) => {
            if (moved) { moved = false; e.stopPropagation(); return; }
            toggleMinimize(panel, btn);
        });
    }

    let infoOpen = false;

    function closeInfo() {
        if (!infoOpen) return;
        infoOpen = false;
        scheduleRun(0, true);
    }

    function statsRow(label, value) {
        const div = document.createElement('div');
        div.className = 'mpg-stats-row';
        const left = document.createElement('div');
        left.textContent = label;
        const right = document.createElement('div');
        right.textContent = value;
        div.appendChild(left);
        div.appendChild(right);
        return div;
    }

    // Le barème complet, généré depuis ABS_SCALE pour rester d'accord avec les
    // alertes.
    function buildScaleBox() {
        const box = document.createElement('div');
        box.className = 'mpg-info-box';

        const head = document.createElement('div');
        head.className = 'mpg-info-head';

        const title = document.createElement('h5');
        title.textContent = 'Barème des absences';
        head.appendChild(title);

        const close = document.createElement('span');
        close.className = 'mpg-info-close';
        close.textContent = '✕';
        close.title = 'Fermer (Échap)';
        close.onclick = (e) => {
            e.stopPropagation();
            closeInfo();
        };
        head.appendChild(close);
        box.appendChild(head);

        const intro = document.createElement('div');
        intro.className = 'mpg-info-src';
        intro.textContent = "Absences non justifiées, sauf mention contraire. Le compteur ne calcule que les seuils du semestre : les lignes « dans une matière » et « sur l'année » sont là pour information.";
        box.appendChild(intro);

        for (const rule of ABS_SCALE) {
            const row = document.createElement('div');
            row.className = 'mpg-info-row';

            const n = document.createElement('span');
            n.className = 'mpg-info-n';
            n.textContent = rule.label + ' : ';

            row.appendChild(n);
            row.appendChild(document.createTextNode(rule.sanction));
            box.appendChild(row);
        }

        const src = document.createElement('div');
        src.className = 'mpg-info-src';
        src.textContent = "Règlement intérieur, art. 4 « Conséquences des absences ». Le compteur ne suit que le semestre affiché. L'administration et ses documents font toujours foi.";
        box.appendChild(src);

        return box;
    }

    function buildPanel(stats, missings) {
        let panel = document.getElementById('mpg-stats-panel');
        const isNew = !panel;
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'mpg-stats-panel';
            panel.className = 'mpg-stats-panel';
            document.body.appendChild(panel);
        }

        // Save minimized state
        const isMinimized = panel.classList.contains('mpg-minimized');

        panel.innerHTML = '';
        const h = document.createElement('h4');
        h.textContent = 'MyPrettyGradES';

        const minBtn = document.createElement('span');
        minBtn.className = 'mpg-minimize-btn';
        minBtn.textContent = isMinimized ? '+' : '−';
        minBtn.onclick = (e) => {
            e.stopPropagation();
            toggleMinimize(panel, minBtn);
        };
        h.appendChild(minBtn);

        makeDraggable(panel, h, minBtn);
        panel.appendChild(h);

        const content = document.createElement('div');
        content.className = 'mpg-stats-content';

        const rows = [];
        rows.push(['Nombre de notes', formatLoose(stats.allMarks.length)]);
        rows.push(['Moyenne (pondérée)', stats.weightedAvg !== null ? formatNumber(stats.weightedAvg,2) : '-']);
        rows.push(['Min', stats.min !== null ? formatNumber(stats.min,2) : '-']);
        rows.push(['Max', stats.max !== null ? formatNumber(stats.max,2) : '-']);
        rows.push(['Écart-type', stats.stddev !== null ? formatNumber(stats.stddev,2) : '-']);

        for (const r of rows) {
            content.appendChild(statsRow(r[0], r[1]));
        }

        if (missings && missings.entries.length) {
            const title = document.createElement('div');
            title.className = 'mpg-section';
            title.textContent = 'Absences et retards';
            content.appendChild(title);

            const absLabel = missings.absencesUnjustified
                ? `${missings.absences} (${missings.absencesUnjustified} non justifiée${missings.absencesUnjustified > 1 ? 's' : ''})`
                : String(missings.absences);
            const lateLabel = missings.latesUnjustified
                ? `${missings.lates} (${missings.latesUnjustified} non justifié${missings.latesUnjustified > 1 ? 's' : ''})`
                : String(missings.lates);

            content.appendChild(statsRow('Absences', absLabel));
            content.appendChild(statsRow('Retards', lateLabel));

            const next = nextSanction(missings);
            if (next) {
                const row = statsRow(
                    'Avant 1re sanction',
                    next.remaining > 0 ? String(next.remaining) : 'seuil dépassé'
                );
                row.title = next.detail;

                const info = document.createElement('span');
                info.className = 'mpg-info-btn';
                info.textContent = 'i';
                info.title = 'Voir le barème du règlement';
                info.onclick = (e) => {
                    e.stopPropagation();
                    infoOpen = !infoOpen;
                    scheduleRun(0, true);
                };
                row.firstChild.appendChild(info);

                content.appendChild(row);
                if (infoOpen) content.appendChild(buildScaleBox());
            }
        }

        if (stats.courses.some(c => c.avg !== null)) {
            content.appendChild(buildChart(stats));
        }

        const periodRow = buildPeriodRow();
        if (periodRow) content.appendChild(periodRow);

        // Switch to enable/disable coloring (persistent)
        const switchRow = document.createElement('div');
        switchRow.className = 'mpg-switch';
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.id = 'mpg-colors-toggle';
        chk.checked = colorsEnabled();
        const lbl = document.createElement('label');
        lbl.htmlFor = chk.id;
        lbl.textContent = chk.checked ? 'Couleurs: activées' : 'Couleurs: désactivées';
        chk.addEventListener('change', () => {
            localStorage.setItem(COLORS_KEY, chk.checked ? '1' : '0');
            scheduleRun(0, true);
        });
        switchRow.appendChild(chk);
        switchRow.appendChild(lbl);
        content.appendChild(switchRow);

        const note = document.createElement('div');
        note.className = 'mpg-small';
        note.textContent = 'Vert : > 10 • Jaune : = 10 • Rouge : < 10';
        content.appendChild(note);

        const updateRow = buildUpdateRow();
        if (updateRow) content.appendChild(updateRow);

        panel.appendChild(content);

        if (isMinimized) panel.classList.add('mpg-minimized');
        if (isNew) applyStoredPos(panel);
    }

    /* ---------- boucle de rendu ---------- */

    let rendering = false;
    let pending = null;
    let lastSignature = null;

    // Signature du contenu réel des tables, hors cellules ajoutées par le script :
    // sans ça l'observer réagit à nos propres écritures et on repart en boucle.
    function pageSignature() {
        const parts = [];
        const marks = findTableContainer();
        if (marks) {
            const tbody = marks.querySelector('tbody') || marks;
            for (const r of tbody.querySelectorAll('tr')) {
                parts.push(Array.from(r.querySelectorAll('td'))
                    .filter(td => !td.classList.contains('mpg-course-avg-cell'))
                    .map(td => (td.textContent||'').trim()).join('|'));
            }
        }
        const missings = findMissingsTable();
        if (missings) {
            const tbody = missings.querySelector('tbody') || missings;
            for (const r of tbody.querySelectorAll('tr')) {
                parts.push(Array.from(r.querySelectorAll('td')).map(td => (td.textContent||'').trim()).join('|'));
            }
        }
        return parts.join('\n');
    }

    function runOnce(force) {
        if (rendering) return;
        const signature = pageSignature();
        if (!force && signature === lastSignature && document.getElementById('mpg-stats-panel')) return;

        rendering = true;
        observer.disconnect();
        try {
            lastSignature = signature;
            addStyles();

            const stats = computeStats();
            if (!stats) return;

            if (maybeAutoSwitch(stats)) return;
            // on tient un semestre qui a des notes : on arrête de chercher
            if (stats.allMarks.length > 0) lockPeriod();

            const missings = computeMissings();
            if (colorsEnabled()) {
                applyColoring(stats);
                applyMissingColoring(missings);
            } else {
                clearColoring(stats);
                clearMissingColoring(missings);
            }

            buildBanner(buildWarnings(missings));
            buildPanel(stats, missings);
            // après le panneau : le message se cale juste au-dessus de lui
            if (stats.allMarks.length > 0) consumeSwitchMessage();
        } catch (e) {
            console.error('mpg: render error', e);
        } finally {
            rendering = false;
            attachObserver();
        }
    }

    function scheduleRun(delay=300, force) {
        if (pending) clearTimeout(pending);
        pending = setTimeout(() => {
            pending = null;
            runOnce(force);
        }, delay);
    }

    const observer = new MutationObserver((mutations) => {
        // on ignore les mutations de nos propres éléments, sinon on se relance
        // nous-mêmes en boucle
        const relevant = mutations.some(m => {
            const t = m.target;
            return !(t && t.closest && t.closest('#mpg-stats-panel, #mpg-warning-banner, #mpg-toast'));
        });
        if (relevant) scheduleRun(400);
    });

    const attachObserver = () => {
        if (!document.body) return;
        observer.disconnect();
        observer.observe(document.body, {childList: true, subtree: true});
    };

    // des versions intermédiaires gardaient un historique d'absences et le
    // dernier semestre consulté : on ne stocke plus rien de tout ça, tout est
    // relu dans la page à chaque fois
    try {
        localStorage.removeItem('mpg_absences');
        localStorage.removeItem('mpg_last_period');
    } catch (e) {}

    // le barème se ferme aussi avec Échap ou un clic à côté : le bouton "i"
    // seul, c'est une cible de 15px à retrouver. Écouteurs posés une fois pour
    // toutes, pas à chaque rendu.
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeInfo();
    });
    document.addEventListener('click', (e) => {
        if (!infoOpen) return;
        const t = e.target;
        if (t && t.closest && t.closest('.mpg-info-box, .mpg-info-btn')) return;
        closeInfo();
    });

    scheduleRun(600);
    attachObserver();
    checkForUpdate();

})();
