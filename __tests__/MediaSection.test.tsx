import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MediaSection from '../components/events/create/MediaSection';

describe('MediaSection', () => {
  it('muestra loading y deshabilita el botón cuando isChecking=true', () => {
    const onSelect = jest.fn();
  const { getByText, getByTestId, queryByTestId } = render(
      <MediaSection
        photoFile={null}
        videoLink=""
        musicLink=""
        onSelectPhoto={onSelect}
        onChangeVideo={() => {}}
        onChangeMusic={() => {}}
        isChecking={true}
      />
    );

    // El texto del botón no debe estar (porque muestra ActivityIndicator en su lugar)
    expect(() => getByText('SELECCIONAR ARCHIVO')).toThrow();

    // El botón está deshabilitado y se muestra loading
  const btn = getByTestId('select-button');
  // Intentar presionar el botón no debe invocar onSelectPhoto porque está deshabilitado
  fireEvent.press(btn);
  expect(onSelect).not.toHaveBeenCalled();
  // Loading indicator debe estar presente
  const loading = queryByTestId('select-loading');
  expect(loading).toBeTruthy();
  });
});
