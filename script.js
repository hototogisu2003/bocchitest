// --- ウォールブースト倍率定義 ---
// 1壁, 2壁, 3壁, 4壁 の順で倍率を定義
const WALL_BOOST_DATA = {
    "1.5": { 1: 1.12, 2: 1.25, 3: 1.37, 4: 1.5 }, // 無印
    "2.0": { 1: 1.25,  2: 1.5,  3: 1.75,  4: 2.0 }, // M
    "2.5": { 1: 1.37, 2: 1.75, 3: 2.12, 4: 2.5 }, // L
};

// 計算された最終ダメージを保持する変数
let currentFinalDamage = 0;


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
        // タブを開いたときにも判定を実行
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
        
        // ★重要: 切り替え時に必ず再計算を実行する
        calculate(); 
        
        // 判定画面用の更新も兼ねて checkOneshot も念のため呼ぶ
        if (typeof checkOneshot === 'function') {
            checkOneshot();
        }
    }
}

/* -------------------------------------------------------
   ★新規追加：属性倍率の手入力欄切り替え
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
   計算メイン処理
------------------------------------------------------- */
function calculate() {
    // --- 1. 攻撃力の計算 ---
    const attackElem = document.getElementById('attack');
    const bonusElem = document.getElementById('attackBonus');

    const baseAttack = attackElem ? (parseFloat(attackElem.value) || 0) : 0;
    const bonusAttack = bonusElem ? (parseFloat(bonusElem.value) || 0) : 0;
    
    const actualAttack = baseAttack + bonusAttack;

    const totalDisplay = document.getElementById('totalAttackDisplay');
    if (totalDisplay) {
        totalDisplay.innerText = actualAttack.toLocaleString();
    }

    // --- 2. ゲージ ---
    const gaugeElem = document.getElementById('chk_gauge');
    const gaugeMultiplier = (gaugeElem && gaugeElem.checked) ? 1.2 : 1.0;

    // --- 3. キャラクター倍率 ---
    
    // 超ADW
    const ab1Elem = document.getElementById('chk_ab1');
    let ab1Multiplier = (ab1Elem && ab1Elem.checked) ? 1.3 : 1.0;
    
    // 渾身
    const ab2Elem = document.getElementById('chk_ab2');
    let ab2Multiplier = (ab2Elem && ab2Elem.checked) ? 3.0 : 1.0;

    // クリティカル
    const ab3Elem = document.getElementById('chk_ab3');
    let ab3Multiplier = (ab3Elem && ab3Elem.checked) ? 7.5 : 1.0;

    // 超パワー型
    const ab4Elem = document.getElementById('chk_ab4');
    let ab4Multiplier = (ab4Elem && ab4Elem.checked) ? 1.2 : 1.0;

    // パワーオーラ
    let auraMultiplier = 1.0;
    const auraCheck = document.getElementById('chk_aura');
    const auraSelect = document.getElementById('auraSelect');
    if (auraCheck && auraCheck.checked && auraSelect) {
        auraMultiplier = parseFloat(auraSelect.value) || 1.0;
    }

    // マインスイーパー
    let msMultiplier = 1.0;
    const msCheck = document.getElementById('chk_ms');
    const msSelect = document.getElementById('msSelect');
    if (msCheck && msCheck.checked && msSelect) {
        msMultiplier = parseFloat(msSelect.value) || 1.0;
    }

    // 超アンチワープ
    let warpMultiplier = 1.0;
    const warpCheck = document.getElementById('chk_warp');
    const warpInput = document.getElementById('warpCount');
    if (warpCheck && warpCheck.checked && warpInput) {
        const count = parseFloat(warpInput.value) || 0;
        warpMultiplier = 1 + (count * 0.05);
    }
    
    // 底力
    let sokoMultiplier = 1.0;
    const sokoCheck = document.getElementById('chk_soko');
    const sokoSelect = document.getElementById('sokoSelect');
    if (sokoCheck && sokoCheck.checked && sokoSelect) {
        sokoMultiplier = parseFloat(sokoSelect.value) || 1.0;
    }

    // ウォールブースト
    let wboostMultiplier = 1.0;
    const wbCheck = document.getElementById('chk_wboost');
    const wbGrade = document.getElementById('wboostGrade');
    const wbVal = document.getElementById('wboostVal');
    if (wbCheck && wbCheck.checked && wbGrade && wbVal) {
        const gradeKey = wbGrade.value;
        const valKey = wbVal.value;
        if (WALL_BOOST_DATA[gradeKey] && WALL_BOOST_DATA[gradeKey][valKey]) {
            wboostMultiplier = WALL_BOOST_DATA[gradeKey][valKey];
        }
    }

    // 魔法陣ブースト
    let mboostMultiplier = 1.0;
    const mbCheck = document.getElementById('chk_mboost');
    const mbSelect = document.getElementById('mboostSelect');
    if (mbCheck && mbCheck.checked && mbSelect) {
        mboostMultiplier = parseFloat(mbSelect.value) || 1.0;
    }

    // キラー
    let killerMultiplier = 1.0;
    const killerCheck = document.getElementById('chk_killer');
    const killerInput = document.getElementById('killerRate');
    if (killerCheck && killerCheck.checked && killerInput) {
        killerMultiplier = parseFloat(killerInput.value) || 1.0;
    }

    // バフ
    let buffMultiplier = 1.0;
    const buffCheck = document.getElementById('chk_buff');
    const buffInput = document.getElementById('buffRate');
    if (buffCheck && buffCheck.checked && buffInput) {
        buffMultiplier = parseFloat(buffInput.value) || 1.0;
    }

    // 守護獣
    let guardianMultiplier = 1.0;
    const guardCheck = document.getElementById('chk_guardian');
    const guardInput = document.getElementById('guardianRate');
    if (guardCheck && guardCheck.checked && guardInput) {
        guardianMultiplier = parseFloat(guardInput.value) || 1.0;
    }

    // SS倍率
    let SSMultiplier = 1.0;
    const ssCheck = document.getElementById('chk_SS');
    const ssInput = document.getElementById('SSRate');
    if (ssCheck && ssCheck.checked && ssInput) {
        SSMultiplier = parseFloat(ssInput.value) || 1.0;
    }

    // その他
    let otherMultiplier = 1.0;
    const otherCheck = document.getElementById('chk_other');
    const otherInput = document.getElementById('otherRate');
    if (otherCheck && otherCheck.checked && otherInput) {
        otherMultiplier = parseFloat(otherInput.value) || 1.0;
    }

    // --- 4. 紋章 ---
    const e1 = document.getElementById('chk_emb1');
    const e2 = document.getElementById('chk_emb2');
    const e3 = document.getElementById('chk_emb3');
    const e4 = document.getElementById('chk_emb4');
    let emb1 = (e1 && e1.checked) ? 1.25 : 1.0;
    let emb2 = (e2 && e2.checked) ? 1.10 : 1.0;
    let emb3 = (e3 && e3.checked) ? 1.10 : 1.0;
    let emb4 = (e4 && e4.checked) ? 1.08 : 1.0;

    // --- 5. 敵倍率 ---
    let weakMultiplier = 1.0;
    const weakCheck = document.getElementById('chk_weak');
    const weakInput = document.getElementById('weakRate');
    if (weakCheck && weakCheck.checked && weakInput) {
        weakMultiplier = parseFloat(weakInput.value) || 1.0;
    }

    let naguriMultiplier = 1.0;
    const naguriCheck = document.getElementById('chk_naguri');
    const naguriInput = document.getElementById('naguriRate');
    if (naguriCheck && naguriCheck.checked && naguriInput) {
        naguriMultiplier = parseFloat(naguriInput.value) || 1.0;
    }

    let hontaiMultiplier = 1.0;
    const hontaiCheck = document.getElementById('chk_hontai');
    const hontaiInput = document.getElementById('hontaiRate');
    if (hontaiCheck && hontaiCheck.checked && hontaiInput) {
        hontaiMultiplier = parseFloat(hontaiInput.value) || 1.0;
    }

    let defMultiplier = 1.0;
    const defCheck = document.getElementById('chk_def');
    const defInput = document.getElementById('defRate');
    if (defCheck && defCheck.checked && defInput) {
        defMultiplier = parseFloat(defInput.value) || 1.0;
    }

    let angryMultiplier = 1.0;
    const angryCheck = document.getElementById('chk_angry');
    const angrySelect = document.getElementById('angrySelect');
    if (angryCheck && angryCheck.checked && angrySelect) {
        angryMultiplier = parseFloat(angrySelect.value) || 1.0;
    }

    let speMultiplier = 1.0;
    const speCheck = document.getElementById('chk_special');
    const speInput = document.getElementById('specialRate');
    if (speCheck && speCheck.checked && speInput) {
        speMultiplier = parseFloat(speInput.value) || 1.0;
    }

    let gimmickMultiplier = 1.0;
    const gimCheck = document.getElementById('chk_gimmick');
    const gimInput = document.getElementById('gimmickRate');
    if (gimCheck && gimCheck.checked && gimInput) {
        gimmickMultiplier = parseFloat(gimInput.value) || 1.0;
    }

    let mineMultiplier = 1.0;
    const mineCheck = document.getElementById('chk_mine');
    const mineInput = document.getElementById('mineRate');
    if (mineCheck && mineCheck.checked && mineInput) {
        mineMultiplier = parseFloat(mineInput.value) || 1.0;
    }

    // --- ステージ倍率 (手入力対応) ---
    const stageSelect = document.getElementById('stageEffectSelect');
    const customInput = document.getElementById('customStageRate');
    const stageCheck = document.getElementById('chk_stageSpecial');
    let stageMultiplier = 1.0;
    
    if (stageSelect && stageCheck) {
        let stageBase = 1.0;
        
        // ★ customなら手入力欄、それ以外ならセレクトボックスの値を使う
        if (stageSelect.value === 'custom') {
            stageBase = parseFloat(customInput.value) || 1.0;
        } else {
            stageBase = parseFloat(stageSelect.value) || 1.0;
        }

        const isStageSpecial = stageCheck.checked;
        stageMultiplier = stageBase;

        // 超バランス型計算 (丸め処理込み)
        if (isStageSpecial && stageBase !== 1.0) {
            let temp = ((stageBase - 1) / 0.33) * 0.596 + 1;
            stageMultiplier = Math.round(temp * 100000) / 100000;
        }

        const displayElem = document.getElementById('stageRealRate');
        if (displayElem) {
            displayElem.innerText = Math.floor(stageMultiplier * 100000) / 100000;
        }
    }

    // --- 最終計算 ---
    const finalDamage = actualAttack 
        * gaugeMultiplier
        * ab1Multiplier 
        * ab2Multiplier
        * ab3Multiplier
        * ab4Multiplier
        * auraMultiplier
        * msMultiplier
        * warpMultiplier
        * sokoMultiplier
        * wboostMultiplier
        * mboostMultiplier
        * killerMultiplier
        * buffMultiplier      
        * guardianMultiplier
        * SSMultiplier
        * otherMultiplier 
        * emb1 * emb2 * emb3 * emb4 
        * weakMultiplier
        * naguriMultiplier
        * hontaiMultiplier
        * defMultiplier
        * angryMultiplier
        * speMultiplier
        * gimmickMultiplier
        * mineMultiplier
        * stageMultiplier;
    
    // グローバル変数に保存
    currentFinalDamage = Math.floor(finalDamage);

    // 1. 計算タブの結果表示を更新
    const resultElem = document.getElementById('result');
    if (resultElem) {
        resultElem.innerText = currentFinalDamage.toLocaleString();
    }

    // 2. 判定タブのダメージ表示も更新
    const verifyDisplay = document.getElementById('verifyDamageDisplay');
    if (verifyDisplay) {
        verifyDisplay.innerText = currentFinalDamage.toLocaleString();
    }

    // 3. 判定ロジックを再実行
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

    // HPが未入力の場合
    if (isNaN(maxHp) || maxHp <= 0) {
        judgeText.innerText = "HPを入力してください";
        resultBox.className = "result-box"; 
        if (realHpElem) realHpElem.innerText = "-";
        return;
    }

    // --- HP削り計算 ---
    let reduceRate = 0;
    
    // 1. 将命/兵命 (チェック有効時のみセレクトボックス値を加算)
    const enableAB = document.getElementById('chk_enableAB');
    const selAB = document.getElementById('sel_reduceAB');

    if (enableAB && enableAB.checked && selAB) {
        reduceRate += parseFloat(selAB.value) || 0;
    }

    // 2. 10%削り
    if (document.getElementById('chk_reduceC').checked) {
        reduceRate += 0.10;
    }

    // 削り後の実質HPを計算
    const currentEnemyHp = Math.floor(maxHp * (1 - reduceRate));

    // 実質HPを表示エリアに反映
    if (realHpElem) {
        realHpElem.innerText = currentEnemyHp.toLocaleString();
    }

    // --- 判定 ---
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
        if (log.style.display === 'none') {
            log.style.display = 'block';
        } else {
            log.style.display = 'none';
        }
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
    if (!confirm("入力内容をすべてリセットしますか？")) {
        return;
    }

    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.value = "";
    });

    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(chk => {
        chk.checked = false;
    });

    const selects = document.querySelectorAll('select');
    selects.forEach(sel => {
        sel.selectedIndex = 0;
    });

    const dependentInputs = document.querySelectorAll('.category-section input[type="number"], .category-section select');
    dependentInputs.forEach(el => {
        if (el.id !== 'stageEffectSelect') {
            el.disabled = true;
        }
    });

    // 特殊な表示項目のリセット
    const customStageInput = document.getElementById('customStageRate');
    if (customStageInput) customStageInput.style.display = 'none';
    
    const realHpElem = document.getElementById('displayRealHp');
    if (realHpElem) realHpElem.innerText = "-";

    calculate();
}

// 初期化実行
calculate();
