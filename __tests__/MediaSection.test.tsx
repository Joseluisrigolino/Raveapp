import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ImagePickerComponent from '@/components/common/ImagePickerComponent';

describe('MediaSection', () => {
  it('renderiza ImagePickerComponent y muestra label y botón', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <ImagePickerComponent value={null} onChange={onChange} />
    );

    // Label y texto del botón deben estar presentes
    expect(getByText('Imagen')).toBeTruthy();
    expect(getByText('Seleccionar imagen')).toBeTruthy();
  });
});
