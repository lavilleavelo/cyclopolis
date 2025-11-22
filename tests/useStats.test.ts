import { assert, describe, it } from 'vitest';

import { useStats } from '../composables/useStats';
import {
  vl2StRambertCommun,
  vl3StRambertCommun,
  vl5PierreBeniteNordCommun,
  vl6CoursHerbouville,
} from './useStats.fixtures';
const { getAllUniqLineStrings, getStatsByTypology } = useStats();

describe('useStats', () => {
  describe('getAllUniqLineStrings', () => {
    describe('When the is more than one feature with the same id', () => {
      it('should only keep the 1st feature with that id. id are used to handle common section between lines. We should use one and only one id (deduplicate) when computing distances', () => {
        const voies = [
          { type: 'FeatureCollection', features: [vl2StRambertCommun] },
          { type: 'FeatureCollection', features: [vl3StRambertCommun] },
        ];
        const uniqLineStrings = getAllUniqLineStrings(voies);
        assert.deepEqual(uniqLineStrings, [vl2StRambertCommun]);
      });
    });
  });

  describe('getStatsByTypology', () => {
    describe('When there is a single type of cycle lane', () => {
      it('should return 100% for that type', () => {
        const voies = [{ type: 'FeatureCollection', features: [vl2StRambertCommun] }];
        const stats = getStatsByTypology(voies);
        assert.deepEqual(stats, [{ name: 'Inconnu', percent: 100 }]);
      });
    });
    describe('When there are 2 types of cycle lane, both having same coordinates', () => {
      it('should return 50% for both types', () => {
        const voies = [{ type: 'FeatureCollection', features: [vl2StRambertCommun, vl5PierreBeniteNordCommun] }];
        const stats = getStatsByTypology(voies);
        assert.deepEqual(stats, [
          { name: 'Inconnu', percent: 50 },
          { name: 'Piste bilatérale', percent: 50 },
        ]);
      });
    });
    describe('When there are 3 sections with 2 types of cycle lane, all having same coordinates', () => {
      it('should return 33% and 67%', () => {
        const voies = [
          { type: 'FeatureCollection', features: [vl2StRambertCommun, vl5PierreBeniteNordCommun, vl6CoursHerbouville] },
        ];
        const stats = getStatsByTypology(voies);
        assert.deepEqual(stats, [
          { name: 'Piste bilatérale', percent: 67 },
          { name: 'Inconnu', percent: 33 },
        ]);
      });
    });
  });
});
