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
   計算メイン処理 (モード分岐対応)
------------------------------------------------------- */
function calculate() {
    // --- 攻撃力(威力)取得 ---
    const attackElem = document.getElementById('attack');
    let baseAttack = parseFloat(attackElem.value) || 0;
    let actualAttack = 0;

    if (currentAttackMode === 'direct') {
        // 直殴り: ベース + 加撃
        const bonusElem = document.getElementById('attackBonus');
        const bonusAttack = parseFloat(bonusElem.value) || 0;
        actualAttack = baseAttack + bonusAttack;
    } else {
        // 友情: ベース × 友撃 (四捨五入)
        const yuugekiVal = parseFloat(document.getElementById('friendYuugekiSelect').value) || 1.0;
        actualAttack = Math.floor(baseAttack * yuugekiVal);
    }

    // 表示更新
    const totalDisplay = document.getElementById('totalAttackDisplay');
    if (totalDisplay) totalDisplay.innerText = actualAttack.toLocaleString();

    let totalMultiplier = 1.0;

    // ==========================================
    // 1. 直殴りモード専用倍率
    // ==========================================
    if (currentAttackMode === 'direct') {
        // ゲージ
        const gaugeElem = document.getElementById('chk_gauge');
        if (gaugeElem && gaugeElem.checked) totalMultiplier *= 1.2;

        // キャラクター倍率
        if (document.getElementById('chk_ab1').checked) totalMultiplier *= 1.3; // 超ADW
        
        // 超AW
        if (document.getElementById('chk_warp').checked) {
            const count = parseFloat(document.getElementById('warpCount').value) || 0;
            totalMultiplier *= (1 + (count * 0.05));
        }

        // MS
        if (document.getElementById('chk_ms').checked) {
            totalMultiplier *= (parseFloat(document.getElementById('msSelect').value) || 1.0);
        }

        // 底力
        if (document.getElementById('chk_soko').checked) {
            totalMultiplier *= (parseFloat(document.getElementById('sokoSelect').value) || 1.0);
        }

        // ウォールブースト
        if (document.getElementById('chk_wboost').checked) {
            const gradeKey = document.getElementById('wboostGrade').value;
            const valKey = document.getElementById('wboostVal').value;
            if (WALL_BOOST_DATA[gradeKey] && WALL_BOOST_DATA[gradeKey][valKey]) {
                totalMultiplier *= WALL_BOOST_DATA[gradeKey][valKey];
            }
        }

        // パワーフィールド
        if (document.getElementById('chk_pfield').checked) {
        totalMultiplier *= (parseFloat(document.getElementById('pfieldSelect').value) || 1.0);
    }

        if (document.getElementById('chk_ab2').checked) totalMultiplier *= 3.0; // 渾身
        if (document.getElementById('chk_ab3').checked) totalMultiplier *= 7.5; // クリティカル
        if (document.getElementById('chk_ab4').checked) totalMultiplier *= 1.2; // 超パワー型

        // SS倍率
        if (document.getElementById('chk_SS').checked) {
            totalMultiplier *= (parseFloat(document.getElementById('SSRate').value) || 1.0);
        }

        // 直殴り倍率(敵)
        if (document.getElementById('chk_naguri').checked) {
            totalMultiplier *= (parseFloat(document.getElementById('naguriRate').value) || 1.0);
        }
    }

    // ==========================================
    // 2. 友情コンボモード専用倍率
    // ==========================================
    if (currentAttackMode === 'friend') {
        // 友情ブースト
        if (document.getElementById('chk_friend_boost').checked) {
            totalMultiplier *= (parseFloat(document.getElementById('friendBoostSelect').value) || 1.0);
        }

        if (document.getElementById('chk_ffield').checked) totalMultiplier *= 1.5; // 友情フィールド
        if (document.getElementById('chk_friendhalf').checked) totalMultiplier *= 0.5; // 誘発

        // 友情底力
        if (document.getElementById('chk_friendsoko').checked) {
            totalMultiplier *= (parseFloat(document.getElementById('friendsokoSelect').value) || 1.0);
        }

        // 友情倍率
        if (document.getElementById('chk_yujo').checked) {
            totalMultiplier *= (parseFloat(document.getElementById('yujoRate').value) || 1.0);
        }

        // 友情バフ
        if (document.getElementById('chk_friendbuff').checked) {
            totalMultiplier *= (parseFloat(document.getElementById('friendbuffRate').value) || 1.0);
        }


    }

    // ==========================================
    // 3. 共通倍率
    // ==========================================
    
    // パワーオーラ
    if (document.getElementById('chk_aura').checked) {
        totalMultiplier *= (parseFloat(document.getElementById('auraSelect').value) || 1.0);
    }

    // 魔法陣ブースト
    if (document.getElementById('chk_mboost').checked) {
        totalMultiplier *= (parseFloat(document.getElementById('mboostSelect').value) || 1.0);
    }

    // キラー
    if (document.getElementById('chk_killer').checked) {
        totalMultiplier *= (parseFloat(document.getElementById('killerRate').value) || 1.0);
    }

    // バフ
    if (document.getElementById('chk_buff').checked) {
        totalMultiplier *= (parseFloat(document.getElementById('buffRate').value) || 1.0);
    }

    // 守護獣
    if (document.getElementById('chk_guardian').checked) {
        totalMultiplier *= (parseFloat(document.getElementById('guardianRate').value) || 1.0);
    }

    // その他
    if (document.getElementById('chk_other').checked) {
        totalMultiplier *= (parseFloat(document.getElementById('otherRate').value) || 1.0);
    }

    // 紋章
    if (document.getElementById('chk_emb1').checked) totalMultiplier *= 1.25;
    if (document.getElementById('chk_emb2').checked) totalMultiplier *= 1.10;
    if (document.getElementById('chk_emb3').checked) totalMultiplier *= 1.10;
    if (document.getElementById('chk_emb4').checked) totalMultiplier *= 1.08;

    // 敵倍率(共通)
    if (document.getElementById('chk_weak').checked) {
        totalMultiplier *= (parseFloat(document.getElementById('weakRate').value) || 1.0);
    }
    if (document.getElementById('chk_hontai').checked) {
        totalMultiplier *= (parseFloat(document.getElementById('hontaiRate').value) || 1.0);
    }
    if (document.getElementById('chk_def').checked) {
        totalMultiplier *= (parseFloat(document.getElementById('defRate').value) || 1.0);
    }
    if (document.getElementById('chk_angry').checked) {
        totalMultiplier *= (parseFloat(document.getElementById('angrySelect').value) || 1.0);
    }
    if (document.getElementById('chk_mine').checked) {
        totalMultiplier *= (parseFloat(document.getElementById('mineRate').value) || 1.0);
    }
    if (document.getElementById('chk_special').checked) {
        totalMultiplier *= (parseFloat(document.getElementById('specialRate').value) || 1.0);
    }

    // ステージ倍率
    let stageMultiplier = 1.0;
    const stageSelect = document.getElementById('stageEffectSelect');
    const customInput = document.getElementById('customStageRate');
    
    if (stageSelect) {
        let stageBase = 1.0;
        if (stageSelect.value === 'custom') {
            stageBase = parseFloat(customInput.value) || 1.0;
        } else {
            stageBase = parseFloat(stageSelect.value) || 1.0;
        }

        if (document.getElementById('chk_stageSpecial').checked && stageBase !== 1.0) {
            let temp = ((stageBase - 1) / 0.33) * 0.596 + 1;
            stageMultiplier = Math.round(temp * 100000) / 100000;
        } else {
            stageMultiplier = stageBase;
        }

        const displayElem = document.getElementById('stageRealRate');
        if (displayElem) displayElem.innerText = Math.floor(stageMultiplier * 100000) / 100000;
    }
    totalMultiplier *= stageMultiplier;

    // ギミック倍率
    if (document.getElementById('chk_gimmick').checked) {
        totalMultiplier *= (parseFloat(document.getElementById('gimmickRate').value) || 1.0);
    }

    // --- 最終計算 ---
    const finalDamage = Math.floor(actualAttack * totalMultiplier);
    
    currentFinalDamage = finalDamage;

    // 表示更新
    const resultElem = document.getElementById('result');
    if (resultElem) resultElem.innerText = currentFinalDamage.toLocaleString();

    const verifyDisplay = document.getElementById('verifyDamageDisplay');
    if (verifyDisplay) verifyDisplay.innerText = currentFinalDamage.toLocaleString();

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
