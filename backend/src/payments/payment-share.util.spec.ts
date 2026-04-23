import { calculateShare } from './payment-share.util';

describe('calculateShare', () => {
  it('splits equally when nobody has paid', () => {
    expect(
      calculateShare({
        totalAmount: 100000,
        confirmedTotal: 0,
        maxPlayers: 5,
        confirmedCount: 0,
      }),
    ).toBe(20000);
  });

  it('adjusts share after some players paid', () => {
    expect(
      calculateShare({
        totalAmount: 100000,
        confirmedTotal: 20000,
        maxPlayers: 5,
        confirmedCount: 1,
      }),
    ).toBe(20000);
  });

  it('uses ceil to avoid fractional soums', () => {
    expect(
      calculateShare({
        totalAmount: 100001,
        confirmedTotal: 0,
        maxPlayers: 3,
        confirmedCount: 0,
      }),
    ).toBe(33334);
  });

  it('handles overpay: remaining spread over fewer players', () => {
    expect(
      calculateShare({
        totalAmount: 100000,
        confirmedTotal: 25000,
        maxPlayers: 5,
        confirmedCount: 1,
      }),
    ).toBe(18750);
  });

  it('returns 0 when fully paid', () => {
    expect(
      calculateShare({
        totalAmount: 100000,
        confirmedTotal: 100000,
        maxPlayers: 5,
        confirmedCount: 5,
      }),
    ).toBe(0);
  });
});
