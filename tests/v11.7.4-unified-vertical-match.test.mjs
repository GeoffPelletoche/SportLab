import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('V11.7.4 unifies vertical matchup presentation',()=>{
  const dh=read('ui/views/drawhunterView.js'); const nfl=read('ui/views/nflView.js');
  const css=read('assets/drawhunter-premium-v2.css')+read('assets/style.css');
  assert.match(dh,/dh-matchup dh-matchup--vertical/);
  assert.match(nfl,/nfl-matchup nfl-matchup--vertical/);
  assert.match(css,/DrawHunter vertical match \+ compact recent context/);
  assert.match(css,/Unified vertical match presentation/);
  assert.doesNotMatch(dh,/Retrouve le dernier résultat de chaque équipe et ta dernière mise/);
});
