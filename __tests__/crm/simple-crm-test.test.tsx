import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BasicCRM } from '@/components/features/crm/BasicCRM';

describe('Simple CRM Test', () => {
  it('should render ContactManagement component', () => {
    render(<BasicCRM />);
    expect(screen.getByText('CRM Dashboard')).toBeInTheDocument();
  });
});
