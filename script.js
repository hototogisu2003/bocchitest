/* -------------------------------------------------------
   サイドメニュー & モード切り替え
------------------------------------------------------- */
function toggleMenu() {
    const menu = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
}

function switchMainMode(mode) {
    const appContainer = document.getElementById('app-container');
    const manualContainer = document.getElementById('manual-container');
    const contactContainer = document.getElementById('contact-container'); // ★追加
    const footer = document.getElementById('footer-result');

    // メニューを閉じる
    toggleMenu();

    // 一旦すべて非表示にする
    appContainer.style.display = 'none';
    manualContainer.style.display = 'none';
    if(contactContainer) contactContainer.style.display = 'none';
    if(footer) footer.style.display = 'none'; // フッターも一旦隠す

    // 選ばれたモードだけ表示する
    if (mode === 'app') {
        appContainer.style.display = 'block';
        if(footer) footer.style.display = 'flex'; // 計算機モードのみフッター表示
    } else if (mode === 'manual') {
        manualContainer.style.display = 'block';
    } else if (mode === 'contact') {
        // ★追加: お問い合わせモード
        if(contactContainer) contactContainer.style.display = 'block';
    }
}

// --- ウォールブースト倍率定義 ---
const WALL_BOOST_DATA = {
    "1.5": { 1: 1.12, 2: 1.25, 3: 1.37, 4: 1.5 },
    "2.0": { 1: 1.25,  2: 1.5,  3: 1.75,  4: 2.0 },
    "2.5": { 1: 1.37, 2: 1.75, 3: 2.12, 4: 2.5 }
};

// 現在の攻撃モード ('direct' or 'friend')
let currentAttackMode = 'direct';
// 最終ダメージ
let currentFinalDamage = 0;

/* -------------------------------------------------------
   攻撃モード切り替え (直殴り <-> 友情)
------------------------------------------------------- */
function switchAttackMode() {
    const radios = document.getElementsByName('attackMode');
    for (const radio of radios) {
        if (radio.checked) {
            currentAttackMode = radio.value;
            break;
        }
    }

    // 表示切り替え
    const items = document.querySelectorAll('.grid-item');
    items.forEach(item => {
        const mode = item.getAttribute('data-mode');
        if (!mode) {
            item.style.display = 'flex'; // 共通
        } else if (mode === currentAttackMode) {
            item.style.display = 'flex'; // 専用
        } else {
            item.style.display = 'none'; // 非表示
        }
    });

    // ラベル等の書き換え
    const labelBase = document.getElementById('label-base-power');
    const labelAtk = document.getElementById('label-atk-val');
    const groupBonus = document.getElementById('group-bonus-atk'); // 加撃グループ
    const groupYuugeki = document.getElementById('group-yuugeki'); // 友撃グループ
    const groupGauge = document.getElementById('group-gauge');

    if (currentAttackMode === 'friend') {
        labelAtk.innerText = "友情威力";
        groupBonus.style.display = 'none';   // 加撃を隠す
        groupYuugeki.style.display = 'flex'; // 友撃を表示
        groupGauge.style.display = 'none';   // ゲージを隠す
    } else {
        labelAtk.innerText = "攻撃力";
        groupBonus.style.display = 'flex';   // 加撃を表示
        groupYuugeki.style.display = 'none'; // 友撃を隠す
        groupGauge.style.display = 'flex';   // ゲージを表示
    }

    calculate();
}

/* -------------------------------------------------------
   タブ切り替え処理
------------------------------------------------------- */
function switchTab(mode) {
    const viewCalc = document.getElementById('view-calc');
    const viewVerify = document.getElementById('view-verify');
    const btnCalc = document.getElementById('btn-tab-calc');
    const btnVerify = document.getElementById('btn-tab-verify');

    if (mode === 'calc') {
        viewCalc.style.display = 'block';
        viewVerify.style.display = 'none';
        btnCalc.classList.add('active');
        btnVerify.classList.remove('active');
    } else {
        viewCalc.style.display = 'none';
        viewVerify.style.display = 'block';
        btnCalc.classList.remove('active');
        btnVerify.classList.add('active');
        checkOneshot();
    }
}

/* -------------------------------------------------------
   入力欄の有効/無効を切り替える関数
------------------------------------------------------- */
function toggleInput(inputId, checkboxId) {
    const input = document.getElementById(inputId);
    const checkbox = document.getElementById(checkboxId);
    if (input && checkbox) {
        input.disabled = !checkbox.checked;
        calculate(); 
        if (typeof checkOneshot === 'function') checkOneshot();
    }
}

/* -------------------------------------------------------
   有利属性倍率の手入力欄切り替え
------------------------------------------------------- */
function toggleStageInput() {
    const select = document.getElementById('stageEffectSelect');
    const input = document.getElementById('customStageRate');
    if (select && input) {
        if (select.value === 'custom') {
            input.style.display = 'block';
            input.focus();
        } else {
            input.style.display = 'none';
        }
        calculate();
    }
}

/* -------------------------------------------------------
   ウォールブースト専用
------------------------------------------------------- */
function togglewboostInputs() {
    const checkbox = document.getElementById('chk_wboost');
    const grade = document.getElementById('wboostGrade');
    const val = document.getElementById('wboostVal');
    if (checkbox && grade && val) {
        const isDisabled = !checkbox.checked;
        grade.disabled = isDisabled;
        val.disabled = isDisabled;
        calculate();
    }
}

/* -------------------------------------------------------
   等級名の取得
   セレクトボックスのテキストから "M" "L" 等を抽出する
------------------------------------------------------- */
function getGradeSuffix(selectId) {
    const el = document.getElementById(selectId);
    if (!el) return "";
    
    // 現在選択されているオプションのテキストを取得 (例: "M (x2.0)")
    const text = el.options[el.selectedIndex].text;
    
    // スペースで区切って最初の部分を取得 ("M", "L", "無印" など)
    const grade = text.split(' ')[0];
    
    // "無印", "なし", "主友情" の場合は何も返さない
    if (grade.includes("無印") || grade.includes("なし") || grade.includes("主友情")) {
        return "";
    }
    
    // それ以外ならスペース＋等級名を返す (例: " M")
    return " " + grade;
}

/* -------------------------------------------------------
   フッター詳細の開閉
------------------------------------------------------- */
function toggleResultDetails() {
    const details = document.getElementById('result-details');
    const icon = document.getElementById('detail-toggle-icon');
    const box = document.getElementById('footer-result');

    if (details.style.display === 'none') {
        details.style.display = 'block';
        icon.innerText = '(▼ 閉じる)';
        box.classList.add('open');
    } else {
        details.style.display = 'none';
        icon.innerText = '(▲ 詳細)';
        box.classList.remove('open');
    }
}

/* -------------------------------------------------------
   ★新規追加：加撃プリセットの反映
   チェックボックスの状態に応じて入力欄の数値を増減させる
------------------------------------------------------- */
function updateBonus(amount, checkbox) {
    const input = document.getElementById('attackBonus');
    // 現在の入力値を取得（空なら0）
    let currentVal = parseInt(input.value) || 0;

    if (checkbox.checked) {
        currentVal += amount; // チェックONなら加算
    } else {
        currentVal -= amount; // チェックOFFなら減算
    }

    // 計算結果を入力欄に反映
    input.value = currentVal;
    
    // 全体の再計算を実行
    calculate();
}

/* -------------------------------------------------------
   計算メイン処理 (詳細ログ作成機能付きに書き換え)
------------------------------------------------------- */
function calculate() {
    let breakdown = [];

    // --- 攻撃力(威力)取得 ---
    const attackElem = document.getElementById('attack');
    let baseAttack = parseFloat(attackElem.value) || 0;
    let actualAttack = 0;

    // === 直殴りモード ===
    if (currentAttackMode === 'direct') {
        // 直殴り: ベース + 加撃 (入力欄の値をそのまま使う)
        const bonusElem = document.getElementById('attackBonus');
        const manualBonus = parseFloat(bonusElem.value) || 0;
        
        /* ★削除・変更点：
           以前ここにあった「presetBonus」の加算処理は削除しました。
           チェックボックスの値は「manualBonus（入力欄）」に含まれるようになったためです。
        */

        // 合計を算出
        actualAttack = baseAttack + manualBonus;
        
        // ログ記録
        breakdown.push({ name: "攻撃力", val: baseAttack.toLocaleString() });
        // 内訳表示もシンプルに入力欄の値のみを表示
        if (manualBonus > 0) breakdown.push({ name: "加撃", val: "+" + manualBonus.toLocaleString() });
    }


    
    else {
        const yuugekiVal = parseFloat(document.getElementById('friendYuugekiSelect').value) || 1.0;
        actualAttack = Math.floor(baseAttack * yuugekiVal);
        
        // 友撃の等級を取得して表示名に追加
        const yuugekiSuffix = getGradeSuffix('friendYuugekiSelect');
        breakdown.push({ name: `友情コンボ威力 (×友撃${yuugekiSuffix})`, val: actualAttack.toLocaleString() });
    }

    let totalMultiplier = 1.0;

    // ヘルパー関数: 倍率適用とログ記録
    const apply = (name, rate) => {
        if (rate !== 1.0 && rate !== 0) {
            totalMultiplier *= rate;
            breakdown.push({ name: name, val: "x" + Math.round(rate * 10000) / 10000 });
        }
    };

    // === 直殴りモード ===
    if (currentAttackMode === 'direct') {
        const gaugeElem = document.getElementById('chk_gauge');
        if (gaugeElem && gaugeElem.checked) apply("ゲージ", 1.2);

        if (document.getElementById('chk_ab1').checked) apply("超ADW", 1.3);
        
        if (document.getElementById('chk_warp').checked) {
            const count = parseFloat(document.getElementById('warpCount').value) || 0;
            apply(`超AW (${count}個)`, 1 + (count * 0.05));
        }

        if (document.getElementById('chk_ms').checked) {
            apply("マインスイーパー" + getGradeSuffix('msSelect'), parseFloat(document.getElementById('msSelect').value) || 1.0);
        }

        if (document.getElementById('chk_soko').checked) {
            apply("底力" + getGradeSuffix('sokoSelect'), parseFloat(document.getElementById('sokoSelect').value) || 1.0);
        }

        if (document.getElementById('chk_wboost').checked) {
            const gradeKey = document.getElementById('wboostGrade').value;
            const valKey = document.getElementById('wboostVal').value;
            // 等級名を取得
            const gradeSuffix = getGradeSuffix('wboostGrade');
            
            if (WALL_BOOST_DATA[gradeKey] && WALL_BOOST_DATA[gradeKey][valKey]) {
                apply(`ウォールブースト${gradeSuffix}(${valKey}壁)`, WALL_BOOST_DATA[gradeKey][valKey]);
            }
        }

        if (document.getElementById('chk_mboost').checked) {
            apply("魔法陣ブースト" + getGradeSuffix('mboostSelect'), parseFloat(document.getElementById('mboostSelect').value) || 1.0);
        }

        if (document.getElementById('chk_ab2').checked) apply("渾身", 3.0);
        if (document.getElementById('chk_ab3').checked) apply("クリティカル", 7.5);
        if (document.getElementById('chk_ab4').checked) apply("超パワー型(初撃)", 1.2);

        if (document.getElementById('chk_pfield') && document.getElementById('chk_pfield').checked) {
            apply("パワーフィールド" + getGradeSuffix('pfieldSelect'), parseFloat(document.getElementById('pfieldSelect').value) || 1.0);
        }

        if (document.getElementById('chk_SS').checked) {
            apply("SS倍率1", parseFloat(document.getElementById('SSRate').value) || 1.0);
        }
        if (document.getElementById('chk_SS2').checked) {
            apply("SS倍率2", parseFloat(document.getElementById('SS2Rate').value) || 1.0);
        }

        if (document.getElementById('chk_naguri').checked) {
            apply("直殴り倍率", parseFloat(document.getElementById('naguriRate').value) || 1.0);
        }
    }

    // === 友情モード ===
    if (currentAttackMode === 'friend') {
        if (document.getElementById('chk_friend_boost').checked) {
            apply("友情ブースト" + getGradeSuffix('friendBoostSelect'), parseFloat(document.getElementById('friendBoostSelect').value) || 1.0);
        }
        
        if (document.getElementById('chk_friendhalf') && document.getElementById('chk_friendhalf').checked) {
            apply("誘発", 0.5);
        }

        if (document.getElementById('chk_friendsoko') && document.getElementById('chk_friendsoko').checked) {
             const sokoVal = document.getElementById('sokoSelect') ? document.getElementById('sokoSelect').value : 1.0;
             // 底力のIDと共用しているので、sokoSelectから等級名を取得
             apply("友情底力" + getGradeSuffix('sokoSelect'), parseFloat(sokoVal) || 1.0);
        }

        if (document.getElementById('chk_ffield') && document.getElementById('chk_ffield').checked) {
            apply("友情フィールド", 1.5);
        }

        if (document.getElementById('chk_friendbuff') && document.getElementById('chk_friendbuff').checked) {
            apply("友情バフ", parseFloat(document.getElementById('friendbuffRate').value) || 1.0);
        }

        if (document.getElementById('chk_yujo') && document.getElementById('chk_yujo').checked) {
            apply("友情倍率", parseFloat(document.getElementById('yujoRate').value) || 1.0);
        }
    }

    // === 共通 ===
    if (document.getElementById('chk_aura').checked) {
        apply("パワーオーラ" + getGradeSuffix('auraSelect'), parseFloat(document.getElementById('auraSelect').value) || 1.0);
    }
    if (document.getElementById('chk_hiyoko') && document.getElementById('chk_hiyoko').checked) {
        apply("ヒヨコ", 1/3);
    }
    if (document.getElementById('chk_killer').checked) {
        apply("キラー", parseFloat(document.getElementById('killerRate').value) || 1.0);
    }
    if (document.getElementById('chk_buff').checked) {
        apply("バフ", parseFloat(document.getElementById('buffRate').value) || 1.0);
    }
    if (document.getElementById('chk_guardian').checked) {
        apply("守護獣", parseFloat(document.getElementById('guardianRate').value) || 1.0);
    }
    if (document.getElementById('chk_other').checked) {
        apply("その他", parseFloat(document.getElementById('otherRate').value) || 1.0);
    }

    if (document.getElementById('chk_emb1').checked) apply("紋章(対属性)", 1.25);
    if (document.getElementById('chk_emb2').checked) apply("紋章(対弱)", 1.10);
    if (document.getElementById('chk_emb3').checked) apply("紋章(対将/兵)", 1.10);
    if (document.getElementById('chk_emb4').checked) apply("紋章(守護獣)", 1.08);

    if (document.getElementById('chk_weak').checked) {
        apply("弱点倍率", parseFloat(document.getElementById('weakRate').value) || 1.0);
    }
    if (document.getElementById('chk_hontai').checked) {
        apply("本体倍率", parseFloat(document.getElementById('hontaiRate').value) || 1.0);
    }
    if (document.getElementById('chk_def').checked) {
        apply("防御ダウン倍率", parseFloat(document.getElementById('defRate').value) || 1.0);
    }
    
    // 怒り倍率にも適用 (小、中、大)
    if (document.getElementById('chk_angry').checked) {
        apply("怒り倍率" + getGradeSuffix('angrySelect'), parseFloat(document.getElementById('angrySelect').value) || 1.0);
    }
    
    if (document.getElementById('chk_mine').checked) {
        apply("地雷倍率", parseFloat(document.getElementById('mineRate').value) || 1.0);
    }
    if (document.getElementById('chk_special').checked) {
        apply("特殊倍率", parseFloat(document.getElementById('specialRate').value) || 1.0);
    }

    // ステージ倍率
    const stageSelect = document.getElementById('stageEffectSelect');
    const customInput = document.getElementById('customStageRate');
    if (stageSelect) {
        let stageBase = 1.0;
        let rateName = "属性倍率";
        
        // セレクトボックスのテキストを取得して名前に反映（例: 属性効果超絶UP）
        if (stageSelect.value === 'custom') {
            stageBase = parseFloat(customInput.value) || 1.0;
            rateName = "属性倍率(手動)";
        } else {
            stageBase = parseFloat(stageSelect.value) || 1.0;
            // 選択中のテキストを取得 (例: "通常 (x1.33)" -> "通常")
            const text = stageSelect.options[stageSelect.selectedIndex].text;
            const label = text.split(' ')[0];
            if (label !== "なし") {
                rateName = "属性倍率(" + label + ")";
            }
        }

        let stageMultiplier = stageBase;
        if (document.getElementById('chk_stageSpecial').checked && stageBase !== 1.0) {
            let temp = ((stageBase - 1) / 0.33) * 0.596 + 1;
            stageMultiplier = Math.round(temp * 100000) / 100000;
            rateName = "超バランス型(" + rateName.replace("属性倍率", "").replace(/[()]/g, "") + ")";
        }
        
        apply(rateName, stageMultiplier);

        const displayElem = document.getElementById('stageRealRate');
        if (displayElem) displayElem.innerText = Math.floor(stageMultiplier * 100000) / 100000;
    }

    if (document.getElementById('chk_gimmick').checked) {
        apply("ギミック倍率", parseFloat(document.getElementById('gimmickRate').value) || 1.0);
    }

    // --- 最終計算 (微小値加算方式) ---
    const finalDamage = Math.floor((actualAttack * totalMultiplier) + 0.00001);
    
    currentFinalDamage = finalDamage;

    const resultElem = document.getElementById('result');
    if (resultElem) resultElem.innerText = currentFinalDamage.toLocaleString();

    const verifyDisplay = document.getElementById('verifyDamageDisplay');
    if (verifyDisplay) verifyDisplay.innerText = currentFinalDamage.toLocaleString();

    // 内訳リスト表示
    const listElem = document.getElementById('detail-list');
    if (listElem) {
        listElem.innerHTML = "";
        breakdown.forEach(item => {
            const li = document.createElement('li');
            li.className = 'detail-item';
            li.innerHTML = `<span class="detail-name">${item.name}</span><span class="detail-val">${item.val}</span>`;
            listElem.appendChild(li);
        });
        
        if (breakdown.length > 1) { 
             const li = document.createElement('li');
             li.className = 'detail-item';
             li.style.borderTop = "2px solid #ddd";
             li.style.marginTop = "5px";
             li.innerHTML = `<span class="detail-name" style="color:#000;">合計倍率(概算)</span><span class="detail-val">x${Math.round(totalMultiplier * 100) / 100}</span>`;
             listElem.appendChild(li);
        }
    }

    checkOneshot();
}

/* -------------------------------------------------------
   ワンパン判定ロジック
------------------------------------------------------- */
function checkOneshot() {
    const hpInput = document.getElementById('enemyHp');
    const judgeText = document.getElementById('judge-text');
    const resultBox = document.getElementById('verify-result-box');
    const realHpElem = document.getElementById('displayRealHp');

    if (!hpInput || !judgeText) return;

    const maxHp = parseFloat(hpInput.value);

    if (isNaN(maxHp) || maxHp <= 0) {
        judgeText.innerText = "HPを入力してください";
        resultBox.className = "result-box"; 
        if (realHpElem) realHpElem.innerText = "-";
        return;
    }

    let reduceRate = 0;
    const enableAB = document.getElementById('chk_enableAB');
    const selAB = document.getElementById('sel_reduceAB');

    if (enableAB && enableAB.checked && selAB) {
        reduceRate += parseFloat(selAB.value) || 0;
    }

    if (document.getElementById('chk_reduceC').checked) {
        reduceRate += 0.10;
    }

    const currentEnemyHp = Math.floor(maxHp * (1 - reduceRate));

    if (realHpElem) realHpElem.innerText = currentEnemyHp.toLocaleString();

    if (currentFinalDamage >= currentEnemyHp) {
        judgeText.innerHTML = `ワンパンできます`;
        resultBox.className = "result-box judge-success";
    } else {
        judgeText.innerHTML = `ワンパンできません`;
        resultBox.className = "result-box judge-fail";
    }
}

/* -------------------------------------------------------
   更新履歴の表示切り替え
------------------------------------------------------- */
function toggleHistory() {
    const log = document.getElementById('history-log');
    if (log) {
        log.style.display = (log.style.display === 'none') ? 'block' : 'none';
    }
}

document.addEventListener('click', function(event) {
    const log = document.getElementById('history-log');
    const bell = document.getElementById('bell-icon');
    if (log && bell && log.style.display === 'block') {
        if (!log.contains(event.target) && !bell.contains(event.target)) {
            log.style.display = 'none';
        }
    }
});

/* -------------------------------------------------------
   全入力リセット処理
------------------------------------------------------- */
function resetAll() {
    if (!confirm("入力内容をすべてリセットしますか？")) return;

    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => input.value = "");

    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(chk => chk.checked = false);

    const selects = document.querySelectorAll('select');
    selects.forEach(sel => sel.selectedIndex = 0);

    const dependentInputs = document.querySelectorAll('.category-section input[type="number"], .category-section select');
    dependentInputs.forEach(el => {
        if (el.id !== 'stageEffectSelect') el.disabled = true;
    });

    const customStageInput = document.getElementById('customStageRate');
    if (customStageInput) customStageInput.style.display = 'none';
    
    const realHpElem = document.getElementById('displayRealHp');
    if (realHpElem) realHpElem.innerText = "-";

    calculate();
}

// 初期化実行
switchAttackMode();
