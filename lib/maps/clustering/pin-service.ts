/**
 * Pin Service
 * Manages individual pin interactions and state
 */

import { MapContractor } from '../map-service';
import { MapCluster } from './cluster-service';

export interface PinState {
  id: string;
  isSelected: boolean;
  isHovered: boolean;
  isVisible: boolean;
  animationState: 'idle' | 'hovering' | 'selecting' | 'animating';
  lastInteraction: number;
}

export interface PinInteraction {
  type: 'click' | 'hover' | 'select' | 'deselect';
  pinId: string;
  timestamp: number;
  coordinates?: { x: number; y: number };
  clusterId?: string;
}

export interface PinTooltipData {
  contractor: MapContractor;
  position: { x: number; y: number };
  isVisible: boolean;
  delay: number;
}

export interface PinPopupData {
  contractor: MapContractor;
  position: { x: number; y: number };
  isVisible: boolean;
  onClose: () => void;
  onNavigate: (contractorId: string) => void;
}

class PinService {
  private pinStates: Map<string, PinState> = new Map();
  private interactions: PinInteraction[] = [];
  private tooltipData: PinTooltipData | null = null;
  private popupData: PinPopupData | null = null;
  private selectedPinId: string | null = null;
  private hoveredPinId: string | null = null;

  /**
   * Initialize pin state
   */
  initializePin(pinId: string): PinState {
    const state: PinState = {
      id: pinId,
      isSelected: false,
      isHovered: false,
      isVisible: true,
      animationState: 'idle',
      lastInteraction: Date.now(),
    };

    this.pinStates.set(pinId, state);
    return state;
  }

  /**
   * Get pin state
   */
  getPinState(pinId: string): PinState | null {
    return this.pinStates.get(pinId) || null;
  }

  /**
   * Update pin state
   */
  updatePinState(pinId: string, updates: Partial<PinState>): PinState {
    const currentState = this.pinStates.get(pinId);
    if (!currentState) {
      // Initialize pin first, then apply updates
      const initialState = this.initializePin(pinId);
      const newState: PinState = {
        ...initialState,
        ...updates,
        lastInteraction: Date.now(),
      };
      this.pinStates.set(pinId, newState);
      return newState;
    }

    const newState: PinState = {
      ...currentState,
      ...updates,
      lastInteraction: Date.now(),
    };

    this.pinStates.set(pinId, newState);
    return newState;
  }

  /**
   * Handle pin click
   */
  handlePinClick(
    pinId: string,
    contractor: MapContractor,
    coordinates: { x: number; y: number },
    clusterId?: string
  ): void {
    // Record interaction
    this.recordInteraction({
      type: 'click',
      pinId,
      timestamp: Date.now(),
      coordinates,
      clusterId,
    });

    // Update pin state
    this.updatePinState(pinId, {
      isSelected: true,
      animationState: 'selecting',
    });

    // Clear previous selection
    if (this.selectedPinId && this.selectedPinId !== pinId) {
      this.updatePinState(this.selectedPinId, {
        isSelected: false,
        animationState: 'idle',
      });
    }

    this.selectedPinId = pinId;

    // Show popup
    this.showPopup(contractor, coordinates);
  }

  /**
   * Handle pin hover
   */
  handlePinHover(
    pinId: string,
    contractor: MapContractor,
    coordinates: { x: number; y: number },
    clusterId?: string
  ): void {
    // Record interaction
    this.recordInteraction({
      type: 'hover',
      pinId,
      timestamp: Date.now(),
      coordinates,
      clusterId,
    });

    // Update pin state
    this.updatePinState(pinId, {
      isHovered: true,
      animationState: 'hovering',
    });

    // Clear previous hover
    if (this.hoveredPinId && this.hoveredPinId !== pinId) {
      this.updatePinState(this.hoveredPinId, {
        isHovered: false,
        animationState: 'idle',
      });
    }

    this.hoveredPinId = pinId;

    // Show tooltip with delay
    this.showTooltip(contractor, coordinates);
  }

  /**
   * Handle pin hover end
   */
  handlePinHoverEnd(pinId: string): void {
    this.updatePinState(pinId, {
      isHovered: false,
      animationState: 'idle',
    });

    if (this.hoveredPinId === pinId) {
      this.hoveredPinId = null;
    }

    this.hideTooltip();
  }

  /**
   * Handle pin selection
   */
  selectPin(pinId: string): void {
    this.recordInteraction({
      type: 'select',
      pinId,
      timestamp: Date.now(),
    });

    this.updatePinState(pinId, {
      isSelected: true,
      animationState: 'selecting',
    });

    // Clear previous selection
    if (this.selectedPinId && this.selectedPinId !== pinId) {
      this.updatePinState(this.selectedPinId, {
        isSelected: false,
        animationState: 'idle',
      });
    }

    this.selectedPinId = pinId;
  }

  /**
   * Handle pin deselection
   */
  deselectPin(pinId: string): void {
    this.recordInteraction({
      type: 'deselect',
      pinId,
      timestamp: Date.now(),
    });

    this.updatePinState(pinId, {
      isSelected: false,
      animationState: 'idle',
    });

    if (this.selectedPinId === pinId) {
      this.selectedPinId = null;
    }

    this.hidePopup();
  }

  /**
   * Clear all selections
   */
  clearAllSelections(): void {
    this.pinStates.forEach((state, pinId) => {
      this.updatePinState(pinId, {
        isSelected: false,
        isHovered: false,
        animationState: 'idle',
      });
    });

    this.selectedPinId = null;
    this.hoveredPinId = null;
    this.hideTooltip();
    this.hidePopup();
  }

  /**
   * Show tooltip
   */
  private showTooltip(
    contractor: MapContractor,
    coordinates: { x: number; y: number }
  ): void {
    this.tooltipData = {
      contractor,
      position: coordinates,
      isVisible: true,
      delay: 300, // 300ms delay before showing
    };
  }

  /**
   * Hide tooltip
   */
  private hideTooltip(): void {
    if (this.tooltipData) {
      this.tooltipData.isVisible = false;
      // Keep data for a moment to allow for smooth transitions
      setTimeout(() => {
        this.tooltipData = null;
      }, 200);
    }
  }

  /**
   * Show popup
   */
  private showPopup(
    contractor: MapContractor,
    coordinates: { x: number; y: number }
  ): void {
    this.popupData = {
      contractor,
      position: coordinates,
      isVisible: true,
      onClose: () => this.hidePopup(),
      onNavigate: (contractorId: string) => {
        this.hidePopup();
        // Navigation will be handled by the parent component
      },
    };
  }

  /**
   * Hide popup
   */
  private hidePopup(): void {
    if (this.popupData) {
      this.popupData.isVisible = false;
      // Keep data for a moment to allow for smooth transitions
      setTimeout(() => {
        this.popupData = null;
      }, 200);
    }
  }

  /**
   * Record interaction for analytics
   */
  private recordInteraction(interaction: PinInteraction): void {
    this.interactions.push(interaction);

    // Keep only last 100 interactions for performance
    if (this.interactions.length > 100) {
      this.interactions = this.interactions.slice(-100);
    }
  }

  /**
   * Get interaction history
   */
  getInteractions(limit?: number): PinInteraction[] {
    if (limit) {
      return this.interactions.slice(-limit);
    }
    return [...this.interactions];
  }

  /**
   * Get tooltip data
   */
  getTooltipData(): PinTooltipData | null {
    return this.tooltipData;
  }

  /**
   * Get popup data
   */
  getPopupData(): PinPopupData | null {
    return this.popupData;
  }

  /**
   * Get selected pin ID
   */
  getSelectedPinId(): string | null {
    return this.selectedPinId;
  }

  /**
   * Get hovered pin ID
   */
  getHoveredPinId(): string | null {
    return this.hoveredPinId;
  }

  /**
   * Get all pin states
   */
  getAllPinStates(): Map<string, PinState> {
    return new Map(this.pinStates);
  }

  /**
   * Update pin visibility based on filters
   */
  updatePinVisibility(pinIds: string[], isVisible: boolean): void {
    pinIds.forEach(pinId => {
      this.updatePinState(pinId, { isVisible });
    });
  }

  /**
   * Clean up old pin states
   */
  cleanupOldStates(maxAge: number = 300000): number {
    // 5 minutes default
    const now = Date.now();
    const toDelete: string[] = [];

    this.pinStates.forEach((state, pinId) => {
      if (now - state.lastInteraction > maxAge) {
        toDelete.push(pinId);
      }
    });

    toDelete.forEach(pinId => {
      this.pinStates.delete(pinId);
    });

    return toDelete.length;
  }

  /**
   * Reset all states
   */
  reset(): void {
    this.pinStates.clear();
    this.interactions = [];
    this.tooltipData = null;
    this.popupData = null;
    this.selectedPinId = null;
    this.hoveredPinId = null;
  }
}

export const pinService = new PinService();
