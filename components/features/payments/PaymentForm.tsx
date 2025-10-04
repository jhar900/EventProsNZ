/**
 * Payment Form Component
 * Secure payment form with validation and multiple payment method support
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Shield, Lock } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';

const paymentFormSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.string().min(1, 'Currency is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  cardNumber: z.string().optional(),
  expiryMonth: z.string().optional(),
  expiryYear: z.string().optional(),
  cvv: z.string().optional(),
  cardholderName: z.string().optional(),
  savePaymentMethod: z.boolean().optional(),
  termsAccepted: z
    .boolean()
    .refine(val => val === true, 'You must accept the terms'),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  subscriptionId: string;
  amount: number;
  currency?: string;
  onSuccess?: (payment: any) => void;
  onError?: (error: string) => void;
}

export function PaymentForm({
  subscriptionId,
  amount,
  currency = 'NZD',
  onSuccess,
  onError,
}: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>('');

  const { createPaymentIntent, confirmPayment, getPaymentMethods } =
    usePayment();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount,
      currency,
      paymentMethod: '',
      savePaymentMethod: false,
      termsAccepted: false,
    },
  });

  const watchedPaymentMethod = watch('paymentMethod');

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    if (watchedPaymentMethod === 'new_card') {
      setSelectedPaymentMethod('new_card');
    } else if (watchedPaymentMethod && watchedPaymentMethod !== 'new_card') {
      setSelectedPaymentMethod(watchedPaymentMethod);
    }
  }, [watchedPaymentMethod]);

  const loadPaymentMethods = async () => {
    try {
      const methods = await getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    }
  };

  const onSubmit = async (data: PaymentFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Create payment intent
      const paymentIntent = await createPaymentIntent({
        subscription_id: subscriptionId,
        amount: data.amount,
        currency: data.currency,
      });

      // Confirm payment
      const payment = await confirmPayment({
        payment_intent_id: paymentIntent.payment_intent_id,
        payment_method_id:
          selectedPaymentMethod === 'new_card'
            ? undefined
            : selectedPaymentMethod,
      });

      onSuccess?.(payment);
    } catch (error: any) {
      const errorMessage = error.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Amount Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Amount to Pay</span>
              <span className="text-2xl font-bold">
                {currency} ${amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={selectedPaymentMethod}
              onValueChange={value => {
                setSelectedPaymentMethod(value);
                setValue('paymentMethod', value, { shouldValidate: true });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new_card">New Credit Card</SelectItem>
                {paymentMethods.map(method => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.brand?.toUpperCase()} •••• {method.last_four}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.paymentMethod && (
              <p className="text-sm text-red-600">
                {errors.paymentMethod.message}
              </p>
            )}
          </div>

          {/* New Card Form */}
          {selectedPaymentMethod === 'new_card' && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium">Card Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    {...register('cardNumber')}
                  />
                  {errors.cardNumber && (
                    <p className="text-sm text-red-600">
                      {errors.cardNumber.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardholderName">Cardholder Name</Label>
                  <Input
                    id="cardholderName"
                    placeholder="John Doe"
                    {...register('cardholderName')}
                  />
                  {errors.cardholderName && (
                    <p className="text-sm text-red-600">
                      {errors.cardholderName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryMonth">Month</Label>
                  <Select
                    onValueChange={value => setValue('expiryMonth', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem
                          key={i + 1}
                          value={(i + 1).toString().padStart(2, '0')}
                        >
                          {(i + 1).toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryYear">Year</Label>
                  <Select
                    onValueChange={value => setValue('expiryYear', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="YYYY" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() + i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    type="password"
                    {...register('cvv')}
                  />
                  {errors.cvv && (
                    <p className="text-sm text-red-600">{errors.cvv.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Save Payment Method */}
          {selectedPaymentMethod === 'new_card' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="savePaymentMethod"
                {...register('savePaymentMethod')}
              />
              <Label htmlFor="savePaymentMethod" className="text-sm">
                Save this payment method for future use
              </Label>
            </div>
          )}

          {/* Terms and Conditions */}
          <div className="flex items-center space-x-2">
            <Checkbox id="termsAccepted" {...register('termsAccepted')} />
            <Label htmlFor="termsAccepted" className="text-sm">
              I agree to the{' '}
              <a href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </Label>
          </div>
          {errors.termsAccepted && (
            <p className="text-sm text-red-600">
              {errors.termsAccepted.message}
            </p>
          )}

          {/* Security Notice */}
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Shield className="h-4 w-4 text-green-600" />
            <div className="text-sm text-green-800">
              <strong>Secure Payment:</strong> Your payment information is
              encrypted and processed securely.
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Pay {currency} ${amount.toFixed(2)}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
