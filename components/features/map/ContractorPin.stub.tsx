// Stub component to prevent infinite re-render loops in tests
import React from 'react';

interface ContractorPinProps {
  contractor: any;
  mapInstance: any;
  onClick?: () => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
}

const ContractorPin: React.FC<ContractorPinProps> = ({
  contractor,
  mapInstance,
  onClick,
  onHover,
  onHoverEnd,
}) => {
  return (
    <div data-testid="contractor-pin-stub">
      Mocked Contractor Pin for {contractor?.company_name || 'Unknown'}
    </div>
  );
};

export default ContractorPin;

