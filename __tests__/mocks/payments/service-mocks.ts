/**
 * Simplified Service Mocks
 * Provides reliable, simple mocking for payment services
 */

export const createStripeServiceMock = () => ({
  getOrCreateCustomer: jest.fn().mockResolvedValue({ id: 'cus_test_123' }),
  createPaymentIntent: jest.fn().mockResolvedValue({
    id: 'pi_test_123',
    client_secret: 'pi_test_123_secret',
    amount: 2999,
    currency: 'nzd',
    status: 'requires_payment_method',
  }),
  confirmPaymentIntent: jest.fn().mockResolvedValue({
    id: 'pi_test_123',
    status: 'succeeded',
    amount: 2999,
    currency: 'nzd',
    metadata: { subscription_id: 'sub_123' },
  }),
  createPaymentMethod: jest.fn().mockResolvedValue({
    id: 'pm_test_123',
    type: 'card',
    card: { brand: 'visa', last4: '4242' },
  }),
  attachPaymentMethod: jest.fn().mockResolvedValue({}),
  getPaymentMethods: jest.fn().mockResolvedValue([]),
  handleWebhook: jest.fn().mockResolvedValue({}),
  getPaymentIntent: jest.fn().mockResolvedValue({}),
  updatePaymentIntent: jest.fn().mockResolvedValue({}),
  detachPaymentMethod: jest.fn().mockResolvedValue({}),
});

export const createPaymentServiceMock = () => ({
  createPayment: jest.fn().mockResolvedValue({
    id: 'payment_123',
    subscription_id: 'sub_123',
    amount: 29.99,
    currency: 'NZD',
    status: 'succeeded',
  }),
  getPayment: jest.fn().mockResolvedValue({
    id: 'payment_123',
    subscription_id: 'sub_123',
    amount: 29.99,
    currency: 'NZD',
    status: 'succeeded',
  }),
  getPaymentsBySubscription: jest.fn().mockResolvedValue([]),
  updatePaymentStatus: jest.fn().mockResolvedValue({}),
  getPaymentHistory: jest.fn().mockResolvedValue([]),
  getPaymentByStripeIntent: jest.fn().mockResolvedValue({}),
  updatePaymentReceipt: jest.fn().mockResolvedValue({}),
  getFailedPayments: jest.fn().mockResolvedValue([]),
});

export const createMethodServiceMock = () => ({
  createPaymentMethod: jest.fn().mockResolvedValue({
    id: 'pm_123',
    user_id: 'user_123',
    type: 'card',
    last_four: '4242',
    brand: 'visa',
  }),
  getPaymentMethods: jest.fn().mockResolvedValue([
    {
      id: 'pm_123',
      user_id: 'user_123',
      type: 'card',
      last_four: '4242',
      brand: 'visa',
      is_default: true,
    },
  ]),
  getPaymentMethod: jest.fn().mockResolvedValue({}),
  updatePaymentMethod: jest.fn().mockResolvedValue({}),
  deletePaymentMethod: jest.fn().mockResolvedValue({ success: true }),
  setDefaultPaymentMethod: jest.fn().mockResolvedValue({}),
  getDefaultPaymentMethod: jest.fn().mockResolvedValue({}),
  getPaymentMethodByStripeId: jest.fn().mockResolvedValue({}),
  validatePaymentMethod: jest.fn().mockResolvedValue(true),
});

export const createFailedPaymentServiceMock = () => ({
  createFailedPayment: jest.fn().mockResolvedValue({
    id: 'failed_123',
    payment_id: 'payment_123',
    failure_count: 1,
    grace_period_end: '2024-01-08T00:00:00Z',
    status: 'active',
  }),
  getFailedPayments: jest.fn().mockResolvedValue([
    {
      id: 'failed_123',
      payment_id: 'payment_123',
      failure_count: 1,
      grace_period_end: '2024-01-08T00:00:00Z',
      status: 'active',
    },
  ]),
  getFailedPayment: jest.fn().mockResolvedValue({}),
  updateFailedPayment: jest.fn().mockResolvedValue({}),
  incrementFailureCount: jest.fn().mockResolvedValue({}),
  addNotificationSentDay: jest.fn().mockResolvedValue({}),
  incrementRetryAttempts: jest.fn().mockResolvedValue({}),
  getExpiredFailedPayments: jest.fn().mockResolvedValue([]),
  getFailedPaymentsRequiringNotification: jest.fn().mockResolvedValue([]),
  resolveFailedPayment: jest.fn().mockResolvedValue({}),
  deleteFailedPayment: jest.fn().mockResolvedValue({}),
  getFailedPaymentStatistics: jest.fn().mockResolvedValue({}),
  retryFailedPayment: jest.fn().mockResolvedValue({
    success: true,
    payment: { id: 'payment_123', status: 'succeeded' },
  }),
});

export const createNotificationServiceMock = () => ({
  sendPaymentSuccessNotification: jest.fn().mockResolvedValue({}),
  sendPaymentFailedNotification: jest.fn().mockResolvedValue({}),
  sendReceiptNotification: jest.fn().mockResolvedValue({}),
  sendFailedPaymentNotification: jest.fn().mockResolvedValue({}),
  sendReceiptNotification: jest.fn().mockResolvedValue({}),
  updateNotificationStatus: jest.fn().mockResolvedValue({}),
  getNotification: jest.fn().mockResolvedValue({}),
  deleteNotification: jest.fn().mockResolvedValue({}),
  getNotificationStatistics: jest.fn().mockResolvedValue({}),
  sendEmail: jest.fn().mockResolvedValue({}),
  getNotificationTemplates: jest.fn().mockResolvedValue([]),
});

export const createReceiptServiceMock = () => ({
  createReceipt: jest.fn().mockResolvedValue({
    id: 'receipt_123',
    payment_id: 'payment_123',
    receipt_url: 'https://example.com/receipt.pdf',
  }),
  getReceipt: jest.fn().mockResolvedValue({}),
  getReceiptsByUser: jest.fn().mockResolvedValue([]),
  downloadReceipt: jest.fn().mockResolvedValue({}),
  updateReceiptStatus: jest.fn().mockResolvedValue({}),
  deleteReceipt: jest.fn().mockResolvedValue({}),
  sendReceipt: jest.fn().mockResolvedValue({}),
  sendReceiptEmail: jest.fn().mockResolvedValue({}),
  getReceiptInfo: jest.fn().mockResolvedValue({}),
});

export const createBankTransferServiceMock = () => ({
  createBankTransfer: jest.fn().mockResolvedValue({
    id: 'bt_123',
    subscription_id: 'sub_123',
    amount: 29.99,
    reference: 'BT123456',
  }),
  getBankTransfer: jest.fn().mockResolvedValue({}),
  updateBankTransferStatus: jest.fn().mockResolvedValue({}),
  getBankTransfersByUser: jest.fn().mockResolvedValue([]),
  getPendingBankTransfers: jest.fn().mockResolvedValue([]),
  getBankTransferInstructions: jest.fn().mockResolvedValue({}),
});

export const createFraudDetectionServiceMock = () => ({
  analyzePaymentRisk: jest.fn().mockResolvedValue({
    riskScore: 0.2,
    riskLevel: 'low',
    factors: [],
  }),
  checkBlacklist: jest.fn().mockResolvedValue(false),
  analyzeBehaviorPatterns: jest.fn().mockResolvedValue({}),
  calculateRiskScore: jest.fn().mockResolvedValue(0.2),
  getRiskLevel: jest.fn().mockResolvedValue('low'),
  logFraudEvent: jest.fn().mockResolvedValue({}),
  getFraudStatistics: jest.fn().mockResolvedValue({}),
  updateBlacklist: jest.fn().mockResolvedValue({}),
});

export const createAuditLogServiceMock = () => ({
  logPaymentEvent: jest.fn().mockResolvedValue({}),
  logSecurityEvent: jest.fn().mockResolvedValue({}),
  getUserAuditLogs: jest.fn().mockResolvedValue([]),
  getAuditLogs: jest.fn().mockResolvedValue([]),
  getAuditLog: jest.fn().mockResolvedValue({}),
  deleteAuditLog: jest.fn().mockResolvedValue({}),
  getAuditStatistics: jest.fn().mockResolvedValue({}),
});

// Add a simple test to make this file valid for Jest
describe('Service Mocks', () => {
  it('should create service mocks', () => {
    expect(createStripeServiceMock()).toBeDefined();
    expect(createPaymentServiceMock()).toBeDefined();
    expect(createMethodServiceMock()).toBeDefined();
    expect(createFailedPaymentServiceMock()).toBeDefined();
    expect(createNotificationServiceMock()).toBeDefined();
    expect(createReceiptServiceMock()).toBeDefined();
    expect(createBankTransferServiceMock()).toBeDefined();
    expect(createFraudDetectionServiceMock()).toBeDefined();
    expect(createAuditLogServiceMock()).toBeDefined();
  });
});
