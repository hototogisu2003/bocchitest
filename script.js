// 計算された最終ダメージを保持する変数
let currentFinalDamage = 0;

// --- ウォールブースト倍率定義 ---
// 1壁, 2壁, 3壁, 4壁 の順で倍率を定義
const WALL_BOOST_DATA = {
    "1.5": { 1: 1.12, 2: 1.25, 3: 1.37, 4: 1.5 }, // 無印
    "2.0": { 1: 1.25,  2: 1.5,  3: 1.75,  4: 2.0 }, // M
    "2.5": { 1: 1.37, 2: 1.75, 3: 2.12, 4: 2.5 }, // L
};

/* -------------------------------------------------------
   入力欄の有効/無効を切り替える関数
------------------------------------------------------- */
function toggleInput(inputId, checkboxId) {
    const input = document.getElementById(inputId);
    const checkbox = document.getElementById(checkboxId);
    
    if (input && checkbox) {
        input.disabled = !checkbox.checked;
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
    // --- 1. 攻撃力の計算 (素の攻撃力 + 加撃) ---
    const attackElem = document.getElementById('attack');
    const bonusElem = document.getElementById('attackBonus');

    const baseAttack = attackElem ? (parseFloat(attackElem.value) || 0) : 0;
    const bonusAttack = bonusElem ? (parseFloat(bonusElem.value) || 0) : 0;
    
    const actualAttack = baseAttack + bonusAttack;

    // 画面上の合計攻撃力表示を更新
    const totalDisplay = document.getElementById('totalAttackDisplay');
    if (totalDisplay) {
        totalDisplay.innerText = actualAttack.toLocaleString();
    }

    // --- 2. ゲージ (1.2倍) ---
    const gaugeElem = document.getElementById('chk_gauge');
    const gaugeMultiplier = (gaugeElem && gaugeElem.checked) ? 1.2 : 1.0;

    // --- 3. キャラクター倍率 ---
    
    // 超ADW (x1.3)
    const ab1Elem = document.getElementById('chk_ab1');
    let ab1Multiplier = (ab1Elem && ab1Elem.checked) ? 1.3 : 1.0;
    
    // 渾身 (x3.0)
    const ab2Elem = document.getElementById('chk_ab2');
    let ab2Multiplier = (ab2Elem && ab2Elem.checked) ? 3.0 : 1.0;

    // クリティカル (×7.5)
    const ab3Elem = document.getElementById('chk_ab3');
    let ab3Multiplier = (ab3Elem && ab3Elem.checked) ? 7.5 : 1.0;

    // パワーオーラ (直前のHTMLに含まれていたため維持)
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

    // ウォールブースト (等級テーブルを使用する方式)
    let wboostMultiplier = 1.0;
    const wbCheck = document.getElementById('chk_wboost');
    const wbGrade = document.getElementById('wboostGrade');
    const wbVal = document.getElementById('wboostVal');
    
    if (wbCheck && wbCheck.checked && wbGrade && wbVal) {
        const gradeKey = wbGrade.value;
        const valKey = wbVal.value;
        // 定義データから取得 (なければ1.0)
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

    // 超パワー型 (初撃x1.2)
    const ab4Elem = document.getElementById('chk_ab4');
    let ab4Multiplier = (ab4Elem && ab4Elem.checked) ? 1.2 : 1.0;

    // キラー倍率
    let killerMultiplier = 1.0;
    const killerCheck = document.getElementById('chk_killer');
    const killerInput = document.getElementById('killerRate');
    if (killerCheck && killerCheck.checked && killerInput) {
        killerMultiplier = parseFloat(killerInput.value) || 1.0;
    }

    // バフ倍率
    let buffMultiplier = 1.0;
    const buffCheck = document.getElementById('chk_buff');
    const buffInput = document.getElementById('buffRate');
    if (buffCheck && buffCheck.checked && buffInput) {
        buffMultiplier = parseFloat(buffInput.value) || 1.0;
    }

    // 守護獣倍率
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

    // その他倍率
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
    
    // 弱点倍率
    let weakMultiplier = 1.0;
    const weakCheck = document.getElementById('chk_weak');
    const weakInput = document.getElementById('weakRate');
    if (weakCheck && weakCheck.checked && weakInput) {
        weakMultiplier = parseFloat(weakInput.value) || 1.0;
    }

    // 直殴り倍率
    let naguriMultiplier = 1.0;
    const naguriCheck = document.getElementById('chk_naguri');
    const naguriInput = document.getElementById('naguriRate');
    if (naguriCheck && naguriCheck.checked && naguriInput) {
        naguriMultiplier = parseFloat(naguriInput.value) || 1.0;
    }

    // 本体倍率
    let hontaiMultiplier = 1.0;
    const hontaiCheck = document.getElementById('chk_hontai');
    const hontaiInput = document.getElementById('hontaiRate');
    if (hontaiCheck && hontaiCheck.checked && hontaiInput) {
        hontaiMultiplier = parseFloat(hontaiInput.value) || 1.0;
    }

    // 防御ダウン倍率
    let defMultiplier = 1.0;
    const defCheck = document.getElementById('chk_def');
    const defInput = document.getElementById('defRate');
    if (defCheck && defCheck.checked && defInput) {
        defMultiplier = parseFloat(defInput.value) || 1.0;
    }

    // 怒り倍率
    let angryMultiplier = 1.0;
    const angryCheck = document.getElementById('chk_angry');
    const angrySelect = document.getElementById('angrySelect');
    if (angryCheck && angryCheck.checked && angrySelect) {
        angryMultiplier = parseFloat(angrySelect.value) || 1.0;
    }

    // 特殊倍率 (敵カテゴリの追加分)
    let speMultiplier = 1.0;
    const speCheck = document.getElementById('chk_special');
    const speInput = document.getElementById('specialRate');
    if (speCheck && speCheck.checked && speInput) {
        speMultiplier = parseFloat(speInput.value) || 1.0;
    }

    // ギミック倍率
    let gimmickMultiplier = 1.0;
    const gimCheck = document.getElementById('chk_gimmick'); 
    const gimInput = document.getElementById('gimmickRate');
    if (gimCheck && gimCheck.checked && gimInput) {
        gimmickMultiplier = parseFloat(gimInput.value) || 1.0;
    }

    // 地雷倍率
    let mineMultiplier = 1.0;
    const mineCheck = document.getElementById('chk_mine');
    const mineInput = document.getElementById('mineRate');
    if (mineCheck && mineCheck.checked && mineInput) {
        mineMultiplier = parseFloat(mineInput.value) || 1.0;
    }

    // --- ステージ倍率 ---
    const stageSelect = document.getElementById('stageEffectSelect');
    const stageCheck = document.getElementById('chk_stageSpecial');
    
    let stageMultiplier = 1.0;
    
    if (stageSelect && stageCheck) {
        const stageBase = parseFloat(stageSelect.value) || 1.0;
        const isStageSpecial = stageCheck.checked;
        stageMultiplier = stageBase;

// 超バランス型計算
        if (isStageSpecial && stageBase !== 1.0) {
            // 1. まず普通に計算する
            let temp = ((stageBase - 1) / 0.33) * 0.596 + 1;
            
            // 2. 小数点以下第6位を四捨五入する（＝小数第5位まで残す）
            // Math.round(数値 * 100000) / 100000 を使うことで、5桁目で丸めます
            stageMultiplier = Math.round(temp * 100000) / 100000;
        }

        // 画面上の実質倍率表示を更新 (小数点第5位まで表示)
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
        * auraMultiplier // パワーオーラ
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

  // ★追加：グローバル変数に保存
    currentFinalDamage = Math.floor(finalDamage);
    
    // 結果表示
    const resultElem = document.getElementById('result');
    if (resultElem) {
        resultElem.innerText = Math.floor(finalDamage).toLocaleString();
    }
}

// ★追加：判定画面側の数値も更新し、再判定を行う
    const verifyDisplay = document.getElementById('verifyDamageDisplay');
    if (verifyDisplay) {
        verifyDisplay.innerText = currentFinalDamage.toLocaleString();
    }
    checkOneshot(); // ダメージが変わったら判定も更新

// 初期化
calculate();

// --- デバッグ用：最終更新日時を表示（yyyy-mm-dd hh:mm形式） ---
const debugElem = document.getElementById('debug-timestamp');
if (debugElem) {
    const d = new Date(document.lastModified);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');

    // 秒を省いて表示
    debugElem.innerText = `最終更新: ${year}-${month}-${day} ${hours}:${min}`;
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
        // タブを開いたときにも判定を実行
        checkOneshot();
    }
}

/* -------------------------------------------------------
   ワンパン判定ロジック
------------------------------------------------------- */
function checkOneshot() {
    const hpInput = document.getElementById('enemyHp');
    const judgeText = document.getElementById('judge-text');
    const resultBox = document.getElementById('verify-result-box');

    if (!hpInput || !judgeText) return;

    const enemyHp = parseFloat(hpInput.value);

    // HPが未入力の場合
    if (isNaN(enemyHp) || enemyHp <= 0) {
        judgeText.innerText = "HPを入力してください";
        resultBox.className = "result-box"; // クラスをリセット
        return;
    }

    // 判定
    if (currentFinalDamage >= enemyHp) {
        // ワンパン可能
        judgeText.innerText = "ワンパンできます";
        judgeText.innerHTML += `<br><span style="font-size:0.6em">超過ダメージ: ${(currentFinalDamage - enemyHp).toLocaleString()}</span>`;
        
        resultBox.className = "result-box judge-success"; // 赤系スタイル
    } else {
        // ワンパン不可
        const diff = enemyHp - currentFinalDamage;
        judgeText.innerText = "ワンパンできません";
        judgeText.innerHTML += `<br><span style="font-size:0.6em">あと ${diff.toLocaleString()} 足りません</span>`;
        
        resultBox.className = "result-box judge-fail"; // 青系スタイル
    }
}
