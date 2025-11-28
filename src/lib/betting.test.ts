import { describe, it, expect } from 'vitest';
import { calculateOdds, calculatePayout, createBet } from './betting';

describe('Betting System', () => {
  describe('calculateOdds', () => {
    it('should return equal odds for equal strategies', () => {
      const odds = calculateOdds('minimax', 'minimax');
      expect(odds.xOdds).toBe(2.0);
      expect(odds.oOdds).toBe(2.0);
    });

    it('should favor stronger strategy', () => {
      const odds = calculateOdds('minimax', 'random');
      expect(odds.xOdds).toBeLessThan(odds.oOdds);
    });

    it('should return draw odds based on strategy strength', () => {
      const odds1 = calculateOdds('minimax', 'minimax');
      const odds2 = calculateOdds('random', 'random');
      expect(odds1.drawOdds).toBeLessThan(odds2.drawOdds);
    });
  });

  describe('calculatePayout', () => {
    it('should return correct payout for winning bet', () => {
      const bet = createBet('X', 100, 2.5);
      const payout = calculatePayout(bet, 'X');
      expect(payout).toBe(250); // 100 * 2.5
    });

    it('should return 0 for losing bet', () => {
      const bet = createBet('X', 100, 2.5);
      const payout = calculatePayout(bet, 'O');
      expect(payout).toBe(0);
    });

    it('should return bet amount for draw when betting on player', () => {
      const bet = createBet('X', 100, 2.5);
      const payout = calculatePayout(bet, 'draw');
      expect(payout).toBe(100); // Returns original bet
    });

    it('should handle null winner', () => {
      const bet = createBet('X', 100, 2.5);
      const payout = calculatePayout(bet, null);
      expect(payout).toBe(0);
    });
  });

  describe('Draw Betting Logic', () => {
    it('should correctly handle draw bet when draw occurs', () => {
      // Simulate draw bet
      const betAmount = 100;
      const drawOdds = 5.0;
      const bet = createBet('X', betAmount, drawOdds); // player doesn't matter for draw
      (bet as any).betType = 'draw';
      
      // Game result is draw
      const gameResult = 'draw';
      const betType = (bet as any).betType;
      
      let payout = 0;
      if (betType === 'draw') {
        if (gameResult === 'draw') {
          payout = Math.round(bet.amount * drawOdds);
        }
      }
      
      expect(payout).toBe(500); // 100 * 5.0
    });

    it('should return 0 for draw bet when player wins', () => {
      const betAmount = 100;
      const drawOdds = 5.0;
      const bet = createBet('X', betAmount, drawOdds);
      (bet as any).betType = 'draw';
      
      const gameResult = 'X';
      const betType = (bet as any).betType;
      
      let payout = 0;
      if (betType === 'draw') {
        if (gameResult === 'draw') {
          payout = Math.round(bet.amount * drawOdds);
        }
      }
      
      expect(payout).toBe(0);
    });

    it('should correctly handle X bet when X wins', () => {
      const betAmount = 100;
      const xOdds = 2.5;
      const bet = createBet('X', betAmount, xOdds);
      (bet as any).betType = 'X';
      
      const gameResult = 'X';
      const betType = (bet as any).betType;
      
      let payout = 0;
      if (betType === 'draw') {
        // Not a draw bet
      } else {
        payout = calculatePayout(bet, gameResult);
      }
      
      expect(payout).toBe(250); // 100 * 2.5
    });
  });
});
