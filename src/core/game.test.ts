import { describe, expect, it } from 'vitest';
import {
  CARESSES_PER_HOUR, DAILY_COINS, START_COINS, awardBadges, buyOutfit, canPlay, caressPet, checkIn, cleanName, dayKey,
  feedPet, finishMinigame, hatch, newGame, rename, rewardFor, wear,
} from './game';
import { FOODS, setSleeping } from './pet';

const HOUR = 3_600_000;
const [corn, worm, berry] = FOODS;
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

describe('nacimiento', () => {
  it('Pío nace con el nombre elegido, limpio y corto', () => {
    const g = hatch(newGame(0), '   Pollito   Amarillo  Feliz ', 50);
    expect(g.hatched).toBe(true);
    expect(g.pet.name).toBe('Pollito Am');
    expect(g.pet.updatedAt).toBe(50);
  });

  it('sin nombre se llama Pío', () => {
    expect(hatch(newGame(0), '   ', 0).pet.name).toBe('Pío');
    expect(cleanName('a\n\tb')).toBe('a b');
  });
});

describe('racha diaria', () => {
  it('la primera visita del día da monedas y empieza la racha', () => {
    const r = checkIn(newGame(0), at(2026, 10, 8));
    expect(r.reward).toBe(DAILY_COINS);
    expect(r.state.coins).toBe(START_COINS + DAILY_COINS);
    expect(r.state.streak).toEqual({ count: 1, lastDay: '2026-10-08' });
  });

  it('volver el mismo día no da nada extra', () => {
    const first = checkIn(newGame(0), at(2026, 10, 8, 9)).state;
    const again = checkIn(first, at(2026, 10, 8, 22));
    expect(again.reward).toBe(0);
    expect(again.state).toBe(first);
  });

  it('días seguidos suman, aunque cambie el mes', () => {
    let g = checkIn(newGame(0), at(2026, 10, 30)).state;
    g = checkIn(g, at(2026, 10, 31)).state;
    g = checkIn(g, at(2026, 11, 1)).state;
    expect(g.streak.count).toBe(3);
  });

  it('saltarse un día reinicia la racha', () => {
    let g = checkIn(newGame(0), at(2026, 10, 8)).state;
    g = checkIn(g, at(2026, 10, 10)).state;
    expect(g.streak.count).toBe(1);
  });

  it('dayKey usa la fecha local', () => {
    expect(dayKey(at(2026, 1, 5, 23))).toBe('2026-01-05');
  });
});

describe('comida con monedas', () => {
  it('el maíz es gratis y el gusano cuesta monedas', () => {
    const g = { ...newGame(0), pet: { ...newGame(0).pet, food: 20 } };
    const a = feedPet(g, corn);
    expect(a.ok && a.state.coins).toBe(START_COINS);
    const b = feedPet(g, worm);
    expect(b.ok && b.state.coins).toBe(START_COINS - worm.cost);
  });

  it('sin monedas suficientes no se puede comprar fresa', () => {
    expect(feedPet({ ...newGame(0), coins: berry.cost - 1 }, berry)).toEqual({ ok: false, reason: 'sin-monedas' });
  });

  it('si está lleno no se cobra', () => {
    const g = { ...newGame(0), pet: { ...newGame(0).pet, food: 100 } };
    expect(feedPet(g, worm)).toEqual({ ok: false, reason: 'lleno' });
  });
});

describe('caricias', () => {
  it('solo 5 caricias por hora suben la alegría', () => {
    let g = { ...newGame(0), pet: { ...newGame(0).pet, joy: 0 } };
    for (let i = 0; i < CARESSES_PER_HOUR; i++) {
      const r = caressPet(g, i * 1000);
      if (!r.ok) throw new Error('debería aceptar la caricia');
      g = r.state;
    }
    expect(g.pet.joy).toBe(8 * CARESSES_PER_HOUR);
    expect(caressPet(g, 10_000)).toEqual({ ok: false, reason: 'cansado-de-mimos' });
    expect(caressPet(g, HOUR + 1).ok).toBe(true);
  });

  it('dormido no se acaricia', () => {
    const g = { ...newGame(0), pet: setSleeping(newGame(0).pet, true) };
    expect(caressPet(g, 0)).toEqual({ ok: false, reason: 'dormido' });
  });
});

describe('ropa', () => {
  it('el sombrero ya es tuyo, el moño hay que comprarlo', () => {
    const g = newGame(0);
    expect(wear(g, 'hat').ok).toBe(true);
    expect(wear(g, 'bow')).toEqual({ ok: false, reason: 'no-la-tienes' });
    expect(buyOutfit(g, 'bow')).toEqual({ ok: false, reason: 'sin-monedas' });
    const bought = buyOutfit({ ...g, coins: 60 }, 'bow');
    expect(bought.ok && bought.state.coins).toBe(10);
    expect(bought.ok && bought.state.owned).toContain('bow');
  });

  it('comprar algo que ya tienes no cobra de nuevo', () => {
    const g = { ...newGame(0), coins: 500 };
    const r = buyOutfit(g, 'hat');
    expect(r.ok && r.state.coins).toBe(500);
  });
});

describe('insignias', () => {
  it('se ganan al cumplir la condición y no se repiten', () => {
    const g = { ...newGame(0), outfit: 'hat' as const, pet: { ...newGame(0).pet, food: 90 } };
    const first = awardBadges(g);
    expect(first.added).toEqual(['fed', 'fashion']);
    expect(awardBadges(first.state).added).toEqual([]);
  });

  it('dulces sueños requiere estar dormido', () => {
    const awake = { ...newGame(0), pet: { ...newGame(0).pet, energy: 95 } };
    expect(awardBadges(awake).added).not.toContain('rested');
    const asleep = { ...awake, pet: setSleeping(awake.pet, true) };
    expect(awardBadges(asleep).added).toContain('rested');
  });

  it('racha de 7 días', () => {
    const g = { ...newGame(0), streak: { count: 7, lastDay: '2026-10-08' } };
    expect(awardBadges(g).added).toContain('streak7');
  });
});

describe('minijuegos', () => {
  it('no quiere jugar dormido ni muy cansado', () => {
    expect(canPlay({ ...newGame(0), pet: setSleeping(newGame(0).pet, true) })).toEqual({ ok: false, reason: 'dormido' });
    expect(canPlay({ ...newGame(0), pet: { ...newGame(0).pet, energy: 10 } })).toEqual({ ok: false, reason: 'sin-energia' });
    expect(canPlay(newGame(0)).ok).toBe(true);
  });

  it('terminar una partida da alegría y monedas y cansa', () => {
    const g = { ...newGame(0), pet: { ...newGame(0).pet, joy: 50, energy: 60 } };
    const r = finishMinigame(g, 'bugs', 27);
    expect(r.reward).toEqual({ joy: 12, coins: 5, best: true });
    expect(r.state.pet.joy).toBe(62);
    expect(r.state.pet.energy).toBe(50);
    expect(r.state.coins).toBe(START_COINS + 5);
    expect(r.state.best.bugs).toBe(27);
    expect(finishMinigame(r.state, 'bugs', 10).reward.best).toBe(false);
  });

  it('la alegría por partida tiene tope de 40', () => {
    expect(rewardFor(1000).joy).toBe(40);
    expect(rewardFor(0)).toEqual({ joy: 10, coins: 0 });
  });

  it('la insignia Gamer pide jugar los dos minijuegos', () => {
    const one = finishMinigame(newGame(0), 'runner', 3).state;
    expect(awardBadges(one).added).not.toContain('gamer');
    const both = finishMinigame(one, 'bugs', 3).state;
    expect(awardBadges(both).added).toContain('gamer');
  });

  it('cambiar el nombre ignora nombres vacíos', () => {
    expect(rename(newGame(0), '  Coco ').pet.name).toBe('Coco');
    expect(rename(newGame(0), '   ').pet.name).toBe('Pío');
  });
});
