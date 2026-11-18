import { assert, describe, it } from 'vitest';

import {
  customRangeFrom,
  dayRangeQueryParam,
  statsPeriodQueryParam,
  statsPeriodRange,
} from '../composables/useCounterDetailedStats';

describe('useCounterDetailedStats', () => {
  describe('statsPeriodQueryParam', () => {
    const codec = statsPeriodQueryParam();

    it('should round-trip presets, years and custom ranges', () => {
      assert.equal(codec.parse('3-mois'), '3-mois');
      assert.equal(codec.parse('2025'), 2025);
      assert.deepEqual(codec.parse('2026-09-01_2026-10-16'), { from: '2026-09-01', to: '2026-10-16' });

      assert.equal(codec.serialize('recent'), 'recent');
      assert.equal(codec.serialize(2025), '2025');
      assert.equal(codec.serialize({ from: '2026-09-01', to: '2026-10-16' }), '2026-09-01_2026-10-16');
    });

    it('should ignore unknown values, reversed ranges and dates that do not exist', () => {
      assert.isUndefined(codec.parse('9-mois'));
      assert.isUndefined(codec.parse('2026-10-16_2026-09-01'));
      assert.isUndefined(codec.parse('2026-13-01_2026-13-05'));
      assert.isUndefined(codec.parse('2026-09-01'));
    });
  });

  describe('dayRangeQueryParam', () => {
    const codec = dayRangeQueryParam();

    it('should round-trip a range and serialize no range as empty', () => {
      assert.deepEqual(codec.parse('2026-09-01_2026-10-16'), { from: '2026-09-01', to: '2026-10-16' });
      assert.equal(codec.serialize({ from: '2026-09-01', to: '2026-10-16' }), '2026-09-01_2026-10-16');
      assert.equal(codec.serialize(null), '');
    });

    it('should ignore reversed ranges and dates that do not exist', () => {
      assert.isUndefined(codec.parse('2026-10-16_2026-09-01'));
      assert.isUndefined(codec.parse('2026-13-01_2026-13-05'));
      assert.isUndefined(codec.parse('1a'));
    });
  });

  describe('statsPeriodRange', () => {
    it('should return the range to fetch for the last months and for a custom range', () => {
      assert.deepEqual(statsPeriodRange('3-mois', '2026-11-16'), { from: '2026-08-17', to: '2026-11-16' });
      assert.deepEqual(statsPeriodRange({ from: '2026-09-01', to: '2026-10-16' }, '2026-11-16'), {
        from: '2026-09-01',
        to: '2026-10-16',
      });
    });

    it('should return nothing for the periods already loaded', () => {
      assert.isNull(statsPeriodRange('recent', '2026-11-16'));
      assert.isNull(statsPeriodRange(2025, '2026-11-16'));
      assert.isNull(statsPeriodRange('3-mois', undefined));
    });
  });

  describe('customRangeFrom', () => {
    const firstDay = '2015-03-10';
    const lastDay = '2026-11-16';

    it('should start from the dates of the period displayed', () => {
      assert.deepEqual(customRangeFrom('6-mois', firstDay, lastDay), { from: '2026-05-17', to: lastDay });
      assert.deepEqual(customRangeFrom('recent', firstDay, lastDay), { from: '2025-11-17', to: lastDay });
      assert.deepEqual(customRangeFrom(2025, firstDay, lastDay), { from: '2025-01-01', to: '2025-12-31' });
    });

    it('should stay within the days measured by the counter', () => {
      assert.deepEqual(customRangeFrom(2026, firstDay, lastDay), { from: '2026-01-01', to: lastDay });
      assert.deepEqual(customRangeFrom(2015, firstDay, lastDay), { from: firstDay, to: '2015-12-31' });
      assert.deepEqual(customRangeFrom('recent', '2026-10-01', lastDay), { from: '2026-10-01', to: lastDay });
    });
  });
});
