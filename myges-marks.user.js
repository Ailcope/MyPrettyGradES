// ==UserScript==
// @name         MyPrettyGradES
// @namespace    http://tampermonkey.net/
// @version      0.7
// @author       Ailcope
// @match        https://myges.fr/student/marks
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const FALLBACK_XPATH = '/html/body/div[3]/div[2]/div[3]/div/form[2]/div[4]/div[2]';

    const STYLE_ID = 'mpg-stats-styles';
    const DEBUG = !!(window.MPG_DEBUG || localStorage.getItem('mpg_debug') === '1');

    function addStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = `
            .mpg-stats-panel{position:fixed;right:12px;bottom:12px;z-index:99999;background:#fff;border:1px solid #ddd;padding:10px;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,0.12);font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#222;min-width:220px;max-width:400px;transition:transform 0.3s ease-in-out}
            .mpg-stats-panel.mpg-minimized{transform:translateY(calc(100% - 40px));overflow:hidden;min-width:auto;width:180px}
            .mpg-stats-panel h4{margin:0 0 6px 0;font-size:14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer}
            .mpg-stats-content{transition:opacity 0.2s}
            .mpg-minimized .mpg-stats-content{opacity:0;pointer-events:none}
            .mpg-minimize-btn{font-size:18px;line-height:1;color:#888;cursor:pointer;user-select:none}
            .mpg-stats-row{display:flex;justify-content:space-between;margin:4px 0}
            .mpg-mark-good{background:rgba(46,204,113,0.9) !important;color:#072a00 !important;font-weight:700 !important}
            .mpg-mark-bad{background:rgba(231,76,60,0.9) !important;color:#3b0000 !important;font-weight:700 !important}
            .mpg-mark-yellow{background:rgba(241,196,15,0.9) !important;color:#4a2b00 !important;font-weight:700 !important}
            .mpg-toggle-btn{display:inline-block;padding:4px 8px;border-radius:6px;border:1px solid #ccc;background:#f7f7f7;cursor:pointer;margin-top:6px;width:100%;text-align:center;box-sizing:border-box}
            .mpg-small{font-size:12px;color:#666;margin-top:4px;text-align:center}
            
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
                display: flex; height: 100%; 
                background: linear-gradient(to top, #eee 1px, transparent 1px);
                background-size: 100% 25px;
                background-position: 0 10px;
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

    function findTableContainer() {
        const table = document.getElementById('marksForm:marksWidget:coursesTable');
        if (table) return table;
        const tbody = document.getElementById('marksForm:marksWidget:coursesTable_data');
        if (tbody) return tbody.closest('table') || tbody;
        try {
            const res = document.evaluate(FALLBACK_XPATH, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            if (res && res.singleNodeValue) {
                return res.singleNodeValue.querySelector('table') || res.singleNodeValue;
            }
        } catch (e) {}
        const tables = Array.from(document.querySelectorAll('table'));
        for (const t of tables) {
            const headers = t.querySelectorAll('th .ui-column-title, th');
            const titles = Array.from(headers).map(h => (h.textContent||'').trim().toLowerCase());
            if (titles.includes('matière') && (titles.includes('coef.') || titles.includes('coef'))) return t;
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
        let totalECTS = 0;

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
                for (let i = 0; i < tds.length; i++) {
                    if (!markCols.has(i)) continue;
                    const cell = tds[i];
                    const txt = (cell && cell.textContent) ? cell.textContent : '';
                    const n = parseNumber(txt);
                    if (n !== null) {
                        marks.push({value: n, cell: cell});
                        allMarks.push(n);
                    }
                }

                if (DEBUG && marks.length) console.debug('mpg: row', rowIndex, 'marks', marks.map(m=>m.value));

                const avg = marks.length ? (marks.reduce((s,m)=>s+m.value,0)/marks.length) : null;
                if (avg !== null) {
                    totalWeighted += avg * coef;
                    sumCoef += coef;
                }
                totalECTS += ects;
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

        return {table, tbody, rows, courses, allMarks, simpleAvg, weightedAvg, min, max, stddev, sumCoef, totalECTS};
    }

    function formatNumber(n, digits=2) {
        if (n === null || n === undefined) return '-';
        return Number(n).toFixed(digits).replace('.', ',');
    }

    function applyColoring(stats) {
        if (!stats) return;
        stats.courses.forEach(course => {
            course.marks.forEach(m => {
                m.cell.classList.remove('mpg-mark-good','mpg-mark-bad','mpg-mark-yellow');
            });
            const existingAvgCell = course.row.querySelector('.mpg-course-avg-cell');
            if (existingAvgCell) existingAvgCell.remove();
        });

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
                const v = Number(m.value);
                if (Number.isFinite(v)) {
                    if (Math.abs(v - 10) < 1e-6) {
                        m.cell.classList.add('mpg-mark-yellow');
                    } else if (v > 10 && v <= 20) {
                        m.cell.classList.add('mpg-mark-good');
                    } else if (v >= 0 && v < 10) {
                        m.cell.classList.add('mpg-mark-bad');
                    }
                }
            }
            const avgTd = document.createElement('td');
            avgTd.className = 'mpg-course-avg-cell';
            avgTd.style.textAlign = 'center';
            avgTd.style.fontWeight = '600';
            avgTd.textContent = course.avg !== null ? formatNumber(course.avg,2) : '';
            if (course.avg !== null) {
                const av = Number(course.avg);
                if (Math.abs(av - 10) < 1e-6) {
                    avgTd.classList.add('mpg-mark-yellow');
                } else if (av > 10 && av <= 20) {
                    avgTd.classList.add('mpg-mark-good');
                } else if (av >= 0 && av < 10) {
                    avgTd.classList.add('mpg-mark-bad');
                }
            }
            course.row.appendChild(avgTd);
        }
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

            scrollArea.appendChild(barsContainer);
            flexContainer.appendChild(scrollArea);
            container.appendChild(flexContainer);
            return container;
        } catch (e) {
            console.error('mpg: chart error', e);
            return document.createElement('div');
        }
    }

    function buildPanel(stats) {
        let panel = document.getElementById('mpg-stats-panel');
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
            panel.classList.toggle('mpg-minimized');
            minBtn.textContent = panel.classList.contains('mpg-minimized') ? '+' : '−';
        };
        h.appendChild(minBtn);
        
        // Allow clicking header to toggle
        h.onclick = () => {
            panel.classList.toggle('mpg-minimized');
            minBtn.textContent = panel.classList.contains('mpg-minimized') ? '+' : '−';
        };
        
        panel.appendChild(h);

        const content = document.createElement('div');
        content.className = 'mpg-stats-content';

        const rows = [];
        rows.push(['Nombre de notes', stats.allMarks.length]);
        rows.push(['Moyenne (simple)', stats.simpleAvg !== null ? formatNumber(stats.simpleAvg,2) : '-']);
        rows.push(['Moyenne (pondérée)', stats.weightedAvg !== null ? formatNumber(stats.weightedAvg,2) : '-']);
        rows.push(['Min', stats.min !== null ? formatNumber(stats.min,2) : '-']);
        rows.push(['Max', stats.max !== null ? formatNumber(stats.max,2) : '-']);
        rows.push(['Écart-type', stats.stddev !== null ? formatNumber(stats.stddev,2) : '-']);
        rows.push(['Somme des coefficients', stats.sumCoef ? stats.sumCoef : '-']);
        rows.push(['Total ECTS', stats.totalECTS ? stats.totalECTS : '-']);

        for (const r of rows) {
            const div = document.createElement('div');
            div.className = 'mpg-stats-row';
            const left = document.createElement('div'); left.textContent = r[0];
            const right = document.createElement('div'); right.textContent = (typeof r[1] === 'number') ? formatNumber(r[1],2) : r[1];
            div.appendChild(left); div.appendChild(right);
            content.appendChild(div);
        }

        if (stats.courses.some(c => c.avg !== null)) {
            content.appendChild(buildChart(stats));
        }

        const toggle = document.createElement('div');
        toggle.className = 'mpg-toggle-btn';
        toggle.textContent = 'Recalculer & Basculer couleurs';
        toggle.addEventListener('click', () => {
            const s = computeStats();
            applyColoring(s);
            buildPanel(s);
        });
        content.appendChild(toggle);

        const note = document.createElement('div');
        note.className = 'mpg-small';
        note.textContent = 'Vert: >= moyenne pondérée • Rouge: < moyenne pondérée';
        content.appendChild(note);

        panel.appendChild(content);
        
        if (isMinimized) {
            panel.classList.add('mpg-minimized');
        }
    }

    let lastRun = 0;
    function runOnce() {
        addStyles();
        const stats = computeStats();
        if (!stats) return;
        applyColoring(stats);
        buildPanel(stats);
    }

    function scheduleRun(delay=300) {
        const now = Date.now();
        if (now - lastRun < 500) return;
        lastRun = now;
        setTimeout(runOnce, delay);
    }

    scheduleRun(600);

    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.type === 'childList' || m.type === 'attributes') {
                scheduleRun(400);
                break;
            }
        }
    });

    const attachObserver = () => {
        const container = document.body;
        if (container) {
            observer.disconnect();
            observer.observe(container, {childList:true, subtree:true, attributes:true});
        }
    };

    attachObserver();

})();
