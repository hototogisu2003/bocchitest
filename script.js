// --- 属性倍率データの定義 ---
const STAGE_ATTR_DATA = {
    advantage: {
        label: "有利",
        options: [
            { name: "通常 (x1.33)", val: 1.33 },
            { name: "属性効果UP (x1.5016)", val: 1.5016 },
            { name: "属性効果超UP (x1.99)", val: 1.99 },
            { name: "属性効果超絶UP (x2.9998)", val: 2.9998 },
            { name: "エレメント系", val: "custom" } // ★ここに追加
        ]
    },
    disadvantage: {
        label: "不利",
        options: [
            { name: "通常 (x0.66)", val: 0.66 },
            { name: "属性効果UP (x0.4832)", val: 0.4832 },
            { name: "属性効果超UP (x0.3)", val: 0.30 },
            { name: "属性効果超絶UP (x0.3)", val: 0.30 },
        ]
    }
};

/* -------------------------------------------------------
   属性倍率UIの更新 (タイプ選択変更時に発火)
------------------------------------------------------- */
function updateStageUI() {
    const typeSelect = document.getElementById('stageTypeSelect');
    const magSelect = document.getElementById('stageMagnitudeSelect');
    const customInput = document.getElementById('customStageRate');
    const superBalanceArea = document.getElementById('group-super-balance');

    if (!typeSelect || !magSelect) return;

    const type = typeSelect.value;

    if (type === 'none') {
        // 「なし」の場合: 2段目と入力欄を隠す
        magSelect.style.display = 'none';
        customInput.style.display = 'none';
        if(superBalanceArea) superBalanceArea.style.display = 'none';
    } else {
        // 「有利/不利」の場合: 2段目を表示
        magSelect.style.display = 'block';
        
        // --- プルダウン生成 ---
        const currentVal = magSelect.value; // 値を一時保存
        magSelect.innerHTML = "";
        const data = STAGE_ATTR_DATA[type];
        if (data) {
            data.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.val;
                option.text = opt.name;
                magSelect.appendChild(option);
            });
        }
        
        // 以前の値があれば復元、なければ先頭(通常)を選択
        if (currentVal && Array.from(magSelect.options).some(o => o.value === currentVal)) {
            magSelect.value = currentVal;
        }

        // --- 超バランス型の表示制御 ---
        if (superBalanceArea) {
            superBalanceArea.style.display = (type === 'advantage') ? 'block' : 'none';
        }
    }

    // 2段目の状態に合わせて入力欄の表示/非表示を更新
    handleStageMagnitudeChange(); 
}

/* -------------------------------------------------------
   ★新規: 倍率詳細プルダウン変更時の処理
   「個別入力」が選ばれた時だけ入力欄を出す
------------------------------------------------------- */
function handleStageMagnitudeChange() {
    const typeSelect = document.getElementById('stageTypeSelect');
    const magSelect = document.getElementById('stageMagnitudeSelect');
    const customInput = document.getElementById('customStageRate');

    // 「なし」選択中、または要素がない場合は何もしない
    if (!typeSelect || typeSelect.value === 'none') {
        customInput.style.display = 'none';
        calculate();
        return;
    }

    // 「個別入力(custom)」が選ばれているか判定
    if (magSelect.value === 'custom') {
        customInput.style.display = 'block';
    } else {
        customInput.style.display = 'none';
    }
    
    calculate();
}

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
   複数判定モードの表示切り替え
------------------------------------------------------- */
function toggleMultiMode() {
    const isMulti = document.getElementById('chk_multi_mode').checked;
    const inputs = document.getElementById('multi-inputs');
    if (inputs) {
        inputs.style.display = isMulti ? 'flex' : 'none';
    }
    calculate(); // 再計算
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

   // モード判定
    const isMultiMode = document.getElementById('chk_multi_mode') && document.getElementById('chk_multi_mode').checked;

    let totalMultiplier = 1.0; // 共通倍率（全体にかかる）
    
    // 部位ごとの個別倍率（MultiMode用）
    let rate_weak_killer = 1.0; // 弱点キラー
    let rate_vs_weak = 1.0;     // 紋章・対弱
    let rate_weak = 1.0;        // 弱点倍率
    let rate_weakpoint = 1.0;       // 弱点判定倍率
    let rate_body = 1.0;        // 本体倍率

    // ヘルパー関数
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
             const sokoVal = document.getElementById('friendsokoSelect') ? document.getElementById('friendsokoSelect').value : 1.0;
             apply("友情底力" + getGradeSuffix('friendsokoSelect'), parseFloat(sokoVal) || 1.0);
        }

        if (document.getElementById('chk_fcritical') && document.getElementById('chk_fcritical').checked) {
            apply("友情コンボクリティカル", 3.0);
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
        apply("その他キラー", parseFloat(document.getElementById('killerRate').value) || 1.0);
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
    if (document.getElementById('chk_emb2').checked) {
        const val = 1.10;
        if (isMultiMode) {
            rate_vs_weak = val;
        } else {
            apply("紋章(対弱)", val);
        }
    }
    if (document.getElementById('chk_emb3').checked) apply("紋章(対将/兵)", 1.10);
    if (document.getElementById('chk_emb4').checked) apply("紋章(守護獣)", 1.08);


    // 弱点キラー (弱点ヒット時のみ有効)
    if (document.getElementById('chk_weak_killer').checked) {
        const val = parseFloat(document.getElementById('weak_killerRate').value) || 1.0;
        if (isMultiMode) {
            rate_weak_killer = val;
        } else {
            apply("弱点キラー", val);
        }
    }

    // 弱点倍率
    // 常に値を取得する (デフォルト3.0)
    const val_weak = parseFloat(document.getElementById('weakRate').value) || 3.0;
    
    if (isMultiMode) {
        rate_weak = val_weak; // 複数モード: チェック有無に関わらず値を採用
    } else {
        // 通常モード: チェックがある場合のみ適用
        if (document.getElementById('chk_weak').checked) {
            apply("弱点倍率", val_weak);
        }
    }

    // 弱点判定倍率
    // 常に値を取得する (デフォルト1.0)
    const val_judge = parseFloat(document.getElementById('weakpointRate').value) || 1.0;

    if (isMultiMode) {
        rate_judge = val_judge; // 複数モード: チェック有無に関わらず値を採用
    } else {
        if (document.getElementById('chk_weakpoint').checked) {
            apply("弱点判定倍率", val_judge);
        }
    }

    // 本体倍率
    // 常に値を取得する (デフォルト1.0)
    const val_body = parseFloat(document.getElementById('hontaiRate').value) || 1.0;

    if (isMultiMode) {
        rate_body = val_body; // 複数モード: チェック有無に関わらず値を採用
    } else {
        if (document.getElementById('chk_hontai').checked) {
        }
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
    const typeSelect = document.getElementById('stageTypeSelect');
    const magSelect = document.getElementById('stageMagnitudeSelect');
    const customInput = document.getElementById('customStageRate');

    if (typeSelect) {
        let stageBase = 1.0;
        let rateName = "属性倍率";
        const type = typeSelect.value;

        if (type === 'none') {
            stageBase = 1.0;
            rateName = "属性倍率(なし)";
        } else {
            // 有利 or 不利
            if (magSelect.value === 'custom') {
                stageBase = parseFloat(customInput.value) || 1.0;
                rateName = "エレメント系";
            } else {
                stageBase = parseFloat(magSelect.value) || 1.0;
                
                // ログ名作成
                const typeText = typeSelect.options[typeSelect.selectedIndex].text;
                let magText = "";
                if (magSelect.selectedIndex >= 0) {
                     // "通常 (x1.33)" -> "通常" だけ取り出す
                     magText = "・" + magSelect.options[magSelect.selectedIndex].text.split(' ')[0];
                }
                rateName = `属性倍率(${typeText}${magText})`;
            }
        }

        let stageMultiplier = stageBase;

        // 超バランス型の計算 (有利選択時のみ)
        if (type === 'advantage' && document.getElementById('chk_stageSpecial').checked) {
            // 倍率1.0超えの場合のみ適用 (手動入力で1.0以下にした場合などを除外するため)
            if (stageBase > 1.0) {
                let temp = ((stageBase - 1) / 0.33) * 0.596 + 1;
                stageMultiplier = Math.round(temp * 100000) / 100000;
                rateName = "超バランス型(" + rateName.replace("属性倍率", "").replace(/[()]/g, "") + ")";
            }
        }
        
        apply(rateName, stageMultiplier);

        const displayElem = document.getElementById('stageRealRate');
        if (displayElem) displayElem.innerText = Math.floor(stageMultiplier * 100000) / 100000;
    }

    if (document.getElementById('chk_gimmick').checked) {
        apply("ギミック倍率", parseFloat(document.getElementById('gimmickRate').value) || 1.0);
    }
let finalDamage = 0;

    if (isMultiMode) {
        // --- 複数判定モードの計算 ---
        
        // 共通ダメージ（ベース）
        const commonDamage = actualAttack * totalMultiplier;

        // 1. 本体へのダメージ (1判定固定 * 本体倍率)
        const dmg_body = Math.floor(commonDamage * rate_body);

        // 2. 弱点へのダメージ (弱点数 * 弱点倍率 * 弱点キラー * 対弱)
        const count_weak = parseFloat(document.getElementById('val_weak_cnt').value) || 0;
        // 弱点用倍率を合成
        const multi_weak_total = rate_weak * rate_weak_killer * rate_vs_weak;
        const dmg_weak_unit = Math.floor(commonDamage * multi_weak_total);
        const dmg_weak_total = dmg_weak_unit * count_weak;

        // 3. 弱点判定へのダメージ (判定数 * 判定倍率) ※キラー・対弱は乗らない
        const count_judge = parseFloat(document.getElementById('val_judge_cnt').value) || 0;
        const dmg_judge_unit = Math.floor(commonDamage * rate_judge);
        const dmg_judge_total = dmg_judge_unit * count_judge;

        // 総和
        finalDamage = dmg_body + dmg_weak_total + dmg_judge_total;

        // ログへの追記 (内訳が見えるように)
        breakdown.push({ name: "--- 複数判定内訳 ---", val: "" });
        breakdown.push({ name: `本体 (x${rate_body})`, val: dmg_body.toLocaleString() });
        if(count_weak > 0) {
            breakdown.push({ name: `弱点 (x${Math.round(multi_weak_total*100)/100})`, val: `${dmg_weak_unit.toLocaleString()} × ${count_weak}hit` });
        }
        if(count_judge > 0) {
            breakdown.push({ name: `弱点判定 (x${rate_judge})`, val: `${dmg_judge_unit.toLocaleString()} × ${count_judge}hit` });
        }

    } else {
        // --- 通常モード（既存） ---
        finalDamage = Math.floor((actualAttack * totalMultiplier) + 0.00001);
    }

    // 結果表示（既存コードと同じ）
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
updateStageUI();
