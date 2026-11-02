// 選択肢の誤タップを防ぐ（すべての選択肢で共通に使う）
//  A. 出てから少し（DELAY）は押せない。その間ボタンは薄く、押せるようになると濃くなる
//  B. 押し始め（pointerdown）も離す（pointerup）も、同じボタンの上で、押せるようになった後でなければ決定しない
//     → 前の選択肢を押した指や、すばやい2回目のタップは無視される
//  C. 選んだボタンに ✓ を付けて少し（PICK）光らせてから、次へ進む（mark: true のとき）
// 使い方：ボタンに onclick を付けてから arm(親の要素, 'button', { mark: true }) を呼ぶ。onclick は arm が預かる
export const DELAY = 380, PICK = 320;

export function arm(root, sel = 'button', { mark = false, once = true } = {}) {
  const btns = [...root.querySelectorAll(sel)].filter(b => b.onclick);
  if (!btns.length) return;
  const t0 = performance.now();
  const ready = () => performance.now() - t0 >= DELAY;
  root.classList.add('arming');
  root.classList.remove('picked');
  setTimeout(() => root.classList.remove('arming'), DELAY);
  let done = false;
  for (const b of btns) {
    const handler = b.onclick;
    b.onclick = null;
    let downId = null;
    const fire = e => {
      if (done) return;
      if (once) done = true;
      e && e.stopPropagation && e.stopPropagation();
      if (mark) {
        b.classList.add('chosen');
        root.classList.add('picked');
        setTimeout(() => handler.call(b, e), PICK);
      } else handler.call(b, e);
    };
    b.addEventListener('pointerdown', e => { downId = ready() ? e.pointerId : null; });
    b.addEventListener('pointercancel', () => { downId = null; });
    b.addEventListener('pointerup', e => {
      const ok = downId === e.pointerId && ready();
      downId = null;
      if (ok) { e.preventDefault(); fire(e); }
    });
    // キーボード（Enter・スペース）での決定。マウスやタッチの click は pointerup で済ませているので無視する
    b.addEventListener('click', e => { e.stopPropagation(); if (e.detail === 0 && ready()) fire(e); });
  }
}
