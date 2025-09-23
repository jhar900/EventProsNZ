/**
 * Pin Service Tests
 * Tests for the pin interaction service functionality
 */

import { pinService, PinState } from '@/lib/maps/clustering/pin-service';
import { MapContractor } from '@/lib/maps/map-service';

// Mock contractor for testing
const mockContractor: MapContractor = {
  id: 'test-contractor-1',
  company_name: 'Test Catering',
  business_address: '123 Main St, Auckland',
  service_type: 'catering',
  location: { lat: -36.8485, lng: 174.7633 },
  is_verified: true,
  subscription_tier: 'premium',
};

describe('PinService', () => {
  beforeEach(() => {
    pinService.reset();
  });

  describe('initializePin', () => {
    it('should initialize pin state', () => {
      const state = pinService.initializePin('test-pin-1');

      expect(state.id).toBe('test-pin-1');
      expect(state.isSelected).toBe(false);
      expect(state.isHovered).toBe(false);
      expect(state.isVisible).toBe(true);
      expect(state.animationState).toBe('idle');
      expect(state.lastInteraction).toBeGreaterThan(0);
    });
  });

  describe('getPinState', () => {
    it('should return pin state if exists', () => {
      pinService.initializePin('test-pin-1');
      const state = pinService.getPinState('test-pin-1');

      expect(state).not.toBeNull();
      expect(state?.id).toBe('test-pin-1');
    });

    it('should return null if pin does not exist', () => {
      const state = pinService.getPinState('non-existent-pin');
      expect(state).toBeNull();
    });
  });

  describe('updatePinState', () => {
    it('should update existing pin state', () => {
      pinService.initializePin('test-pin-1');
      const updatedState = pinService.updatePinState('test-pin-1', {
        isSelected: true,
        animationState: 'selecting',
      });

      expect(updatedState.isSelected).toBe(true);
      expect(updatedState.animationState).toBe('selecting');
    });

    it('should initialize pin if it does not exist', () => {
      const state = pinService.updatePinState('new-pin', {
        isSelected: true,
      });

      expect(state.id).toBe('new-pin');
      expect(state.isSelected).toBe(true);
    });
  });

  describe('handlePinClick', () => {
    it('should handle pin click and update state', () => {
      const coordinates = { x: 100, y: 200 };
      pinService.handlePinClick('test-pin-1', mockContractor, coordinates);

      const state = pinService.getPinState('test-pin-1');
      expect(state?.isSelected).toBe(true);
      expect(state?.animationState).toBe('selecting');

      const interactions = pinService.getInteractions();
      expect(interactions).toHaveLength(1);
      expect(interactions[0].type).toBe('click');
      expect(interactions[0].pinId).toBe('test-pin-1');
    });

    it('should clear previous selection when selecting new pin', () => {
      pinService.initializePin('pin-1');
      pinService.initializePin('pin-2');

      pinService.handlePinClick('pin-1', mockContractor, { x: 100, y: 200 });
      pinService.handlePinClick('pin-2', mockContractor, { x: 150, y: 250 });

      const state1 = pinService.getPinState('pin-1');
      const state2 = pinService.getPinState('pin-2');

      expect(state1?.isSelected).toBe(false);
      expect(state2?.isSelected).toBe(true);
    });
  });

  describe('handlePinHover', () => {
    it('should handle pin hover and update state', () => {
      const coordinates = { x: 100, y: 200 };
      pinService.handlePinHover('test-pin-1', mockContractor, coordinates);

      const state = pinService.getPinState('test-pin-1');
      expect(state?.isHovered).toBe(true);
      expect(state?.animationState).toBe('hovering');

      const interactions = pinService.getInteractions();
      expect(interactions).toHaveLength(1);
      expect(interactions[0].type).toBe('hover');
    });

    it('should clear previous hover when hovering new pin', () => {
      pinService.initializePin('pin-1');
      pinService.initializePin('pin-2');

      pinService.handlePinHover('pin-1', mockContractor, { x: 100, y: 200 });
      pinService.handlePinHover('pin-2', mockContractor, { x: 150, y: 250 });

      const state1 = pinService.getPinState('pin-1');
      const state2 = pinService.getPinState('pin-2');

      expect(state1?.isHovered).toBe(false);
      expect(state2?.isHovered).toBe(true);
    });
  });

  describe('handlePinHoverEnd', () => {
    it('should handle pin hover end and update state', () => {
      pinService.initializePin('test-pin-1');
      pinService.handlePinHover('test-pin-1', mockContractor, {
        x: 100,
        y: 200,
      });
      pinService.handlePinHoverEnd('test-pin-1');

      const state = pinService.getPinState('test-pin-1');
      expect(state?.isHovered).toBe(false);
      expect(state?.animationState).toBe('idle');
    });
  });

  describe('selectPin', () => {
    it('should select pin and clear previous selection', () => {
      pinService.initializePin('pin-1');
      pinService.initializePin('pin-2');

      pinService.selectPin('pin-1');
      pinService.selectPin('pin-2');

      const state1 = pinService.getPinState('pin-1');
      const state2 = pinService.getPinState('pin-2');

      expect(state1?.isSelected).toBe(false);
      expect(state2?.isSelected).toBe(true);
    });
  });

  describe('deselectPin', () => {
    it('should deselect pin', () => {
      pinService.initializePin('test-pin-1');
      pinService.selectPin('test-pin-1');
      pinService.deselectPin('test-pin-1');

      const state = pinService.getPinState('test-pin-1');
      expect(state?.isSelected).toBe(false);
      expect(state?.animationState).toBe('idle');
    });
  });

  describe('clearAllSelections', () => {
    it('should clear all selections and hover states', () => {
      pinService.initializePin('pin-1');
      pinService.initializePin('pin-2');

      pinService.selectPin('pin-1');
      pinService.handlePinHover('pin-2', mockContractor, { x: 100, y: 200 });

      pinService.clearAllSelections();

      const state1 = pinService.getPinState('pin-1');
      const state2 = pinService.getPinState('pin-2');

      expect(state1?.isSelected).toBe(false);
      expect(state2?.isHovered).toBe(false);
      expect(pinService.getSelectedPinId()).toBeNull();
      expect(pinService.getHoveredPinId()).toBeNull();
    });
  });

  describe('getInteractions', () => {
    it('should return interaction history', () => {
      pinService.handlePinClick('test-pin-1', mockContractor, {
        x: 100,
        y: 200,
      });
      pinService.handlePinHover('test-pin-1', mockContractor, {
        x: 150,
        y: 250,
      });

      const interactions = pinService.getInteractions();
      expect(interactions).toHaveLength(2);
      expect(interactions[0].type).toBe('click');
      expect(interactions[1].type).toBe('hover');
    });

    it('should limit interactions to 100', () => {
      // Generate 150 interactions
      for (let i = 0; i < 150; i++) {
        pinService.handlePinClick(`pin-${i}`, mockContractor, {
          x: 100,
          y: 200,
        });
      }

      const interactions = pinService.getInteractions();
      expect(interactions).toHaveLength(100);
    });
  });

  describe('getTooltipData', () => {
    it('should return tooltip data when visible', () => {
      pinService.handlePinHover('test-pin-1', mockContractor, {
        x: 100,
        y: 200,
      });

      const tooltipData = pinService.getTooltipData();
      expect(tooltipData).not.toBeNull();
      expect(tooltipData?.contractor).toBe(mockContractor);
      expect(tooltipData?.position).toEqual({ x: 100, y: 200 });
      expect(tooltipData?.isVisible).toBe(true);
    });

    it('should return null when no tooltip is visible', () => {
      const tooltipData = pinService.getTooltipData();
      expect(tooltipData).toBeNull();
    });
  });

  describe('getPopupData', () => {
    it('should return popup data when visible', () => {
      pinService.handlePinClick('test-pin-1', mockContractor, {
        x: 100,
        y: 200,
      });

      const popupData = pinService.getPopupData();
      expect(popupData).not.toBeNull();
      expect(popupData?.contractor).toBe(mockContractor);
      expect(popupData?.position).toEqual({ x: 100, y: 200 });
      expect(popupData?.isVisible).toBe(true);
    });

    it('should return null when no popup is visible', () => {
      const popupData = pinService.getPopupData();
      expect(popupData).toBeNull();
    });
  });

  describe('updatePinVisibility', () => {
    it('should update pin visibility', () => {
      pinService.initializePin('pin-1');
      pinService.initializePin('pin-2');

      pinService.updatePinVisibility(['pin-1', 'pin-2'], false);

      const state1 = pinService.getPinState('pin-1');
      const state2 = pinService.getPinState('pin-2');

      expect(state1?.isVisible).toBe(false);
      expect(state2?.isVisible).toBe(false);
    });
  });

  describe('cleanupOldStates', () => {
    it('should cleanup old pin states', () => {
      pinService.initializePin('old-pin');

      // Mock old timestamp
      const oldState = pinService.getPinState('old-pin');
      if (oldState) {
        oldState.lastInteraction = Date.now() - 400000; // 6+ minutes ago
      }

      const cleanedCount = pinService.cleanupOldStates(300000); // 5 minutes
      expect(cleanedCount).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset all states', () => {
      pinService.initializePin('test-pin-1');
      pinService.handlePinClick('test-pin-1', mockContractor, {
        x: 100,
        y: 200,
      });

      pinService.reset();

      expect(pinService.getPinState('test-pin-1')).toBeNull();
      expect(pinService.getInteractions()).toHaveLength(0);
      expect(pinService.getTooltipData()).toBeNull();
      expect(pinService.getPopupData()).toBeNull();
      expect(pinService.getSelectedPinId()).toBeNull();
      expect(pinService.getHoveredPinId()).toBeNull();
    });
  });
});
