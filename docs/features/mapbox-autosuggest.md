# Mapbox Address Autosuggest

## Overview

The Mapbox Address Autosuggest component provides intelligent address suggestions using Mapbox's Geocoding API. It's designed specifically for New Zealand addresses and integrates seamlessly with React Hook Form.

## Features

- ✅ **Real-time suggestions** - As you type, get instant address suggestions
- ✅ **New Zealand focused** - Results are restricted to New Zealand addresses
- ✅ **Keyboard navigation** - Use arrow keys to navigate suggestions
- ✅ **Coordinate storage** - Automatically stores latitude/longitude coordinates
- ✅ **Form integration** - Works seamlessly with React Hook Form
- ✅ **Accessibility** - Full keyboard navigation and screen reader support

## Usage

### Basic Implementation

```tsx
import { FormProvider, useForm } from 'react-hook-form';
import AddressAutosuggest from '@/components/features/user/AddressAutosuggest';

function MyForm() {
  const methods = useForm();

  return (
    <FormProvider {...methods}>
      <form>
        <AddressAutosuggest
          name="address"
          placeholder="Start typing your address..."
          onAddressSelect={(address, coordinates) => {
            console.log('Selected:', address);
            console.log('Coordinates:', coordinates);
          }}
        />
      </form>
    </FormProvider>
  );
}
```

### Advanced Implementation with Coordinates

```tsx
<AddressAutosuggest
  name="address"
  placeholder="Enter your business address..."
  coordinatesFieldName="address_coordinates"
  onAddressSelect={(address, coordinates) => {
    // Handle address selection
    console.log('Address:', address);
    console.log('Coordinates:', coordinates);
  }}
/>
```

## Props

| Prop                   | Type       | Required | Description                             |
| ---------------------- | ---------- | -------- | --------------------------------------- |
| `name`                 | `string`   | ✅       | Form field name for React Hook Form     |
| `placeholder`          | `string`   | ❌       | Input placeholder text                  |
| `className`            | `string`   | ❌       | Additional CSS classes                  |
| `onAddressSelect`      | `function` | ❌       | Callback when address is selected       |
| `coordinatesFieldName` | `string`   | ❌       | Field name to store coordinates as JSON |

## Environment Setup

### 1. Get Mapbox Token

1. Go to [Mapbox](https://mapbox.com) and create an account
2. Navigate to your account dashboard
3. Create a new access token or use the default public token
4. Copy the token

### 2. Configure Environment Variables

Add to your `.env.local` file:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token-here
```

### 3. Verify Configuration

The component will automatically check for the Mapbox token and show a warning in the console if it's not configured.

## API Integration

The component uses Mapbox's Geocoding API with the following configuration:

- **Country**: Restricted to New Zealand (`NZ`)
- **Types**: `address,poi,place`
- **Limit**: 5 suggestions maximum
- **Debounce**: 300ms delay to prevent excessive API calls

## Keyboard Navigation

- **Arrow Down**: Navigate to next suggestion
- **Arrow Up**: Navigate to previous suggestion
- **Enter**: Select highlighted suggestion
- **Escape**: Close suggestions dropdown

## Styling

The component uses Tailwind CSS classes and can be customized with the `className` prop:

```tsx
<AddressAutosuggest
  name="address"
  className="custom-input-class"
  placeholder="Custom placeholder..."
/>
```

## Error Handling

The component gracefully handles:

- Missing Mapbox token (shows warning in console)
- Network errors (shows "No addresses found" message)
- Invalid responses (falls back to empty suggestions)

## Performance

- **Debounced search**: 300ms delay prevents excessive API calls
- **Minimum query length**: 3 characters required before searching
- **Result caching**: Suggestions are cached during the session
- **Cleanup**: Properly cleans up timeouts and event listeners

## Accessibility

- **ARIA labels**: Proper labeling for screen readers
- **Keyboard navigation**: Full keyboard support
- **Focus management**: Proper focus handling
- **Screen reader support**: Announcements for selection changes

## Examples

### Profile Form Integration

```tsx
// In ProfileForm.tsx
<AddressAutosuggest
  name="address"
  placeholder="Start typing your address..."
  coordinatesFieldName="address_coordinates"
  onAddressSelect={(address, coordinates) => {
    console.log('Selected address:', address);
    console.log('Coordinates:', coordinates);
  }}
/>
```

### Custom Styling

```tsx
<AddressAutosuggest
  name="address"
  className="border-2 border-blue-300 focus:border-blue-500"
  placeholder="Enter your address..."
/>
```

## Troubleshooting

### Common Issues

1. **No suggestions appearing**
   - Check if `NEXT_PUBLIC_MAPBOX_TOKEN` is set
   - Verify the token is valid and has geocoding permissions
   - Check browser console for errors

2. **Suggestions not working**
   - Ensure you're using `FormProvider` from React Hook Form
   - Check that the `name` prop matches your form field
   - Verify the component is inside a form with `FormProvider`

3. **Styling issues**
   - The component uses Tailwind CSS classes
   - Ensure Tailwind is properly configured
   - Check for CSS conflicts

### Debug Mode

Enable debug logging by checking the browser console. The component logs:

- API requests and responses
- Selection events
- Error messages

## Future Enhancements

- [ ] Support for multiple countries
- [ ] Custom suggestion templates
- [ ] Address validation
- [ ] Reverse geocoding
- [ ] Batch geocoding support
